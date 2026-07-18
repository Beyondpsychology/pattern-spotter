import fs from "fs";
import path from "path";

export interface PdfSection {
  heading: string;
  body: string;
}

export interface PdfSession {
  name: string;
  url: string;
}

export interface PdfReadingData {
  sections: PdfSection[];
  sessions: PdfSession[];
  toolkitFit: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bodyToParagraphs(body: string): string {
  return body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");
}

const MYRTHE_PHOTO_URL =
  "https://beyondpsychology.eu/wp-content/uploads/2025/07/Myrthe-team-photo-3.png";

function fileToDataUri(filePath: string, mimeType: string): string | null {
  try {
    const buffer = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function assetPath(...segments: string[]): string {
  return path.join(process.cwd(), "public", "pdf-assets", ...segments);
}

/**
 * Prefers a local file (public/pdf-assets/myrthe-photo.png) if one is ever
 * committed, otherwise fetches it from the live site at render time. Never
 * throws — a missing/unreachable photo falls back to a plain placeholder
 * circle in the template rather than breaking PDF generation.
 */
async function loadPhotoDataUri(): Promise<string | null> {
  const local = fileToDataUri(assetPath("myrthe-photo.png"), "image/png");
  if (local) return local;

  try {
    const res = await fetch(MYRTHE_PHOTO_URL);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error("Failed to fetch Myrthe photo for PDF", err);
    return null;
  }
}

export async function buildReadingHtml(data: PdfReadingData): Promise<string> {
  const { sections, sessions, toolkitFit } = data;

  const abrilFont = fileToDataUri(assetPath("fonts", "AbrilFatface-Regular.ttf"), "font/ttf");
  const cormorantFont = fileToDataUri(
    assetPath("fonts", "CormorantGaramond-Italic.ttf"),
    "font/ttf"
  );
  const openSansLight = fileToDataUri(assetPath("fonts", "OpenSans-Light.ttf"), "font/ttf");
  const openSansBold = fileToDataUri(assetPath("fonts", "OpenSans-Bold.ttf"), "font/ttf");
  const photo = await loadPhotoDataUri();

  const sectionsHtml = sections
    .map(
      (section) => `
    <div class="section-block">
      <div class="section-heading">${escapeHtml(section.heading)}</div>
      <div class="section-body">${bodyToParagraphs(section.body)}</div>
    </div>`
    )
    .join("\n");

  const hasCta = sessions.length > 0 || toolkitFit;

  const sessionsHtml = sessions
    .map(
      (session) =>
        `<a class="cta-session" href="${escapeHtml(session.url)}">${escapeHtml(session.name)}</a>`
    )
    .join("\n");

  const toolkitHtml = toolkitFit
    ? `<a class="cta-toolkit" href="https://beyondpsychology.eu/overcome-people-pleasing/">Or, the complete path: The Overcome People Pleasing Toolkit</a>`
    : "";

  const ctaBlockHtml = hasCta
    ? `
    <div class="cta-block">
      <div class="cta-heading">If you want to work on this more</div>
      ${sessionsHtml}
      ${toolkitHtml}
    </div>`
    : "";

  const photoHtml = photo
    ? `<img class="founder-photo" src="${photo}">`
    : `<div class="founder-photo founder-photo-placeholder"></div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${abrilFont ? `@font-face { font-family: 'Abril Fatface'; src: url('${abrilFont}'); }` : ""}
  ${cormorantFont ? `@font-face { font-family: 'Cormorant Garamond'; font-style: italic; src: url('${cormorantFont}'); }` : ""}
  ${openSansLight ? `@font-face { font-family: 'Open Sans'; font-weight: 300; src: url('${openSansLight}'); }` : ""}
  ${openSansBold ? `@font-face { font-family: 'Open Sans'; font-weight: 700; src: url('${openSansBold}'); }` : ""}

  @page { size: A4; margin: 0; }
  @page section-page { size: A4; margin: 30mm 24mm 26mm 24mm; }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Open Sans', sans-serif; font-weight: 300; color: #1a1208; font-size: 11pt; line-height: 1.65; }

  .title-page { width: 210mm; height: 297mm; background: #d4e4e0; position: relative; page-break-after: always; }
  .title-logo { position: absolute; top: 20mm; left: 20mm; font-family: 'Abril Fatface', serif; font-size: 15pt; color: #2C3535; }
  .title-center { position: absolute; top: 50%; left: 24mm; right: 24mm; transform: translateY(-50%); }
  .title-eyebrow { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 15pt; color: #7a6248; margin-bottom: 6mm; }
  .title-main { font-family: 'Abril Fatface', serif; font-size: 34pt; color: #1a1208; line-height: 1.15; margin-bottom: 8mm; }
  .title-sub { font-size: 11pt; color: #3a352c; max-width: 130mm; line-height: 1.6; }
  .title-footer { position: absolute; bottom: 18mm; left: 24mm; right: 24mm; font-size: 9pt; color: #4a5555; display: flex; justify-content: space-between; border-top: 0.5pt solid rgba(44,53,53,0.25); padding-top: 5mm; }

  .content-page { page: section-page; }
  .section-block { margin-bottom: 12mm; page-break-inside: avoid; }
  .section-heading { font-family: 'Abril Fatface', serif; font-size: 15pt; color: #1a1208; margin-bottom: 4mm; padding-bottom: 2mm; border-bottom: 1.5pt solid #D9735C; display: inline-block; }
  .section-body { font-size: 10.5pt; line-height: 1.7; color: #2a2620; }
  .section-body p { margin-bottom: 3mm; }

  .cta-block { background: #2C3535; color: #F5F0E8; padding: 12mm 14mm; border-radius: 4mm; margin-top: 10mm; page-break-before: always; page-break-inside: avoid; }
  .cta-heading { font-family: 'Abril Fatface', serif; font-size: 13pt; margin-bottom: 6mm; color: #F5F0E8; }
  .cta-session { display: block; font-size: 10.5pt; padding: 3mm 0; border-bottom: 0.5pt solid rgba(245,240,232,0.2); color: #F5F0E8; text-decoration: none; }
  .cta-session:last-of-type { border-bottom: none; }
  .cta-toolkit { display: block; margin-top: 6mm; padding-top: 6mm; border-top: 0.5pt solid rgba(245,240,232,0.3); font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 12pt; color: #d4e4e0; text-decoration: none; }

  @page about-section { size: A4; margin: 0; }
  .about-page { page: about-section; width: 210mm; min-height: 297mm; background: #d4e4e0; padding: 30mm 24mm 26mm 24mm; page-break-before: always; }
  .founder-block { page-break-inside: avoid; }
  .about-eyebrow { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 13pt; color: #7a6248; margin-bottom: 3mm; }
  .about-heading { font-family: 'Abril Fatface', serif; font-size: 17pt; line-height: 1.2; color: #1a1208; margin-bottom: 6mm; max-width: 140mm; }
  .about-body { font-size: 10pt; line-height: 1.6; color: #2a2620; }
  .about-body p { margin-bottom: 3mm; }
  .about-path { margin: 6mm 0 6mm; padding: 5mm 0; border-top: 0.5pt solid rgba(44,53,53,0.2); border-bottom: 0.5pt solid rgba(44,53,53,0.2); }
  .about-path-label { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 10.5pt; color: #7a6248; margin-bottom: 3mm; }
  .about-path-grid { display: grid; grid-template-rows: repeat(3, auto); grid-auto-flow: column; column-gap: 8mm; row-gap: 2mm; font-size: 9.5pt; color: #2a2620; }
  .about-path-num { font-family: 'Abril Fatface', serif; font-size: 8.5pt; color: #D9735C; margin-right: 2.5mm; }
  .founder-block { display: flex; align-items: flex-start; gap: 6mm; background: #F5F0E8; border-radius: 3mm; padding: 6mm; }
  .founder-photo { width: 22mm; height: 22mm; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .founder-photo-placeholder { background: #d9735c33; }
  .founder-name { font-family: 'Abril Fatface', serif; font-size: 11pt; color: #1a1208; margin-bottom: 1mm; }
  .founder-title { font-size: 8.5pt; color: #7a6248; font-weight: 700; margin-bottom: 3mm; }
  .founder-bio { font-size: 9pt; line-height: 1.55; color: #3a352c; margin-bottom: 2.5mm; }
  .founder-bio:last-child { margin-bottom: 0; }

</style>
</head>
<body>

  <div class="title-page">
    <div class="title-logo">Beyond&nbsp;Psychology</div>
    <div class="title-center">
      <div class="title-eyebrow">read closely, said clearly</div>
      <div class="title-main">The Pattern Spotter</div>
      <div class="title-sub">Your reading, named precisely and in full. Five sections: the pattern, where it came from, where it's still running, where you're less of a victim than you think, and a practice to try.</div>
    </div>
    <div class="title-footer">
      <span>Beyond Psychology &middot; beyondpsychology.eu</span>
      <span>Prepared for you</span>
    </div>
  </div>

  <div class="content-page">
    ${sectionsHtml}
    ${ctaBlockHtml}
  </div>

  <div class="content-page about-page">
    <div class="about-eyebrow">about beyond psychology</div>
    <div class="about-heading">Return to yourself,<br>beyond who you were taught to be</div>
    <div class="about-body">
      <p>Most psychology was built to help you function inside the system. We exist to help you outgrow it.</p>
      <p>For as long as it has existed, psychology has treated you as something to be fixed. The anxiety, the need for control, the exhaustion, the pleasing, the depression, gathered into symptoms and handed back as proof that something about you was wrong. We see it differently. You were not born this way. What you were taught to see as a personal failing is most often an intelligent response to a world that asked you to perform, adapt, suppress your aliveness and authenticity, and make yourself smaller to belong, until the shame of being who you are became the water you swim in. What you carry is not a personal failing. It is what happens to you when you have to abandon yourself to belong.</p>
      <p>Beyond Psychology is not for pathology, but for change. For real healing, emotional maturity, and freedom. We do not treat what you feel as something to fix. We treat it as the place to begin: to return to yourself, beyond the patterns you inherited and the shame you were taught to carry, and to become what this world has rarely made room for: autonomous, sovereign, emotionally mature, and free.</p>
    </div>
    <div class="about-path">
      <div class="about-path-label">the path</div>
      <div class="about-path-grid">
        <div><span class="about-path-num">01</span> Healing unworthiness</div>
        <div><span class="about-path-num">02</span> Reclaiming authenticity</div>
        <div><span class="about-path-num">03</span> Emotional maturity</div>
        <div><span class="about-path-num">04</span> Relational power</div>
        <div><span class="about-path-num">05</span> Systemic liberation</div>
      </div>
    </div>
    <div class="founder-block">
      ${photoHtml}
      <div class="founder-text">
        <div class="founder-name">Myrthe Glasbergen, MSc.</div>
        <div class="founder-title">Psychologist &amp; Founder of Beyond Psychology</div>
        <p class="founder-bio">Myrthe Glasbergen, MSc. is a psychologist and the founder of Beyond Psychology. She has an unusual talent for seeing where people are stuck: which patterns are holding them back, and which relational wounds from the past are still present in the body, in daily choices, in relationships. She sees exactly how suppressed emotions and old survival strategies keep someone from changing, growing, and finding peace, and she has used that skill in her one-on-one work with clients for over ten years.</p>
        <p class="founder-bio">She built the Pattern Spotter so that same way of seeing could travel further than the room she is in. Reading this is the same as sitting across from her.</p>
      </div>
    </div>
  </div>

</body>
</html>`;
}
