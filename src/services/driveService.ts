import { DriveFileItem } from '../types/document';

/**
 * Service to interact with Google Drive via REST API using Client Access Token
 */

export async function listDrivePdfFiles(accessToken: string): Promise<DriveFileItem[]> {
  const query = encodeURIComponent("mimeType = 'application/pdf' and trashed = false");
  const fields = encodeURIComponent('files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=40&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list Google Drive files: ${errorText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size ? formatBytes(parseInt(f.size, 10)) : 'Unknown',
    modifiedTime: f.modifiedTime,
    thumbnailLink: f.thumbnailLink,
    webViewLink: f.webViewLink,
  }));
}

export async function downloadDrivePdf(accessToken: string, fileId: string): Promise<{ blob: Blob; fileName: string }> {
  // Get metadata first for name
  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meta = await metaRes.json();
  const fileName = meta.name || 'document.pdf';

  // Download media
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download PDF from Drive (${res.status})`);
  }

  const blob = await res.blob();
  return { blob, fileName };
}

export async function getOrCreateFolder(accessToken: string, folderName = 'OmniDoc Conversions'): Promise<string> {
  const q = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id, name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create destination folder in Google Drive');
  }

  const created = await createRes.json();
  return created.id;
}

export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  mimeType: string,
  blob: Blob,
  folderName = 'OmniDoc Conversions'
): Promise<{ fileId: string; webViewLink?: string }> {
  const folderId = await getOrCreateFolder(accessToken, folderName);

  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const blobArrayBuffer = await blob.arrayBuffer();

  const multipartBody = new Blob(
    [metadataPart, mediaHeader, new Uint8Array(blobArrayBuffer), closeDelimiter],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Failed to upload to Google Drive: ${errorText}`);
  }

  const data = await uploadRes.json();
  return {
    fileId: data.id,
    webViewLink: data.webViewLink,
  };
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
