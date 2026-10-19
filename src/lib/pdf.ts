import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  PDFHexString,
  beginText,
  endText,
  setFontAndSize,
  setFillingRgbColor,
  setTextMatrix,
  showText,
  pushGraphicsState,
  popGraphicsState,
} from 'pdf-lib';
import * as fontkit from 'fontkit';
type Fontkit = Parameters<PDFDocument['registerFontkit']>[0];
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
let sourceFonts: Promise<Buffer[]> | undefined;
const fontSources = () =>
  (sourceFonts ??= Promise.all(
    ['latin', 'gujarati', 'devanagari'].map((name) =>
      readFile(join(process.cwd(), 'public', 'fonts', name + '.ttf')),
    ),
  ));
export async function documentPdf(record: Record<string, any>, kind = 'Invoice') {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit({
    create: (bytes: Uint8Array) => fontkit.create(Buffer.from(bytes)),
  } as unknown as Fontkit);
  const sources = await fontSources();
  const [latin, gujarati, devanagari] = await Promise.all(
    sources.map((bytes) => pdf.embedFont(bytes, { subset: false })),
  );
  const display = await pdf.embedFont(StandardFonts.TimesRoman);
  const shapingFonts = new Map<PDFFont, fontkit.Font>(
    [latin, gujarati, devanagari].map((font, i) => [
      font,
      fontkit.create(sources[i]) as fontkit.Font,
    ]),
  );
  const advance = (font: PDFFont, text: string, size: number) => {
    const shape = shapingFonts.get(font);
    return shape
      ? (shape.layout(text).positions.reduce((n, p) => n + p.xAdvance, 0) * size) / shape.unitsPerEm
      : font.widthOfTextAtSize(text, size);
  };
  let page = pdf.addPage([595, 842]),
    y = 790;
  const fontFor = (text: string, heading = false): PDFFont => {
    const cp = text.codePointAt(0) ?? 32;
    return cp >= 0xa80 && cp <= 0xaff
      ? gujarati
      : cp >= 0x900 && cp <= 0x97f
        ? devanagari
        : heading
          ? display
          : latin;
  };
  const runs = (text: string, heading = false) => {
    const result: { text: string; font: PDFFont }[] = [];
    for (const character of text) {
      const font = fontFor(character, heading);
      if (result.length && result[result.length - 1].font === font)
        result[result.length - 1].text += character;
      else result.push({ text: character, font });
    }
    return result;
  };
  const width = (text: string, size: number, heading = false) =>
    runs(text, heading).reduce((n, r) => n + advance(r.font, r.text, size), 0);
  const line = (input: unknown, size = 10) => {
    const text = String(input ?? '')
      .replace(/₹/g, 'INR ')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
    const heading = size > 18;
    const words = text.split(/\s+/);
    let row = '';
    const draw = (s: string) => {
      if (y < 60) {
        page = pdf.addPage([595, 842]);
        y = 790;
      }
      let x = 48;
      for (const run of runs(s, heading)) {
        const shaper = shapingFonts.get(run.font);
        if (!shaper) {
          page.drawText(run.text, { x, y, size, font: run.font, color: rgb(0.24, 0.04, 0.08) });
          x += advance(run.font, run.text, size);
          continue;
        }
        // pdf-lib's high-level text ignores OpenType mark offsets. Position shaped glyphs explicitly.
        run.font.encodeText(run.text);
        const shaped = shaper.layout(run.text),
          scale = size / shaper.unitsPerEm,
          key = page.node.newFontDictionary(run.font.name, run.font.ref);
        page.pushOperators(
          pushGraphicsState(),
          beginText(),
          setFontAndSize(key, size),
          setFillingRgbColor(0.24, 0.04, 0.08),
        );
        for (let i = 0; i < shaped.glyphs.length; i++) {
          const position = shaped.positions[i],
            glyph = shaped.glyphs[i];
          page.pushOperators(
            setTextMatrix(1, 0, 0, 1, x + position.xOffset * scale, y + position.yOffset * scale),
            showText(PDFHexString.of(glyph.id.toString(16).padStart(4, '0'))),
          );
          x += position.xAdvance * scale;
        }
        page.pushOperators(endText(), popGraphicsState());
      }
      y -= size * 1.9;
    };
    for (const word of words) {
      const next = row ? row + ' ' + word : word;
      if (width(next, size, heading) <= 499) {
        row = next;
        continue;
      }
      if (row) draw(row);
      row = '';
      if (width(word, size, heading) <= 499) {
        row = word;
        continue;
      }
      const segments = new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(word);
      for (const part of segments) {
        if (width(row + part.segment, size, heading) > 499 && row) {
          draw(row);
          row = '';
        }
        row += part.segment;
      }
    }
    if (row) draw(row);
  };
  const money = (n: number) => 'INR ' + (n / 100).toFixed(2),
    s = record.snapshot ?? {};
  line(s.issuer?.name ?? 'UMIYA FLORIST', 27);
  line(kind + ' ' + (s.number_label ?? 'UF-' + record.number), 18);
  line('Issued: ' + String(record.created_at).slice(0, 10));
  line('Due / valid until: ' + (record.due_date ?? record.valid_until));
  y -= 14;
  if (s.issuer?.address) line(s.issuer.address);
  if (s.issuer?.gstin) line('GSTIN: ' + s.issuer.gstin);
  line('Bill to: ' + (s.customer?.name ?? record.customer_name ?? ''), 14);
  if (s.customer?.billing_address) line(s.customer.billing_address);
  if (record.period) line('Billing month: ' + record.period.slice(0, 7));
  y -= 14;
  for (const item of s.items ?? [])
    line(
      `${item.description} | ${item.quantity} x ${money(item.unit_price)} | ${money(item.amount)}`,
    );
  for (const item of s.adjustments ?? []) line(`${item.description} | ${money(item.amount)}`);
  if (s.description) line(s.description);
  y -= 14;
  if (s.tax_bps) {
    line('Subtotal: ' + money(s.subtotal));
    line(`Tax (${s.tax_bps / 100}%): ${money(s.tax_amount)}`);
  }
  line('Total: ' + money(record.total), 17);
  if (kind === 'Invoice' || kind === 'Draft invoice') {
    if (record.credits) line('Credit notes: ' + money(record.credits));
    line('Net payments after refunds: ' + money(record.paid ?? 0));
    line(
      'Balance due: ' +
        money(record.balance ?? record.total - (record.credits ?? 0) - (record.paid ?? 0)),
      15,
    );
  }
  if (!s.tax_bps) line('No GST charged.');
  if (s.issuer?.payment_instructions) line(s.issuer.payment_instructions);
  line(s.issuer?.invoice_footer ?? 'Thank you for choosing Umiya Florist.');
  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    p.drawLine({
      start: { x: 48, y: 47 },
      end: { x: 547, y: 47 },
      thickness: 0.5,
      color: rgb(0.76, 0.63, 0.43),
    });
    p.drawText('Umiya Florist | ' + kind + ' | Page ' + (index + 1) + ' of ' + pages.length, {
      x: 48,
      y: 31,
      size: 8,
      font: latin,
      color: rgb(0.48, 0.4, 0.34),
    });
    if (index > 0)
      p.drawText('UMIYA FLORIST  /  ' + (s.number_label ?? 'UF-' + record.number), {
        x: 48,
        y: 814,
        size: 8,
        font: latin,
        color: rgb(0.48, 0.4, 0.34),
      });
  });
  return pdf.save();
}
