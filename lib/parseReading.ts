export interface ReadingSection {
  heading: string;
  body: string;
}

export interface ParsedReading {
  sections: ReadingSection[];
  sessionNames: string[];
  toolkitFit: boolean;
}

/**
 * Parses the raw model output from /api/generate.
 * Order of operations matters: CATALOG_REVIEW must be stripped first (it is
 * never shown to the user), then SESSIONS, then TOOLKIT_FIT, leaving only
 * the five "## " sections behind.
 */
export function parseGenerateResponse(raw: string): ParsedReading {
  let text = raw;

  const catalogMatch = text.match(/CATALOG_REVIEW:[\s\S]*?(?=\n\s*SESSIONS:)/);
  if (catalogMatch) {
    text = text.replace(catalogMatch[0], "");
  }

  let sessionNames: string[] = [];
  const sessionsMatch = text.match(/^\s*SESSIONS:\s*(.+)$/m);
  if (sessionsMatch) {
    const value = sessionsMatch[1].trim();
    if (value.toUpperCase() !== "NONE") {
      sessionNames = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    text = text.replace(sessionsMatch[0], "");
  }

  let toolkitFit = false;
  const toolkitMatch = text.match(/^\s*TOOLKIT_FIT:\s*(yes|no)/im);
  if (toolkitMatch) {
    toolkitFit = toolkitMatch[1].toLowerCase() === "yes";
    text = text.replace(toolkitMatch[0], "");
  }

  const sectionParts = text
    .split(/^##\s+/m)
    .map((s) => s.trim())
    .filter(Boolean);

  const sections: ReadingSection[] = sectionParts.map((part) => {
    const newlineIdx = part.indexOf("\n");
    if (newlineIdx === -1) {
      return { heading: part.trim(), body: "" };
    }
    return {
      heading: part.slice(0, newlineIdx).trim(),
      body: part.slice(newlineIdx + 1).trim(),
    };
  });

  return { sections, sessionNames, toolkitFit };
}
