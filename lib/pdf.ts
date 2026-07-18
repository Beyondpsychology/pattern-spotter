import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import type { ReadingResultData } from "@/lib/toolTypes";

const DARK = "#2C3535";
const CREAM = "#F5F0E8";
const TERRACOTTA = "#D9735C";
const MINT = "#d4e4e0";
const BROWN = "#7a6248";
const TEXT = "#1a1208";
const BODY_TEXT = "#2a2620";

const MARGIN = 60;

const MYRTHE_PHOTO_URL =
  "https://beyondpsychology.eu/wp-content/uploads/2025/07/Myrthe-team-photo-3.png";

function assetPath(...segments: string[]) {
  return path.join(process.cwd(), "public", "pdf-assets", ...segments);
}

async function loadPhotoBuffer(): Promise<Buffer | null> {
  const localPath = assetPath("myrthe-photo.png");
  if (fs.existsSync(localPath)) {
    try {
      return fs.readFileSync(localPath);
    } catch {
      // fall through to remote fetch
    }
  }

  try {
    const res = await fetch(MYRTHE_PHOTO_URL);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.error("Failed to fetch Myrthe photo for PDF", err);
    return null;
  }
}

function registerFonts(doc: PDFKit.PDFDocument) {
  doc.registerFont("Abril", assetPath("fonts", "AbrilFatface-Regular.ttf"));
  doc.registerFont("CormorantItalic", assetPath("fonts", "CormorantGaramond-Italic.ttf"));
  doc.registerFont("OpenSans", assetPath("fonts", "OpenSans-Light.ttf"));
}

function drawCircularPhoto(
  doc: PDFKit.PDFDocument,
  photoBuffer: Buffer | null,
  x: number,
  y: number,
  size: number
) {
  if (photoBuffer) {
    doc.save();
    doc.circle(x + size / 2, y + size / 2, size / 2).clip();
    doc.image(photoBuffer, x, y, { width: size, height: size });
    doc.restore();
  } else {
    doc.fillOpacity(0.25).fillColor(TERRACOTTA);
    doc.circle(x + size / 2, y + size / 2, size / 2).fill();
    doc.fillOpacity(1);
  }
}

