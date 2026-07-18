import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { buildReadingHtml } from "@/lib/pdf-template";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { sections, sessions, toolkitFit } = body ?? {};

    if (!Array.isArray(sections) || !Array.isArray(sessions) || typeof toolkitFit !== "boolean") {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const html = buildReadingHtml({ sections, sessions, toolkitFit });

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath:
        process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
      headless: true,
    });

    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      pdfBuffer = Buffer.from(
        await page.pdf({ format: "A4", printBackground: true })
      );
    } finally {
      await browser.close();
    }

    return new NextResponse(new Blob([pdfBuffer as unknown as BlobPart], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="pattern-spotter-reading.pdf"',
      },
    });
  } catch (err) {
    console.error("generate-pdf error", err);
    return NextResponse.json({ error: "pdf_generation_failed" }, { status: 500 });
  }
}
