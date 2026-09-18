import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { TailoredResume } from "@/lib/ai/schemas";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT = 52;
const RIGHT = 52;
const TOP = 54;
const BOTTOM = 52;
const BODY_SIZE = 9.6;
const LINE = 13.2;

function wrap(text: string, maxChars: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderTailoredResumePdf(resume: TailoredResume) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - TOP;

  function ensure(height: number) {
    if (y - height >= BOTTOM) return;
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - TOP;
  }

  function text(value: string, options?: { bold?: boolean; size?: number; indent?: number }) {
    const size = options?.size ?? BODY_SIZE;
    const indent = options?.indent ?? 0;
    const maxChars = Math.max(30, Math.floor((PAGE_WIDTH - LEFT - RIGHT - indent) / (size * 0.52)));
    const lines = wrap(value, maxChars);
    ensure(lines.length * LINE + 2);

    for (const line of lines) {
      page.drawText(line, {
        x: LEFT + indent,
        y,
        size,
        font: options?.bold ? bold : regular,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= LINE;
    }
  }

  function section(title: string) {
    ensure(28);
    y -= 7;
    page.drawText(title.toUpperCase(), {
      x: LEFT,
      y,
      size: 9,
      font: bold,
      color: rgb(0.22, 0.22, 0.22),
    });
    y -= 15;
  }

  if (resume.headline) {
    text(resume.headline, { bold: true, size: 15 });
    y -= 3;
  }

  text(resume.professionalSummary, { size: 9.8 });

  if (resume.skills.length) {
    section("Skills");
    text(resume.skills.join(" • "), { size: 9.2 });
  }

  if (resume.roles.length) {
    section("Experience");
    for (const role of resume.roles) {
      ensure(36);
      text(role.title, { bold: true, size: 10.4 });
      const companyLine = [role.company, [role.start, role.end].filter(Boolean).join(" – ")]
        .filter(Boolean)
        .join(" | ");
      if (companyLine) text(companyLine, { size: 9 });
      for (const bullet of role.bullets) {
        text(`• ${bullet}`, { indent: 10, size: 9.3 });
      }
      y -= 5;
    }
  }

  if (resume.certifications.length) {
    section("Certifications");
    text(resume.certifications.join(" • "), { size: 9.2 });
  }

  if (resume.education.length) {
    section("Education");
    for (const item of resume.education) {
      text(
        [item.degree, item.field, item.institution].filter(Boolean).join(" | "),
        { size: 9.3 }
      );
    }
  }

  return pdf.save();
}