export async function generateReadingPdf(reading: ReadingResultData): Promise<Buffer> {
  const photoBuffer = await loadPhotoBuffer();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerFonts(doc);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - MARGIN * 2;

    // ---------- TITLE PAGE ----------
    doc.rect(0, 0, pageWidth, pageHeight).fill(MINT);

    doc.fillColor(DARK).font("Abril").fontSize(15).text("Beyond Psychology", MARGIN, 56);

    const centerY = pageHeight / 2 - 90;
    doc
      .fillColor(BROWN)
      .font("CormorantItalic")
      .fontSize(16)
      .text("read closely, said clearly", MARGIN, centerY, { width: contentWidth, align: "center" });

    doc
      .fillColor(TEXT)
      .font("Abril")
      .fontSize(36)
      .text("The Pattern Spotter", MARGIN, doc.y + 14, { width: contentWidth, align: "center" });

    doc
      .fillColor("#3a352c")
      .font("OpenSans")
      .fontSize(11)
      .text(
        "Your reading, named precisely and in full. Five sections: the pattern, where it came from, where it's still running, where you're less of a victim than you think, and a practice to try.",
        MARGIN + 50,
        doc.y + 24,
        { width: contentWidth - 100, align: "center", lineGap: 4 }
      );

    doc
      .fillColor("#4a5555")
      .font("OpenSans")
      .fontSize(9)
      .text("Beyond Psychology · beyondpsychology.eu", MARGIN, pageHeight - 70, {
        width: contentWidth / 2,
      });
    doc
      .fillColor("#4a5555")
      .font("OpenSans")
      .fontSize(9)
      .text("Prepared for you", MARGIN + contentWidth / 2, pageHeight - 70, {
        width: contentWidth / 2,
        align: "right",
      });

    // ---------- SECTIONS ----------
    doc.addPage({ size: "A4", margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } });

    reading.sections.forEach((section, i) => {
      if (i > 0) doc.moveDown(1.4);

      const barY = doc.y + 3;
      doc.rect(doc.page.margins.left, barY, 4, 15).fill(TERRACOTTA);

      doc
        .fillColor(TEXT)
        .font("Abril")
        .fontSize(15)
        .text(section.heading, doc.page.margins.left + 14, doc.y);

      doc.moveDown(0.4);
      doc
        .fillColor(BODY_TEXT)
        .font("OpenSans")
        .fontSize(10.5)
        .text(section.body, doc.page.margins.left + 14, doc.y, {
          width: contentWidth - 14,
          lineGap: 4,
        });
    });

    // ---------- CTA PAGE ----------
    if (reading.sessions.length > 0 || reading.toolkitFit) {
      doc.addPage({ size: "A4", margin: 0 });
      doc.rect(0, 0, pageWidth, pageHeight).fill(DARK);

      let y = 110;
      doc
        .fillColor(CREAM)
        .font("Abril")
        .fontSize(20)
        .text("If you want to work on this more", MARGIN, y, { width: contentWidth });

      if (reading.sessions.length > 0) {
        y = doc.y + 24;
        doc
          .fillColor("#d8d2c4")
          .font("OpenSans")
          .fontSize(10.5)
          .text("These are the sessions I guide people through for exactly what you just named:", MARGIN, y, {
            width: contentWidth,
          });
        y = doc.y + 18;

        reading.sessions.forEach((session) => {
          doc
            .fillColor(CREAM)
            .font("OpenSans")
            .fontSize(11)
            .text(session.name, MARGIN, y, { width: contentWidth, link: session.url, underline: true });
          y = doc.y + 12;
        });
      }

      if (reading.toolkitFit) {
        y += 14;
        doc
          .fillColor(MINT)
          .font("CormorantItalic")
          .fontSize(13)
          .text("Or, the complete path: The Overcome People Pleasing Toolkit", MARGIN, y, {
            width: contentWidth,
            link: "https://beyondpsychology.eu/overcome-people-pleasing/",
            underline: true,
          });
      }
    }

    // ---------- ABOUT PAGE ----------
    doc.addPage({ size: "A4", margin: 0 });
    doc.rect(0, 0, pageWidth, pageHeight).fill(MINT);

    let ay = 90;
    doc.fillColor(BROWN).font("CormorantItalic").fontSize(13).text("about beyond psychology", MARGIN, ay);
    ay = doc.y + 8;

    doc
      .fillColor(TEXT)
      .font("Abril")
      .fontSize(17)
      .text("Return to yourself, beyond who you were taught to be", MARGIN, ay, {
        width: contentWidth - 60,
      });
    ay = doc.y + 18;

    const aboutParagraphs = [
      "Most psychology was built to help you function inside the system. We exist to help you outgrow it.",
      "For as long as it has existed, psychology has treated you as something to be fixed. The anxiety, the need for control, the exhaustion, the pleasing, the depression, gathered into symptoms and handed back as proof that something about you was wrong. We see it differently. You were not born this way. What you were taught to see as a personal failing is most often an intelligent response to a world that asked you to perform, adapt, suppress your aliveness and authenticity, and make yourself smaller to belong, until the shame of being who you are became the water you swim in. What you carry is not a personal failing. It is what happens to you when you have to abandon yourself to belong.",
      "Beyond Psychology is not for pathology, but for change. For real healing, emotional maturity, and freedom. We do not treat what you feel as something to fix. We treat it as the place to begin: to return to yourself, beyond the patterns you inherited and the shame you were taught to carry, and to become what this world has rarely made room for: autonomous, sovereign, emotionally mature, and free.",
    ];

    doc.fillColor(BODY_TEXT).font("OpenSans").fontSize(9.5);
    aboutParagraphs.forEach((paragraph) => {
      doc.text(paragraph, MARGIN, ay, { width: contentWidth, lineGap: 3 });
      ay = doc.y + 10;
    });

    ay += 6;
    doc.fillColor(BROWN).font("CormorantItalic").fontSize(11).text("the path", MARGIN, ay);
    ay = doc.y + 8;

    const pathItems = [
      "Healing unworthiness",
      "Reclaiming authenticity",
      "Emotional maturity",
      "Relational power",
      "Systemic liberation",
    ];
    pathItems.forEach((item, i) => {
      doc
        .fillColor(TERRACOTTA)
        .font("Abril")
        .fontSize(9)
        .text(String(i + 1).padStart(2, "0"), MARGIN, ay, { continued: true });
      doc.fillColor(BODY_TEXT).font("OpenSans").fontSize(9.5).text(`  ${item}`);
      ay = doc.y + 5;
    });

    ay += 20;
    const photoSize = 74;
    drawCircularPhoto(doc, photoBuffer, MARGIN, ay, photoSize);

    const textX = MARGIN + photoSize + 20;
    const textWidth = contentWidth - photoSize - 20;

    doc
      .fillColor(TEXT)
      .font("Abril")
      .fontSize(11)
      .text("Myrthe Glasbergen, MSc.", textX, ay, { width: textWidth });
    doc
      .fillColor(BROWN)
      .font("OpenSans")
      .fontSize(8.5)
      .text("Psychologist & Founder of Beyond Psychology", textX, doc.y + 2, { width: textWidth });
    doc
      .fillColor("#3a352c")
      .font("OpenSans")
      .fontSize(8.5)
      .text(
        "Myrthe Glasbergen, MSc. is a psychologist and the founder of Beyond Psychology. She has an unusual talent for seeing where people are stuck: which patterns are holding them back, and which relational wounds from the past are still present in the body, in daily choices, in relationships.",
        textX,
        doc.y + 8,
        { width: textWidth, lineGap: 2 }
      );
    doc
      .fillColor("#3a352c")
      .font("OpenSans")
      .fontSize(8.5)
      .text(
        "She built the Pattern Spotter so that same way of seeing could travel further than the room she is in. Reading this is the same as sitting across from her.",
        textX,
        doc.y + 6,
        { width: textWidth, lineGap: 2 }
      );

    doc.end();
  });
}
