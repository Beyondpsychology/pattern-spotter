import { NextRequest, NextResponse } from "next/server";
import { generateReadingPdf } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { sections, sessions, toolkitFit } = body ?? {};

    if (!Array.isArray(sections) || !Array.isArray(sessions) || typeof toolkitFit !== "boolean") {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const pdfBuffer = await generateReadingPdf({ sections, sessions, toolkitFit });

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
