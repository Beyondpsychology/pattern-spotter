export const PRODUCTS: Record<string, { slug: string; title: string; url?: string }> = {
  Invitation: {
    slug: "somatic-session-releasing-suppressed-emotions",
    title: "Invitation, a Guided Somatic Session for Releasing Suppressed Emotions",
  },
  Purpose: {
    slug: "guided-visualization-finding-purpose",
    title: "Purpose, a Guided Visualization for Finding Your Purpose",
  },
  Felt: {
    slug: "somatic-session-feeling-suppressed-emotions",
    title: "Felt, a Guided Somatic Session for Feeling Suppressed Emotions",
  },
  Boundaries: {
    slug: "somatic-session-setting-boundaries",
    title: "Boundaries, a Guided Somatic Session for Setting Boundaries",
  },
  Mothered: {
    slug: "healing-mother-wound-meditation",
    title: "Mothered, a Guided Meditation for Healing the Mother Wound",
  },
  Met: {
    slug: "somatic-session-healing-wounded-inner-child",
    title: "Met, a Guided Somatic Session for Healing the Wounded Inner Child",
  },
  Held: {
    slug: "somatic-session-inner-child-healing",
    title: "Held, a Guided Somatic Session for Healing the Inner Child",
  },
  Reparented: {
    slug: "somatic-session-inner-child-reparenting",
    title: "Reparented, a Guided Somatic Session for Inner Child Reparenting",
  },
  "Be-Loved": {
    slug: "self-love-visualization-retrieving-and-healing-unloved-parts",
    title: "Be-Loved, a Guided Self Love Visualization",
  },
  Signal: {
    slug: "somatic-session-healing-triggers",
    title: "Signal, a Guided Somatic Session for Healing Triggers",
  },
  Worthy: {
    slug: "somatic-session-unworthiness",
    title: "Worthy, a Guided Somatic Session for the Wound of Unworthiness",
  },
  Anger: {
    slug: "anger-release-guided-somatic-session",
    title: "Anger, a Guided Somatic Session for Anger Release",
  },
  "Overcoming Self-Sabotage": {
    slug: "parts-work-self-sabotage",
    title: "Overcoming Self-Sabotage, a Guided Parts Work Session",
  },
  Unshame: {
    slug: "healing-shame-guided-somatic-session",
    title: "Unshame, a Guided Somatic Session for Healing Shame",
  },
  Shadow: {
    slug: "shadow-work-meditation",
    title: "Shadow, a Guided Meditation for Shadow Work",
  },
  Try: {
    slug: "somatic-session-fear-of-failure",
    title: "Try, a Guided Somatic Session for Fear of Failure",
  },
  Remain: {
    slug: "somatic-session-fear-of-abandonment",
    title: "Remain, a Guided Somatic Session for Fear of Abandonment",
  },
  "Speak Up": {
    slug: "overcoming-fear-of-speaking-up-guided-somatic-session",
    title: "Speak Up, a Guided Somatic Session for the Fear of Speaking Up",
  },
  "The 10 Steps": {
    slug: "the-10-steps-of-emotion-regulation",
    title: "The 10 Steps, a Guided Somatic Session for Emotion Regulation",
  },
  Move: {
    slug: "parts-work-overcoming-procrastination",
    title: "Move, Overcoming Procrastination: a Guided Parts Work Session",
  },
  No: {
    slug: "stop-people-pleasing-guided-somatic-session",
    title: "No, a Guided Somatic Session to Stop People Pleasing",
  },
  Imperfect: {
    slug: "overcoming-perfectionism-parts-work-session",
    title: "Imperfect, a Guided Parts Work Session for Overcoming Perfectionism",
  },
  Innocent: {
    slug: "overcoming-guilt-guided-somatic-session",
    title: "Innocent, a Guided Somatic Session for Overcoming Guilt",
  },
  "The Unshame Yourself E-book": {
    slug: "unshame-yourself-e-book",
    title: "The Unshame Yourself E-book",
  },
  Stay: {
    slug: "stay-a-guided-somatic-session-for-the-fear-of-disappointing-others",
    title: "Stay, a Guided Somatic Session for the Fear of Disappointing Others",
  },
  "Overcome People Pleasing Toolkit": {
    slug: "overcome-people-pleasing",
    title: "The Overcome People Pleasing Toolkit",
    url: "https://beyondpsychology.eu/overcome-people-pleasing/",
  },
  Appetite: {
    slug: "appetite-a-guided-somatic-session-to-stop-emotional-eating",
    title: "Appetite, a Guided Somatic Session to Stop Emotional Eating",
  },
};

export const ONE_ON_ONE_URL = "https://beyondpsychology.eu/1-on-1/";

export function buildProductUrl(slug: string) {
  return `https://beyondpsychology.eu/product/${slug}`;
}

/**
 * Match a session name returned by the model to a catalog entry.
 * Exact match first, then case-insensitive exact match, then
 * case-insensitive partial (substring) match. Returns null if nothing fits.
 */
export function matchProduct(
  name: string
): { name: string; url: string } | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  if (PRODUCTS[trimmed]) {
    const entry = PRODUCTS[trimmed];
    return { name: entry.title, url: entry.url ?? buildProductUrl(entry.slug) };
  }

  const lower = trimmed.toLowerCase();
  const exactCiKey = Object.keys(PRODUCTS).find(
    (key) => key.toLowerCase() === lower
  );
  if (exactCiKey) {
    const entry = PRODUCTS[exactCiKey];
    return { name: entry.title, url: entry.url ?? buildProductUrl(entry.slug) };
  }

  const partialKey = Object.keys(PRODUCTS).find(
    (key) => lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)
  );
  if (partialKey) {
    const entry = PRODUCTS[partialKey];
    return { name: entry.title, url: entry.url ?? buildProductUrl(entry.slug) };
  }

  return null;
}
