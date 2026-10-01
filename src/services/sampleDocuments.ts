import { StructuredDocument } from '../types/document';

export interface SampleDoc {
  id: string;
  name: string;
  category: 'Invoice / Financial' | 'Business Report' | 'Legal Contract';
  size: number;
  description: string;
  pageCount: number;
  tags: string[];
  mockData: StructuredDocument;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'sample-invoice-01',
    name: 'Scanned_Commercial_Invoice_INV2024.pdf',
    category: 'Invoice / Financial',
    size: 245800,
    pageCount: 1,
    tags: ['OCR Scanned', 'Complex Table', 'Currency Columns'],
    description: 'B2B equipment and cloud migration invoice with itemized pricing, tax breakdowns, and customer billing address.',
    mockData: {
      documentTitle: 'COMMERCIAL TAX INVOICE',
      pageCount: 1,
      confidenceScore: 0.99,
      detectedLanguage: 'English (US)',
      ocrSummary: 'Accurately recognized scanned commercial tax invoice with 5-column line item pricing and customer account details.',
      pages: [
        {
          pageNumber: 1,
          elements: [
            {
              type: 'heading',
              level: 1,
              text: 'NEXUS TECHNOLOGIES CORP - INVOICE #NX-88492',
              alignment: 'center',
              isBold: true,
            },
            {
              type: 'key-value',
              label: 'Invoice Date',
              value: 'October 12, 2026',
            },
            {
              type: 'key-value',
              label: 'Payment Due Date',
              value: 'November 11, 2026 (Net 30)',
            },
            {
              type: 'key-value',
              label: 'Billed To Client',
              value: 'Apex Global Logistics Inc., 742 Market St, Suite 400, San Francisco, CA',
            },
            {
              type: 'key-value',
              label: 'Tax Identification Number',
              value: 'US-EIN-84-9921034',
            },
            {
              type: 'heading',
              level: 2,
              text: 'Itemized Deliverables & Cloud Subscriptions',
              alignment: 'left',
              isBold: true,
            },
            {
              type: 'table',
              title: 'Line Item Summary',
              headers: ['SKU / Ref', 'Item Description', 'Qty', 'Unit Price', 'Amount (USD)'],
              rows: [
                ['NX-SRV-01', 'Enterprise Cloud OCR & Vision Cluster (Quarterly)', '1', '$4,800.00', '$4,800.00'],
                ['NX-DOC-99', 'Document Parsing API Throughput (100k pages)', '3', '$350.00', '$1,050.00'],
                ['NX-ENG-04', 'Custom Workflow & Google Drive Integration', '18 hrs', '$175.00', '$3,150.00'],
                ['NX-SEC-02', 'High-Availability Security & Encryption Module', '1', '$1,200.00', '$1,200.00'],
                ['SUBTOTAL', '', '', '', '$10,200.00'],
                ['STATE TAX (8.5%)', '', '', '', '$867.00'],
                ['TOTAL BALANCE DUE', '', '', '', '$11,067.00'],
              ],
              alignments: ['left', 'left', 'right', 'right', 'right'],
              columnTypes: ['string', 'string', 'number', 'currency', 'currency'],
              hasHeader: true,
              hasTotalRow: true,
            },
            {
              type: 'paragraph',
              runs: [
                { text: 'Payment Remittance: ', bold: true },
                { text: 'Please send ACH transfer to Silicon Valley Bank, Account #98234-9982, Routing #121000358.' },
              ],
              alignment: 'left',
            },
            {
              type: 'paragraph',
              runs: [
                { text: 'Terms & Conditions: ', bold: true, italic: true },
                { text: 'Late payments are subject to a 1.5% monthly financing surcharge. Thank you for your partnership.', italic: true },
              ],
              alignment: 'left',
            },
          ],
        },
      ],
      spreadsheets: [
        {
          sheetName: 'Invoice Line Items',
          headers: ['SKU / Ref', 'Item Description', 'Qty', 'Unit Price', 'Amount (USD)'],
          rows: [
            ['NX-SRV-01', 'Enterprise Cloud OCR & Vision Cluster (Quarterly)', 1, 4800, 4800],
            ['NX-DOC-99', 'Document Parsing API Throughput (100k pages)', 3, 350, 1050],
            ['NX-ENG-04', 'Custom Workflow & Google Drive Integration', 18, 175, 3150],
            ['NX-SEC-02', 'High-Availability Security & Encryption Module', 1, 1200, 1200],
            ['SUBTOTAL', '', '', '', 10200],
            ['STATE TAX (8.5%)', '', '', '', 867],
            ['TOTAL BALANCE DUE', '', '', '', 11067],
          ],
          summary: 'Invoice Line items with numerical pricing and totals',
        },
      ],
    },
  },
  {
    id: 'sample-report-02',
    name: 'Quarterly_Financial_Performance_Q3.pdf',
    category: 'Business Report',
    size: 489200,
    pageCount: 2,
    tags: ['Multi-Page', 'KPI Metrics', 'Comparative Table'],
    description: 'Executive quarterly operations review with revenue breakdown, year-over-year margins, and regional growth tables.',
    mockData: {
      documentTitle: 'Q3 EXECUTIVE PERFORMANCE & FINANCIAL REVIEW',
      pageCount: 2,
      confidenceScore: 0.98,
      detectedLanguage: 'English',
      ocrSummary: 'Extracted 2-page report with multi-level headings, executive narrative, and 2 distinct financial comparative tables.',
      pages: [
        {
          pageNumber: 1,
          elements: [
            {
              type: 'heading',
              level: 1,
              text: 'Executive Summary - Fiscal Q3 Performance',
              alignment: 'left',
              isBold: true,
            },
            {
              type: 'paragraph',
              runs: [
                { text: 'During the third quarter, consolidated revenue reached ' },
                { text: '$42.8 Million', bold: true },
                { text: ', representing a ' },
                { text: '23.4% YoY increase', bold: true },
                { text: ' driven by strong enterprise adoption of automated document intelligence workflows and cloud sync integrations.' },
              ],
              alignment: 'justify',
            },
            {
              type: 'heading',
              level: 2,
              text: 'Segment Revenue Breakdown (in Millions USD)',
              alignment: 'left',
              isBold: true,
            },
            {
              type: 'table',
              title: 'Segment Performance',
              headers: ['Business Segment', 'Q3 2025', 'Q3 2026', 'Variance ($)', 'Growth (%)'],
              rows: [
                ['Enterprise Document Automation', '$14.2M', '$19.8M', '+$5.6M', '+39.4%'],
                ['Cloud Storage & Sync Connectors', '$9.6M', '$12.4M', '+$2.8M', '+29.2%'],
                ['Professional Advisory Services', '$6.4M', '$6.1M', '-$0.3M', '-4.7%'],
                ['Developer APIs & SDK Licenses', '$4.5M', '$4.5M', '$0.0M', '0.0%'],
                ['Consolidated Total', '$34.7M', '$42.8M', '+$8.1M', '+23.3%'],
              ],
              alignments: ['left', 'right', 'right', 'right', 'right'],
              columnTypes: ['string', 'currency', 'currency', 'currency', 'string'],
              hasHeader: true,
              hasTotalRow: true,
            },
          ],
        },
        {
          pageNumber: 2,
          elements: [
            {
              type: 'heading',
              level: 2,
              text: 'Key Operational Highlights & Milestones',
              alignment: 'left',
              isBold: true,
            },
            {
              type: 'list',
              ordered: false,
              items: [
                'Processed over 14.8 million PDF pages through high-speed OCR pipeline.',
                'Deployed native Google Drive cloud storage synchronisation with zero-touch background exports.',
                'Maintained 99.98% service uptime across all multi-tenant processing nodes.',
                'Expanded Word and Excel export engines with strict typography and cell format fidelity.',
              ],
            },
            {
              type: 'heading',
              level: 2,
              text: 'Regional Operating Margins',
              alignment: 'left',
              isBold: true,
            },
            {
              type: 'table',
              title: 'Regional Breakdown',
              headers: ['Region', 'Active Clients', 'Gross Margin', 'Net Retention'],
              rows: [
                ['North America (US & CA)', '1,420', '78.4%', '118%'],
                ['Europe & UK (EMEA)', '890', '74.1%', '112%'],
                ['Asia Pacific (APAC)', '640', '71.5%', '124%'],
              ],
              alignments: ['left', 'right', 'right', 'right'],
              columnTypes: ['string', 'number', 'string', 'string'],
              hasHeader: true,
            },
          ],
        },
      ],
      spreadsheets: [
        {
          sheetName: 'Segment Revenue',
          headers: ['Business Segment', 'Q3 2025 ($M)', 'Q3 2026 ($M)', 'Variance ($M)', 'Growth (%)'],
          rows: [
            ['Enterprise Document Automation', 14.2, 19.8, 5.6, '39.4%'],
            ['Cloud Storage & Sync Connectors', 9.6, 12.4, 2.8, '29.2%'],
            ['Professional Advisory Services', 6.4, 6.1, -0.3, '-4.7%'],
            ['Developer APIs & SDK Licenses', 4.5, 4.5, 0.0, '0.0%'],
            ['Consolidated Total', 34.7, 42.8, 8.1, '23.3%'],
          ],
        },
        {
          sheetName: 'Regional Margins',
          headers: ['Region', 'Active Clients', 'Gross Margin (%)', 'Net Retention (%)'],
          rows: [
            ['North America (US & CA)', 1420, '78.4%', '118%'],
            ['Europe & UK (EMEA)', 890, '74.1%', '112%'],
            ['Asia Pacific (APAC)', 640, '71.5%', '124%'],
          ],
        },
      ],
    },
  },
  {
    id: 'sample-contract-03',
    name: 'Master_Services_Agreement_SaaS.pdf',
    category: 'Legal Contract',
    size: 320100,
    pageCount: 2,
    tags: ['Formatted Clauses', 'Legal Text', 'Numbered Outlines'],
    description: 'Standard software and cloud processing master services agreement with defined warranties, confidentiality, and signature lines.',
    mockData: {
      documentTitle: 'MASTER CLOUD SERVICES AGREEMENT',
      pageCount: 2,
      confidenceScore: 0.99,
      detectedLanguage: 'English',
      ocrSummary: 'Extracted legal document structure with hierarchical numbered sections, defined party terms, and execution signature block.',
      pages: [
        {
          pageNumber: 1,
          elements: [
            {
              type: 'heading',
              level: 1,
              text: 'MASTER CLOUD SERVICES & DATA PROCESSING AGREEMENT',
              alignment: 'center',
              isBold: true,
            },
            {
              type: 'paragraph',
              runs: [
                { text: 'This Master Services Agreement ("Agreement") is entered into as of the Effective Date by and between ' },
                { text: 'OmniDoc Technologies, LLC', bold: true },
                { text: ' ("Provider"), and the subscribing entity ("Customer").' },
              ],
              alignment: 'justify',
            },
            {
              type: 'heading',
              level: 2,
              text: '1. Services & Grant of Access',
              alignment: 'left',
              isBold: true,
            },
            {
              type: 'list',
              ordered: true,
              items: [
                'Subject to the terms hereof, Provider hereby grants Customer a non-exclusive, non-transferable right to access and utilize the AI OCR conversion and document extraction APIs.',
                'Customer may upload files in batch format and synchronize transformed files with designated cloud storage providers.',
                'Provider shall maintain enterprise security safeguards compliant with SOC 2 Type II and ISO 27001 certifications.',
              ],
            },
            {
              type: 'heading',
              level: 2,
              text: '2. Data Confidentiality & Intellectual Property',
              alignment: 'left',
              isBold: true,
            },
            {
              type: 'paragraph',
              runs: [
                { text: 'Customer retains all right, title, and interest in and to all uploaded documents and resulting converted Word (.docx) and Excel (.xlsx) files. Provider processes customer data solely to perform conversion routines and does not train foundational public models on confidential customer documents.' },
              ],
              alignment: 'justify',
            },
          ],
        },
        {
          pageNumber: 2,
          elements: [
            {
              type: 'heading',
              level: 2,
              text: '3. Service Level Commitments & Remedies',
              alignment: 'left',
              isBold: true,
            },
            {
              type: 'table',
              title: 'SLA Commitments',
              headers: ['Monthly Uptime SLA', 'Service Credit Percentage', 'Support Response Time'],
              rows: [
                ['99.9% - 100%', '0% (Standard Target)', '< 1 hour (Critical)'],
                ['99.0% - 99.89%', '10% Billing Credit', '< 4 hours (Urgent)'],
                ['Below 99.0%', '25% Billing Credit', '< 8 hours (Normal)'],
              ],
              alignments: ['left', 'center', 'left'],
              columnTypes: ['string', 'string', 'string'],
              hasHeader: true,
            },
            {
              type: 'heading',
              level: 2,
              text: '4. Signatures & Execution',
              alignment: 'left',
              isBold: true,
            },
            {
              type: 'key-value',
              label: 'Provider Representative',
              value: 'Elena Vance, VP of Engineering',
            },
            {
              type: 'key-value',
              label: 'Customer Representative',
              value: 'Marcus Wright, Chief Technology Officer',
            },
            {
              type: 'paragraph',
              runs: [
                { text: 'IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first written above.', italic: true },
              ],
              alignment: 'center',
            },
          ],
        },
      ],
      spreadsheets: [
        {
          sheetName: 'Service Level Agreement',
          headers: ['Monthly Uptime SLA', 'Service Credit Percentage', 'Support Response Time'],
          rows: [
            ['99.9% - 100%', '0% (Standard Target)', '< 1 hour (Critical)'],
            ['99.0% - 99.89%', '10% Billing Credit', '< 4 hours (Urgent)'],
            ['Below 99.0%', '25% Billing Credit', '< 8 hours (Normal)'],
          ],
        },
      ],
    },
  },
];
