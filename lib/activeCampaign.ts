const TAG_NAME = "patternspotter";
const LIST_NAME = "Pattern Spotter";

function getConfig() {
  const apiUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY;
  if (!apiUrl || !apiKey) return null;
  return { apiUrl: apiUrl.replace(/\/+$/, ""), apiKey };
}

async function acFetch(
  config: { apiUrl: string; apiKey: string },
  path: string,
  init?: RequestInit
) {
  const res = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      "Api-Token": config.apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      `ActiveCampaign ${path} failed: ${res.status} ${JSON.stringify(data)}`
    );
  }
  return data;
}

async function syncContact(config: { apiUrl: string; apiKey: string }, email: string) {
  const data = await acFetch(config, "/api/3/contact/sync", {
    method: "POST",
    body: JSON.stringify({ contact: { email } }),
  });
  return data.contact.id as string;
}

async function getOrCreateTagId(config: { apiUrl: string; apiKey: string }, tagName: string) {
  const search = await acFetch(
    config,
    `/api/3/tags?search=${encodeURIComponent(tagName)}`
  );
  const existing = search.tags?.find((t: { tag: string }) => t.tag === tagName);
  if (existing) return existing.id as string;

  const created = await acFetch(config, "/api/3/tags", {
    method: "POST",
    body: JSON.stringify({ tag: { tag: tagName, tagType: "contact", description: "" } }),
  });
  return created.tag.id as string;
}

async function getListId(config: { apiUrl: string; apiKey: string }, listName: string) {
  const search = await acFetch(
    config,
    `/api/3/lists?filters[name]=${encodeURIComponent(listName)}`
  );
  const list = search.lists?.[0];
  return list ? (list.id as string) : null;
}

async function addContactTag(
  config: { apiUrl: string; apiKey: string },
  contactId: string,
  tagId: string
) {
  await acFetch(config, "/api/3/contactTags", {
    method: "POST",
    body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } }),
  });
}

async function addContactToList(
  config: { apiUrl: string; apiKey: string },
  contactId: string,
  listId: string
) {
  await acFetch(config, "/api/3/contactLists", {
    method: "POST",
    body: JSON.stringify({
      contactList: { list: listId, contact: contactId, status: 1 },
    }),
  });
}

/**
 * Creates/updates the contact in ActiveCampaign, tags it "patternspotter",
 * and adds it to the "Pattern Spotter" list. The list must already exist in
 * ActiveCampaign (created via the AC dashboard); the tag is created
 * automatically on first use if it doesn't exist yet.
 *
 * Never throws: this is a best-effort side effect of the email gate, a
 * failure here should never block someone from using the tool.
 */
export async function syncToActiveCampaign(email: string): Promise<void> {
  const config = getConfig();
  if (!config) {
    console.error("ActiveCampaign sync skipped: missing env vars");
    return;
  }

  try {
    const contactId = await syncContact(config, email);
    const tagId = await getOrCreateTagId(config, TAG_NAME);
    await addContactTag(config, contactId, tagId);

    const listId = await getListId(config, LIST_NAME);
    if (listId) {
      await addContactToList(config, contactId, listId);
    } else {
      console.error(
        `ActiveCampaign list "${LIST_NAME}" not found, skipping list add. Create it in ActiveCampaign first.`
      );
    }
  } catch (err) {
    console.error("ActiveCampaign sync failed", err);
  }
}
