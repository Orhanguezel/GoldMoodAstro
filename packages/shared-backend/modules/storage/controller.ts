// =============================================================
// FILE: src/modules/storage/controller.ts
// Public route handler'lar — NO DB queries
// =============================================================
import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";
import type { MultipartFile } from "@fastify/multipart";

import { handleRouteError } from '../_shared';
import { getCloudinaryConfig, uploadBufferAuto } from "./cloudinary";
import { buildPublicUrl, stripLeadingSlashes } from "./util";
import { signMultipartBodySchema, type SignPutBody, type SignMultipartBody } from "./validation";
import { repoGetByBucketPath, repoInsert, repoIsDup, type StorageInsertInput } from "./repository";
import type { NewStorageAsset } from "./schema";

/* --------------------------------- helpers -------------------------------- */

const omitNullish = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;

const normalizePath = (bucket: string, raw: string) => {
  let p = stripLeadingSlashes(raw).replace(/\/{2,}/g, "/");
  if (p.startsWith(bucket + "/")) p = p.slice(bucket.length + 1);
  return p;
};

const toBool = (v: string | undefined): boolean => {
  if (!v) return false;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
};

type WildcardParamsRequest = FastifyRequest & {
  params: { bucket: string; "*": string };
};

type FileRequest = FastifyRequest & {
  file?: () => Promise<MultipartFile | undefined>;
  user?: { id?: string | null } | null;
};

type ErrorWithMessage = { message?: string };
type ImageDimensions = { width: number; height: number };

function readPngDimensions(buf: Buffer): ImageDimensions | null {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readWebpDimensions(buf: Buffer): ImageDimensions | null {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8 " && buf.length >= 30) {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L" && buf.length >= 25) {
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + ((b3 << 6) | (b2 >> 2) | ((b1 & 0xc0) << 6)) };
  }
  if (chunk === "VP8X" && buf.length >= 30) {
    return {
      width: 1 + buf.readUIntLE(24, 3),
      height: 1 + buf.readUIntLE(27, 3),
    };
  }
  return null;
}

function readJpegDimensions(buf: Buffer): ImageDimensions | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    offset += 2;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > buf.length) return null;
    const length = buf.readUInt16BE(offset);
    if (length < 2 || offset + length > buf.length) return null;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { height: buf.readUInt16BE(offset + 3), width: buf.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

function readImageDimensions(buf: Buffer, mime: string): ImageDimensions | null {
  const normalized = mime.toLowerCase();
  if (normalized === "image/png") return readPngDimensions(buf);
  if (normalized === "image/jpeg" || normalized === "image/jpg") return readJpegDimensions(buf);
  if (normalized === "image/webp") return readWebpDimensions(buf);
  return null;
}

function validateBucketFile(bucket: string, mime: string, buf: Buffer): { code: string; message: string } | null {
  const normalizedMime = mime.toLowerCase();
  
  // Rule for consultant_avatars (T37-4)
  if (bucket === "consultant_avatars") {
    if (!normalizedMime.startsWith("image/")) {
      return { code: "invalid_avatar_mime", message: "avatar_must_be_image" };
    }
    if (buf.length > 5 * 1024 * 1024) {
      return { code: "avatar_too_large", message: "avatar_max_5mb" };
    }
    const dimensions = readImageDimensions(buf, mime);
    if (dimensions && (dimensions.width < 400 || dimensions.height < 400)) {
      return { code: "avatar_too_small", message: "avatar_min_400x400" };
    }
  }

  // Rule for coffee bucket (T40)
  if (bucket === "coffee") {
    if (!normalizedMime.startsWith("image/")) {
      return { code: "invalid_coffee_mime", message: "coffee_must_be_image" };
    }
    if (buf.length > 10 * 1024 * 1024) {
      return { code: "coffee_too_large", message: "coffee_max_10mb" };
    }
  }

  return null;
}

/* ---------------------------------- PUBLIC -------------------------------- */

/** GET/HEAD /storage/:bucket/* — provider URL'ye 302 */
export async function publicServe(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { bucket } = req.params as { bucket: string; "*": string };
    const raw = (req as WildcardParamsRequest).params["*"] || "";
    const path = normalizePath(bucket, raw);

    const row = await repoGetByBucketPath(bucket, path);
    if (!row) return reply.code(404).send({ message: "not_found" });

    const cfg = await getCloudinaryConfig();
    const redirectUrl = buildPublicUrl(bucket, path, row.url, cfg ?? undefined);
    return reply.redirect(redirectUrl, 302);
  } catch (e) {
    return handleRouteError(reply, req, e, "public_serve");
  }
}

