import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  PageBreak,
} from 'docx';
import { StructuredDocument, DocumentElement, TableElement } from '../types/document';

/**
 * Generates an editable Microsoft Word (.docx) document from structured OCR data.
 */
export async function generateWordDocument(
  docData: StructuredDocument,
  options?: { primaryColor?: string; headerBg?: string }
): Promise<Blob> {
  const primaryColorHex = (options?.primaryColor || '#1E3A8A').replace('#', '');
  const headerBgHex = (options?.headerBg || '#1E3A8A').replace('#', '');
  const zebraBgHex = 'F8FAFC';

  const docChildren: (Paragraph | Table)[] = [];

  // Document Title Header
  if (docData.documentTitle) {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: docData.documentTitle,
            bold: true,
            size: 36, // 18pt
            color: primaryColorHex,
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // Iterate pages
  docData.pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      docChildren.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    // Process elements on this page
    for (const element of page.elements) {
      const rendered = renderElement(element, { primaryColorHex, headerBgHex, zebraBgHex });
      if (Array.isArray(rendered)) {
        docChildren.push(...rendered);
      } else if (rendered) {
        docChildren.push(rendered);
      }
    }
  });

  // Create docx document
  const wordDoc = new Document({
    creator: 'OmniDoc AI OCR Engine',
    title: docData.documentTitle || 'Converted Document',
    description: docData.ocrSummary || 'Converted from PDF with OCR reading capability',
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22, // 11pt
            color: '1E293B',
          },
          paragraph: {
            spacing: { line: 280, after: 120 },
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: docChildren.length > 0 ? docChildren : [
          new Paragraph({
            children: [new TextRun('No text content was detected in this document.')],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(wordDoc);
}

function renderElement(
  elem: DocumentElement,
  theme: { primaryColorHex: string; headerBgHex: string; zebraBgHex: string }
): Paragraph | Table | (Paragraph | Table)[] | null {
  switch (elem.type) {
    case 'heading': {
      let headingLevel: any = HeadingLevel.HEADING_2;
      let fontSize = 28; // 14pt
      if (elem.level === 1) {
        headingLevel = HeadingLevel.HEADING_1;
        fontSize = 32; // 16pt
      } else if (elem.level === 3) {
        headingLevel = HeadingLevel.HEADING_3;
        fontSize = 24; // 12pt
      }

      let alignment: any = AlignmentType.LEFT;
      if (elem.alignment === 'center') alignment = AlignmentType.CENTER;
      if (elem.alignment === 'right') alignment = AlignmentType.RIGHT;

      return new Paragraph({
        heading: headingLevel,
        alignment,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: elem.text,
            bold: true,
            size: fontSize,
            color: theme.primaryColorHex,
            font: 'Arial',
          }),
        ],
      });
    }

    case 'paragraph': {
      let alignment: any = AlignmentType.LEFT;
      if (elem.alignment === 'center') alignment = AlignmentType.CENTER;
      if (elem.alignment === 'right') alignment = AlignmentType.RIGHT;
      if (elem.alignment === 'justify') alignment = AlignmentType.JUSTIFIED;

      const runs = (elem.runs || []).map((run) => {
        return new TextRun({
          text: run.text,
          bold: !!run.bold,
          italics: !!run.italic,
          underline: run.underline ? {} : undefined,
          color: run.color ? run.color.replace('#', '') : undefined,
          font: 'Arial',
          size: run.fontSize ? run.fontSize * 2 : 22,
        });
      });

      return new Paragraph({
        alignment,
        spacing: { after: 140 },
        children: runs.length > 0 ? runs : [new TextRun('')],
      });
    }

    case 'list': {
      return (elem.items || []).map((item, index) => {
        return new Paragraph({
          bullet: elem.ordered ? undefined : { level: 0 },
          numbering: elem.ordered ? { reference: 'numbered-list', level: 0 } : undefined,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: elem.ordered ? `${index + 1}. ${item}` : item,
              font: 'Arial',
            }),
          ],
        });
      });
    }

    case 'key-value': {
      return new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `${elem.label}: `,
            bold: true,
            color: '334155',
            font: 'Arial',
          }),
          new TextRun({
            text: elem.value,
            font: 'Arial',
          }),
        ],
      });
    }

    case 'table': {
      return renderTable(elem, theme);
    }

    default:
      return null;
  }
}

function renderTable(
  elem: TableElement,
  theme: { primaryColorHex: string; headerBgHex: string; zebraBgHex: string }
): Table {
  const rows: TableRow[] = [];
  const colCount = Math.max(
    elem.headers?.length || 0,
    ...(elem.rows || []).map((r) => r.length),
    1
  );

  const cellBorder = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: 'CBD5E1',
  };

  const borders = {
    top: cellBorder,
    bottom: cellBorder,
    left: cellBorder,
    right: cellBorder,
  };

  // Header Row
  if (elem.headers && elem.headers.length > 0) {
    const headerCells = elem.headers.map((h, colIndex) => {
      const align = elem.alignments?.[colIndex] || 'left';
      let docxAlign: any = AlignmentType.LEFT;
      if (align === 'center') docxAlign = AlignmentType.CENTER;
      if (align === 'right') docxAlign = AlignmentType.RIGHT;

      return new TableCell({
        shading: {
          type: ShadingType.SOLID,
          color: theme.headerBgHex,
        },
        borders,
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [
          new Paragraph({
            alignment: docxAlign,
            children: [
              new TextRun({
                text: String(h || ''),
                bold: true,
                color: 'FFFFFF',
                font: 'Arial',
                size: 20, // 10pt
              }),
            ],
          }),
        ],
      });
    });

    rows.push(new TableRow({ children: headerCells, tableHeader: true }));
  }

  // Body Rows
  (elem.rows || []).forEach((row, rowIndex) => {
    const isZebra = rowIndex % 2 === 1;
    const isTotalRow = elem.hasTotalRow && rowIndex === (elem.rows.length - 1);

    const cells: TableCell[] = [];
    for (let c = 0; c < colCount; c++) {
      const cellVal = row[c] !== undefined ? String(row[c]) : '';
      const align = elem.alignments?.[c] || 'left';
      let docxAlign: any = AlignmentType.LEFT;
      if (align === 'center') docxAlign = AlignmentType.CENTER;
      if (align === 'right') docxAlign = AlignmentType.RIGHT;

      cells.push(
        new TableCell({
          shading: isTotalRow
            ? { type: ShadingType.SOLID, color: 'E2E8F0' }
            : isZebra
            ? { type: ShadingType.SOLID, color: theme.zebraBgHex }
            : undefined,
          borders,
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [
            new Paragraph({
              alignment: docxAlign,
              children: [
                new TextRun({
                  text: cellVal,
                  bold: isTotalRow,
                  color: isTotalRow ? '0F172A' : '334155',
                  font: 'Arial',
                  size: 20,
                }),
              ],
            }),
          ],
        })
      );
    }
    rows.push(new TableRow({ children: cells }));
  });

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows,
  });
}
