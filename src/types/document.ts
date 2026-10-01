/**
 * Document & Conversion Data Types
 */

export type TargetFormat = 'word' | 'excel' | 'both';

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string; // hex color e.g. "#1E293B"
  fontSize?: number; // pt size
}

export interface HeadingElement {
  type: 'heading';
  level: 1 | 2 | 3 | 4;
  text: string;
  alignment?: 'left' | 'center' | 'right';
  isBold?: boolean;
}

export interface ParagraphElement {
  type: 'paragraph';
  runs: TextRun[];
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface ListElement {
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface KeyValueElement {
  type: 'key-value';
  label: string;
  value: string;
}

export interface TableElement {
  type: 'table';
  title?: string;
  headers: string[];
  rows: string[][];
  alignments?: ('left' | 'center' | 'right')[];
  columnTypes?: ('string' | 'number' | 'currency' | 'date')[];
  hasHeader: boolean;
  hasTotalRow?: boolean;
}

export type DocumentElement =
  | HeadingElement
  | ParagraphElement
  | ListElement
  | KeyValueElement
  | TableElement;

export interface PageStructure {
  pageNumber: number;
  elements: DocumentElement[];
}

export interface SheetStructure {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: string;
}

export interface StructuredDocument {
  documentTitle: string;
  pageCount: number;
  confidenceScore: number; // 0.0 to 1.0
  ocrSummary: string;
  detectedLanguage?: string;
  pages: PageStructure[];
  spreadsheets: SheetStructure[];
}

export type ProcessingStatus =
  | 'queued'
  | 'reading_ocr'
  | 'reconstructing_layout'
  | 'generating_files'
  | 'syncing_cloud'
  | 'completed'
  | 'error';

export interface BatchItem {
  id: string;
  name: string;
  size: number;
  file?: File;
  base64Data?: string;
  previewUrl?: string; // object URL or data URL
  targetFormat: TargetFormat;
  status: ProcessingStatus;
  progress: number; // 0 - 100
  statusMessage?: string;
  error?: string;
  
  // Conversion Output
  structuredData?: StructuredDocument;
  docxBlob?: Blob;
  xlsxBlob?: Blob;
  
  // Google Drive Cloud Sync
  driveStatus?: 'unsynced' | 'syncing' | 'synced' | 'failed';
  driveWordFileId?: string;
  driveWordLink?: string;
  driveExcelFileId?: string;
  driveExcelLink?: string;
  syncedAt?: string;
}

export interface ConversionOptions {
  preserveStyles: boolean;
  detectTablesStrict: boolean;
  autoSyncToDrive: boolean;
  headerShadingColor: string; // e.g. "#1E3A8A"
  driveFolderName: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: string; // ISO date string
  fileName: string;
  fileSize: number;
  targetFormat: TargetFormat;
  status: 'completed' | 'failed';
  confidenceScore?: number;
  durationMs?: number;
  tableCount: number;
  pageCount: number;
  ocrSummary?: string;
  error?: string;
  driveSynced: boolean;
  driveWordLink?: string;
  driveExcelLink?: string;
  structuredData?: StructuredDocument;
}