/** POST /storage/:bucket/upload (FormData) — server-side upload */
const AUTH_REQUIRED_BUCKETS = new Set(['consultant_blog', 'consultant_avatars', 'consultant_kyc']);

export async function uploadToBucket(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { bucket } = req.params as { bucket: string };
    const query = req.query as { path?: string; upsert?: string };

    // Hassas bucket'lara yükleme kimlik doğrulaması ister (anonim overwrite/istismar önleme);
    // anonim akışlar (uploads=başvuru CV, coffee=fal foto) açık kalır.
    // NOT: JWT payload'ında kullanıcı kimliği `sub` alanındadır (`id` değil) — auth jwt.sign({sub: u.id}).
    const jwtUser = (req as FileRequest).user as { id?: string; sub?: string } | undefined;
    const callerId = (jwtUser?.id ?? jwtUser?.sub) ? String(jwtUser?.id ?? jwtUser?.sub) : null;
    if (AUTH_REQUIRED_BUCKETS.has(bucket) && !callerId) {
      return reply.code(401).send({ error: { message: 'unauthenticated' } });
    }

    const cfg = await getCloudinaryConfig();
    if (!cfg) return reply.code(501).send({ message: "storage_not_configured" });

    let mp: MultipartFile | undefined;
    try {
      mp = await (req as FileRequest).file?.();
    } catch {
      return reply.code(400).send({ error: { code: "multipart_parse_error", message: "invalid_multipart_body" } });
    }
    if (!mp) return reply.code(400).send({ message: "file_required" });

    const buf = await mp.toBuffer();
    const fileError = validateBucketFile(bucket, mp.mimetype, buf);
    if (fileError) {
      return reply.code(400).send({ error: fileError });
    }

    const desiredRaw = (query.path ?? mp.filename ?? "file").trim();
    const desired = normalizePath(bucket, desiredRaw);
    const lastSeg = desired.split("/").pop() || "";
    const pathHasExt = /\.[^./]+$/.test(lastSeg);

    let cleanName: string;
    let folder: string;
    let publicIdBase: string;

    if (query.path && !pathHasExt) {
      // path bir KLASÖR niyeti (örn 'applications') — dosya adı olarak kullanma;
      // gerçek dosya adından + benzersiz suffix üret ki farklı yüklemeler çakışmasın (409 fix).
      folder = normalizePath(bucket, query.path.trim()) || bucket;
      const orig = (mp.filename ?? "file").split("/").pop()!.replace(/[^\w.\-]+/g, "_");
      const ext = orig.includes(".") ? orig.slice(orig.lastIndexOf(".")) : "";
      const base = orig.replace(/\.[^.]+$/, "") || "file";
      publicIdBase = `${base}-${randomUUID().slice(0, 8)}`;
      cleanName = `${publicIdBase}${ext}`;
    } else {
      cleanName = lastSeg.replace(/[^\w.\-]+/g, "_");
      const folderRaw = desired.includes("/") ? desired.split("/").slice(0, -1).join("/") : undefined;
      folder = folderRaw || bucket; // bucket'ı her zaman folder olarak kullan
      publicIdBase = cleanName.replace(/\.[^.]+$/, "");
    }

    const up = await uploadBufferAuto(cfg, buf, { folder, publicId: publicIdBase, mime: mp.mimetype });

    const path = `${folder}/${cleanName}`;
    const recId = randomUUID();
    const provider = cfg.driver === "local" ? "local" : "cloudinary";

    const recordBase: NewStorageAsset = {
      id: recId,
      user_id: callerId,
      name: cleanName, bucket, path, folder: folder ?? null,
      mime: mp.mimetype,
      size: typeof up.bytes === "number" ? up.bytes : buf.length,
      width: typeof up.width === "number" ? up.width : null,
      height: typeof up.height === "number" ? up.height : null,
      url: up.secure_url || null, hash: up.etag ?? null, etag: up.etag ?? null,
      provider, provider_public_id: up.public_id ?? null,
      provider_resource_type: up.resource_type ?? null,
      provider_format: up.format ?? null,
      provider_version: typeof up.version === "number" ? up.version : null,
      metadata: null,
    };

    const upsert = toBool(query.upsert);

    try {
      await repoInsert(omitNullish(recordBase) as StorageInsertInput);
    } catch (e: unknown) {
      if (repoIsDup(e)) {
        if (!upsert) return reply.code(409).send({ error: { code: "storage_conflict", message: "asset_already_exists" } });
        const existing = await repoGetByBucketPath(bucket, path);
        if (existing) {
          return reply.send({
            id: existing.id, bucket: existing.bucket, path: existing.path,
            folder: existing.folder ?? null,
            url: buildPublicUrl(existing.bucket, existing.path, existing.url, cfg),
            width: existing.width ?? null, height: existing.height ?? null,
            provider: existing.provider, provider_public_id: existing.provider_public_id ?? null,
            provider_resource_type: existing.provider_resource_type ?? null,
            provider_format: existing.provider_format ?? null,
            provider_version: existing.provider_version ?? null, etag: existing.etag ?? null,
          });
        }
        return reply.code(409).send({ error: { code: "storage_conflict", message: "asset_exists" } });
      }
      const message = typeof e === "object" && e !== null ? (e as Error).message : undefined;
      return reply.code(502).send({ error: { code: "storage_db_error", message: message ?? "db_insert_failed" } });
    }

    return reply.send({
      id: recId, bucket, path, folder: folder ?? null,
      url: buildPublicUrl(bucket, path, up.secure_url, cfg),
      width: up.width ?? null, height: up.height ?? null,
      provider, provider_public_id: up.public_id ?? null,
      provider_resource_type: up.resource_type ?? null,
      provider_format: up.format ?? null,
      provider_version: typeof up.version === "number" ? up.version : null,
      etag: up.etag ?? null,
    });
  } catch (e) {
    return handleRouteError(reply, req, e, "upload_to_bucket");
  }
}

/** POST /storage/uploads/sign-put — S3 yoksa 501 */
export async function signPut(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ message: "s3_not_configured" });
}

/** POST /storage/uploads/sign-multipart — Cloudinary unsigned upload */
export async function signMultipart(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = signMultipartBodySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });

    const cfg = await getCloudinaryConfig();
    if (!cfg || cfg.driver === "local") return reply.code(501).send({ message: "cloudinary_not_configured" });

    const uploadPreset = cfg.unsignedUploadPreset;
    if (!uploadPreset) return reply.code(501).send({ message: "unsigned_upload_disabled" });

    const { filename, folder } = parsed.data;
    const clean = (filename || "file").replace(/[^\w.\-]+/g, "_");
    const publicId = clean.replace(/\.[^.]+$/, "");
    const upload_url = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`;
    const fields: Record<string, string> = { upload_preset: uploadPreset, folder: folder ?? "", public_id: publicId };

    return reply.send({ upload_url, fields });
  } catch (e) {
    return handleRouteError(reply, req, e, "sign_multipart");
  }
}
