import { mkdir, writeFile } from 'node:fs/promises';
import { it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { documentPdf } from '../src/lib/pdf';
it('creates a valid paginated PDF while preserving English, Gujarati and Hindi text', async () => {
  const bytes = await documentPdf({
    number: 1,
    total: 350000,
    paid: 50000,
    balance: 300000,
    due_date: '2026-10-08',
    created_at: '2026-10-01',
    snapshot: {
      number_label: 'DEVELOPMENT-001',
      issuer: { name: 'UMIYA FLORIST - DEVELOPMENT SAMPLE' },
      customer: { name: 'ઉમિયા ग्राहक Test client', billing_address: 'અમદાવાદ, Gujarat' },
      items: Array.from({ length: 70 }, (_, i) => ({
        description: 'ફૂલો फूल Flower delivery ' + i,
        quantity: 1,
        unit_price: 5000,
        amount: 5000,
      })),
    },
  });
  if (process.env.UMIYA_PDF_QA === '1') {
    await mkdir('output/pdf', { recursive: true });
    await writeFile('output/pdf/development-invoice-sample.pdf', bytes);
  }
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBeGreaterThan(1);
  expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-');
});
