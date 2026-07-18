import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "readings";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function ensureBucketExists(supabase: SupabaseClient) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: false,
    });
    // Ignore a race where another request created it in the meantime.
    if (createError && !createError.message.includes("already exists")) {
      throw createError;
    }
  }
}

/**
 * Uploads the reading PDF to a private Supabase Storage bucket and returns a
 * signed, time-limited download URL. Returns null (and logs) on any failure
 * — a storage/email hiccup should never block the user from seeing their
 * reading on-screen.
 */
export async function uploadReadingPdf(
  supabase: SupabaseClient,
  email: string,
  pdfBuffer: Buffer
): Promise<string | null> {
  try {
    await ensureBucketExists(supabase);

    const safeEmail = email.replace(/[^a-z0-9]/gi, "_");
    const path = `${safeEmail}-${randomUUID()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, pdfBuffer, { contentType: "application/pdf" });

    if (uploadError) throw uploadError;

    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (signError) throw signError;

    return signed.signedUrl;
  } catch (err) {
    console.error("uploadReadingPdf failed", err);
    return null;
  }
}
