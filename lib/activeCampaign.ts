const TAG_NAME = "patternspotter";
const LIST_NAME = "Pattern Spotter";
const READING_URL_FIELD_TITLE = "Pattern Spotter Reading URL";

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

async function syncContact(
  config: { apiUrl: string; apiKey: string },
  email: string,
  firstName?: string
) {
  const data = await acFetch(config, "/api/3/contact/sync", {
    method: "POST",
    body: JSON.stringify({
      contact: { email, ...(firstName ? { firstName } : {}) },
    }),
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

async function getFieldId(config: { apiUrl: string; apiKey: string }, fieldTitle: string) {
  const data = await acFetch(config, "/api/3/fields?limit=100");
  const field = data.fields?.find((f: { title: string }) => f.title === fieldTitle);
  return field ? (field.id as string) : null;
}

async function setContactFieldValue(
  config: { apiUrl: string; apiKey: string },
  contactId: string,
  fieldId: string,
  value: string
) {
  const existing = await acFetch(config, `/api/3/contacts/${contactId}/fieldValues`);
  const existingValue = existing.fieldValues?.find(
    (fv: { field: string }) => fv.field === fieldId
  );

  if (existingValue) {
    await acFetch(config, `/api/3/fieldValues/${existingValue.id}`, {
      method: "PUT",
      body: JSON.stringify({ fieldValue: { contact: contactId, field: fieldId, value } }),
    });
  } else {
    await acFetch(config, "/api/3/fieldValues", {
      method: "POST",
      body: JSON.stringify({ fieldValue: { contact: contactId, field: fieldId, value } }),
    });
  }
}

/**
 * Pushes the signed PDF download URL into the "Pattern Spotter Reading URL"
 * custom field on the contact. An ActiveCampaign automation (set up in the
 * AC dashboard, triggered on this field changing) is what actually sends the
 * email — this function only supplies the data for that automation to use.
 * Never throws: a failure here should never block the on-screen reading.
 */
export async function sendReadingPdfLink(email: string, pdfUrl: string): Promise<void> {
  const config = getConfig();
  if (!config) {
    console.error("ActiveCampaign PDF link sync skipped: missing env vars");
    return;
  }

  try {
    const contactId = await syncContact(config, email);
    const fieldId = await getFieldId(config, READING_URL_FIELD_TITLE);

    if (!fieldId) {
      console.error(
        `ActiveCampaign field "${READING_URL_FIELD_TITLE}" not found. Create it in ActiveCampaign first.`
      );
      return;
    }

    await setContactFieldValue(config, contactId, fieldId, pdfUrl);
  } catch (err) {
    console.error("ActiveCampaign PDF link sync failed", err);
  }
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
export async function syncToActiveCampaign(email: string, firstName?: string): Promise<void> {
  const config = getConfig();
  if (!config) {
    console.error("ActiveCampaign sync skipped: missing env vars");
    return;
  }

  try {
    const contactId = await syncContact(config, email, firstName);
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
