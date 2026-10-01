import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limits for handling multi-page PDFs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for resilient model execution with retry on transient spikes/503s
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1500): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const str = String(err?.message || err);
      const isTransient =
        str.includes('503') ||
        str.includes('429') ||
        str.includes('high demand') ||
        str.includes('UNAVAILABLE') ||
        str.includes('RESOURCE_EXHAUSTED');
      if (attempt < maxRetries && isTransient) {
        await new Promise((res) => setTimeout(res, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function cleanErrorMessage(err: any): string {
  const str = String(err?.message || err);
  if (str.includes('503') || str.includes('high demand') || str.includes('UNAVAILABLE')) {
    return 'The AI model is currently experiencing temporary high traffic. Please retry in a few moments.';
  }
  if (str.includes('429') || str.includes('RESOURCE_EXHAUSTED')) {
    return 'Rate limit reached. Please wait a moment before trying again.';
  }
  return err?.message || 'An error occurred during document processing.';
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Document OCR and Structure Extraction Endpoint
app.post('/api/ocr/convert', async (req: Request, res: Response) => {
  try {
    const { fileBase64, fileName, mimeType, targetFormat, targetLanguage, sourceLanguage } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 data is required.' });
    }

    // Clean base64 string if data URI prefix is present
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const documentMime = mimeType || 'application/pdf';

    const isTranslating = targetLanguage && targetLanguage !== 'none' && targetLanguage !== 'Original (No Translation)';

    const promptText = `
Please perform a high-precision OCR scan and layout analysis of this document.
Extract all structural contents into the following JSON format:

{
  "documentTitle": "Main Title of the document",
  "pageCount": 1,
  "confidenceScore": 0.98,
  "detectedLanguage": "English",
  "translatedTo": "${isTranslating ? targetLanguage : ''}",
  "ocrSummary": "Summary of the document layout and tables detected",
  "pages": [
    {
      "pageNumber": 1,
      "elements": [
        // Can be one of:
        // Heading element:
        { "type": "heading", "level": 1, "text": "...", "alignment": "left|center|right", "isBold": true },
        // Paragraph element with styled text runs:
        {
          "type": "paragraph",
          "runs": [
            { "text": "Run text", "bold": false, "italic": false, "underline": false }
          ],
          "alignment": "left|center|right|justify"
        },
        // Key-value pair:
        { "type": "key-value", "label": "Invoice Date", "value": "2026-10-01" },
        // Bullet or numbered list:
        { "type": "list", "ordered": false, "items": ["Item 1", "Item 2"] },
        // Table element:
        {
          "type": "table",
          "title": "Optional table title",
          "headers": ["Col 1", "Col 2", "Col 3"],
          "rows": [["val 1", "val 2", "val 3"]],
          "alignments": ["left", "right", "right"],
          "columnTypes": ["string", "currency", "number"],
          "hasHeader": true,
          "hasTotalRow": false
        }
      ]
    }
  ],
  "spreadsheets": [
    {
      "sheetName": "Sheet Name (Max 30 chars)",
      "headers": ["Col 1", "Col 2"],
      "rows": [["row1-col1", 100], ["row2-col1", 200]],
      "summary": "Short description of sheet"
    }
  ]
}

Formatting & Table rules:
1. Identify all tables with column headers and preserve numbers, currency symbols, and row order.
2. In 'spreadsheets', create a sheet entry for every table found in the document with sanitized sheet names.
3. For headings, classify level (1 for main title, 2 for section, 3 for sub-section).
4. Preserve bold/italic styling in paragraphs so the generated Word document looks identical to the original PDF.
5. Return ONLY valid JSON matching this schema.

${isTranslating ? `LANGUAGE TRANSLATION REQUIREMENT:
- Source Document Language: ${sourceLanguage || 'Auto-detect'}
- Target Output Language: ${targetLanguage}
- You MUST translate all titles, headings, paragraph text runs, list items, key-value labels, and table headers/cells into ${targetLanguage}.
- CRITICAL: Maintain ALL numeric figures, currencies, dates, formulas, and math intact. Do not change values.` : ''}
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: documentMime,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1, // low temperature for deterministic OCR and layout accuracy
          systemInstruction:
            'You are an expert Optical Character Recognition (OCR) and Document Layout Reconstruction model. You accurately read degraded, scanned, or complex multi-column documents, extracting pristine text, headings, styles, and structured tables.',
        },
      })
    );

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from OCR model.');
    }

    let structuredDoc;
    try {
      structuredDoc = JSON.parse(responseText.trim());
    } catch (parseErr) {
      console.error('Failed to parse Gemini response as JSON. Raw response:', responseText);
      throw new Error('OCR response was not in expected JSON format.');
    }

    // Ensure fallback fields exist
    if (!structuredDoc.documentTitle) {
      structuredDoc.documentTitle = fileName?.replace(/\.[^/.]+$/, '') || 'Converted Document';
    }
    if (!structuredDoc.pages || !Array.isArray(structuredDoc.pages)) {
      structuredDoc.pages = [
        {
          pageNumber: 1,
          elements: [
            {
              type: 'paragraph',
              runs: [{ text: responseText.slice(0, 2000) }],
              alignment: 'left',
            },
          ],
        },
      ];
    }
    if (!structuredDoc.spreadsheets) {
      structuredDoc.spreadsheets = [];
    }

    return res.json({
      success: true,
      document: structuredDoc,
    });
  } catch (error: any) {
    console.error('OCR processing error:', error);
    return res.status(500).json({
      error: cleanErrorMessage(error),
    });
  }
});

// On-Demand Document Translation Endpoint
app.post('/api/document/translate', async (req: Request, res: Response) => {
  try {
    const { document, targetLanguage, sourceLanguage } = req.body;

    if (!document || !targetLanguage || targetLanguage === 'none') {
      return res.status(400).json({ error: 'Valid document and targetLanguage are required.' });
    }

    const promptText = `
You are an expert technical and document translator.
Translate the following structured document into ${targetLanguage} (Source language: ${sourceLanguage || 'Auto-detect'}).

INPUT DOCUMENT JSON:
${JSON.stringify(document, null, 2)}

TRANSLATION RULES:
1. Translate all headings, text runs in paragraphs, list items, key-value labels/values, and table headers/cells into ${targetLanguage}.
2. PRESERVE EXACT JSON SCHEMA AND STRUCTURE. Do NOT add or remove pages or elements.
3. PRESERVE ALL NUMERICAL DATA, CURRENCIES, DATES, AND MEASUREMENTS.
4. Set "translatedTo": "${targetLanguage}" in the root object.
5. Return ONLY the translated JSON document matching the exact schema.
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ text: promptText }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          systemInstruction:
            'You are an expert document translation engine. You preserve layout, typography, table cells, and JSON schema while accurately translating human language.',
        },
      })
    );

    const translatedText = response.text;
    if (!translatedText) {
      throw new Error('Empty response from translation model.');
    }

    let translatedDoc;
    try {
      translatedDoc = JSON.parse(translatedText.trim());
    } catch (parseErr) {
      console.error('Failed to parse translation as JSON:', translatedText);
      throw new Error('Translation response was not valid JSON.');
    }

    return res.json({ success: true, document: translatedDoc });
  } catch (error: any) {
    console.error('Document translation error:', error);
    return res.status(500).json({ error: cleanErrorMessage(error) });
  }
});

