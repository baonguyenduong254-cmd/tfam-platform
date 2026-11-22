/**
 * TFAM Studio — Cloudflare Workers + D1 + R2 Production Adapter
 * Mirrors the local_server.py REST API contract for deployment on:
 *   - Public API: https://<existing-domain>/api/public/*
 *   - Studio API: https://studio.<existing-domain>/api/*
 *
 * Apply schema first:
 *   wrangler d1 migrations apply tfam-platform-db --remote
 */

export interface Env {
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  PUBLIC_SITE_ORIGIN: string;
  STUDIO_ORIGIN: string;
  PAYMENT_PROVIDER: string;
}

function json(data: unknown, status = 200, origin = "*"): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || env.STUDIO_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, runtime: "cloudflare-workers", d1: Boolean(env.DB), r2: Boolean(env.ASSETS_BUCKET) }, 200, origin);
    }

    // Public Site Read-Only Catalog (Approved Snapshots Only — never exposes private/draft/what_if)
    if (url.pathname === "/api/public/catalog" && request.method === "GET") {
      const unlockedChapter = Number(url.searchParams.get("unlocked_chapter") || "9999");
      const { results } = await env.DB.prepare(
        `SELECT id, entity_type, entity_id, version_number, visibility, spoiler_gate_chapter, payload_json, published_at
         FROM published_snapshots
         WHERE is_active = 1
           AND (spoiler_gate_chapter IS NULL OR spoiler_gate_chapter <= ?)
         ORDER BY published_at DESC`
      )
        .bind(unlockedChapter)
        .all();

      const items = (results || []).map((row: Record<string, unknown>) => {
        const payload = JSON.parse(String(row.payload_json || "{}"));
        delete payload.private_notes;
        delete payload.author_notes;
        return {
          snapshot_id: row.id,
          entity_type: row.entity_type,
          entity_id: row.entity_id,
          version_number: row.version_number,
          visibility: row.visibility,
          published_at: row.published_at,
          payload,
        };
      });
      return json({ items, count: items.length }, 200, origin);
    }

    // Read-only R2 asset proxy (keeps R2 credentials strictly server-side)
    if (url.pathname.startsWith("/api/public/r2/") && request.method === "GET") {
      const key = decodeURIComponent(url.pathname.replace("/api/public/r2/", ""));
      const assetMeta = await env.DB.prepare(
        "SELECT visibility, publish_permission FROM assets WHERE r2_key = ?"
      )
        .bind(key)
        .first<{ visibility: string; publish_permission: string }>();

      if (!assetMeta || assetMeta.visibility !== "public" || assetMeta.publish_permission !== "approved") {
        return json({ error: "Asset not authorized for public access" }, 403, origin);
      }
      const obj = await env.ASSETS_BUCKET.get(key);
      if (!obj) return json({ error: "R2 object not found" }, 404, origin);
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=3600");
      return new Response(obj.body, { headers });
    }

    return json(
      {
        error: "Use local_server.py for full local 14-module execution, or mount authenticated Studio D1 handlers here before production deploy.",
        path: url.pathname,
      },
      501,
      origin
    );
  },
};
