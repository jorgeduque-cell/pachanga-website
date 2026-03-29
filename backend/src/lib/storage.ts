import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const BUCKET = 'media';

let supabase: ReturnType<typeof createClient> | null = null;

function getClient() {
    if (!supabase && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
        supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    }
    return supabase;
}

/**
 * Uploads a file buffer to Supabase Storage.
 * Returns the public URL on success, null on failure.
 */
export async function uploadToStorage(
    buffer: Buffer,
    fileName: string,
    contentType: string,
): Promise<string | null> {
    const client = getClient();
    if (!client) {
        logger.warn('[Storage] Supabase not configured, skipping upload');
        return null;
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const path = `flyers/${Date.now()}-${safeName}`;

    const { error } = await client.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType, upsert: true });

    if (error) {
        logger.error({ err: error }, '[Storage] Upload failed');
        return null;
    }

    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    logger.info({ path, url: data.publicUrl }, '[Storage] File uploaded');
    return data.publicUrl;
}

/**
 * Deletes a file from Supabase Storage by its public URL.
 */
export async function deleteFromStorage(publicUrl: string): Promise<void> {
    const client = getClient();
    if (!client) return;

    // Extract path from URL: .../storage/v1/object/public/media/flyers/...
    const match = publicUrl.match(/\/media\/(.+)$/);
    if (!match) return;

    const { error } = await client.storage.from(BUCKET).remove([match[1]]);
    if (error) {
        logger.error({ err: error }, '[Storage] Delete failed');
    }
}

/**
 * Uploads a payment receipt to Supabase Storage.
 * Uses a separate path prefix to isolate from flyers.
 */
export async function uploadPaymentReceipt(
    buffer: Buffer,
    fileName: string,
    contentType: string,
): Promise<string | null> {
    const client = getClient();
    if (!client) {
        logger.warn('[Storage] Supabase not configured, skipping receipt upload');
        return null;
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const path = `payment-receipts/${Date.now()}-${safeName}`;

    const { error } = await client.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType, upsert: true });

    if (error) {
        logger.error({ err: error }, '[Storage] Receipt upload failed');
        return null;
    }

    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    logger.info({ path, url: data.publicUrl }, '[Storage] Receipt uploaded');
    return data.publicUrl;
}
