import PDFDocument from "pdfkit";
import type { ReadingResultData } from "@/lib/toolTypes";

const DARK = "#2C3535";
const TERRACOTTA = "#D9735C";
const BROWN = "#7a6248";

export function generateReadingPdf(reading: ReadingResultData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 60, bottom: 60, left: 60, right: 60 } });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fillColor(BROWN)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("BEYOND PSYCHOLOGY", { characterSpacing: 1 });

    doc.moveDown(0.5);
    doc
      .fillColor(DARK)
      .fontSize(26)
      .font("Helvetica-Bold")
      .text("The Pattern Spotter");

    doc.moveDown(1.5);

    reading.sections.forEach((section, i) => {
      if (i > 0) doc.moveDown(1.5);

      doc
        .fillColor(TERRACOTTA)
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(section.heading, { characterSpacing: 0.5 });

      doc.moveDown(0.5);
      doc
        .fillColor(DARK)
        .fontSize(11)
        .font("Helvetica")
        .text(section.body, { align: "left", lineGap: 4 });
    });

    if (reading.sessions.length > 0 || reading.toolkitFit) {
      doc.moveDown(2);
      doc
        .fillColor(BROWN)
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("If you want to work on this more");
      doc.moveDown(0.5);

      reading.sessions.forEach((session) => {
        doc
          .fillColor(DARK)
          .fontSize(10.5)
          .font("Helvetica")
          .text(`- ${session.name}`, { link: session.url, underline: false });
        doc.moveDown(0.3);
      });

      if (reading.toolkitFit) {
        doc.moveDown(0.3);
        doc
          .fillColor(DARK)
          .fontSize(10.5)
          .font("Helvetica-Oblique")
          .text("Or, the complete path: The Overcome People Pleasing Toolkit", {
            link: "https://beyondpsychology.eu/overcome-people-pleasing/",
          });
      }
    }

    doc.end();
  });
}