// AI Document Intelligence & App Assistant Chatbot Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, documentContext, batchContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    let systemInstruction = `You are OmniDoc Assistant, an expert AI Document Intelligence and App Copilot.
You assist users with:
1. Converting PDF files to editable Word (.docx) and Excel (.xlsx) documents while preserving exact layout and typography.
2. Answering questions about the contents, numbers, tables, invoices, contracts, or summaries of the uploaded/converted documents.
3. Helping with batch processing and Google Drive cloud synchronisation.
4. Explaining OCR confidence, cell calculations, or suggested edits.

Be helpful, concise, well-structured, and use clean markdown with bullet points or tables where appropriate.`;

    if (documentContext) {
      systemInstruction += `\n\n--- CURRENT DOCUMENT CONTEXT IN STUDIO ---\n` +
        `Title: ${documentContext.documentTitle}\n` +
        `OCR Confidence: ${Math.round((documentContext.confidenceScore || 0.98) * 100)}%\n` +
        `Summary: ${documentContext.ocrSummary}\n` +
        `Pages: ${JSON.stringify(documentContext.pages)}\n` +
        `Tables/Spreadsheets: ${JSON.stringify(documentContext.spreadsheets)}`;
    }

    if (batchContext) {
      systemInstruction += `\n\n--- BATCH QUEUE & CONVERSION STATS ---\n` +
        JSON.stringify(batchContext);
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text || m.content || '' }],
    }));

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      })
    );

    const reply = response.text || 'I am ready to help you analyze or convert your documents.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({
      error: cleanErrorMessage(error),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
