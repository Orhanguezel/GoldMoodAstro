import { google } from "googleapis";
import { buildMarketingOAuthClient } from "./google-sa";
import type { MarketingChangeSet, PlatformChangeHandler } from "./types";

export function parseContainerPath(containerIdOrPath: string) {
  const raw = containerIdOrPath.trim();
  if (!raw) throw new Error("GTM container ID tanimli degil");
  if (raw.startsWith("accounts/")) {
    const match = raw.match(/^accounts\/([^/]+)\/containers\/([^/]+)/);
    if (!match) throw new Error("GTM container path gecersiz");
    return { accountId: match[1], containerId: match[2], path: `accounts/${match[1]}/containers/${match[2]}` };
  }
  if (raw.startsWith("GTM-")) {
    return { publicId: raw };
  }
  const [accountId, containerId] = raw.includes("/") ? raw.split("/").map((part) => part.trim()) : [];
  if (accountId && containerId) return { accountId, containerId, path: `accounts/${accountId}/containers/${containerId}` };
  return { containerId: raw };
}

/**
 * Public container id (GTM-XXXX) -> numeric write path accounts/{accountId}/containers/{containerId}.
 * GTM write (tag/trigger upsert + publish) numeric path ister; kullanici elinde genelde public id olur.
 * Tum hesaplari + container'lari gezip publicId eslesmesini bulur.
 */
export async function resolveContainerPathFromPublicId(tenantKey: string, publicId: string) {
  const wanted = publicId.trim().toUpperCase();
  if (!wanted.startsWith("GTM-")) throw new Error("publicId 'GTM-...' formatinda olmali");
  const api = await buildTagManager(tenantKey);
  const accounts = await api.accounts.list();
  for (const account of accounts.data.account ?? []) {
    if (!account.path) continue;
    const containers = await api.accounts.containers.list({ parent: account.path }).catch(() => ({ data: { container: [] } }));
    for (const container of containers.data.container ?? []) {
      if ((container.publicId ?? "").toUpperCase() === wanted && container.path) {
        return {
          path: container.path,
          accountId: account.accountId ?? null,
          containerId: container.containerId ?? null,
          name: container.name ?? null,
          publicId: container.publicId ?? null,
        };
      }
    }
  }
  throw new Error(`GTM container ${publicId} bu hesabin erisebildigi container'lar arasinda bulunamadi`);
}

type GtmPayload = {
  action?: "upsert_tag" | "upsert_trigger" | "upsert_variable" | "publish" | "rollback" | "enable_built_in_variables";
  containerPath?: string;
  workspacePath?: string;
  versionId?: string;
  versionPath?: string;
  builtInVariableTypes?: string[];
  tag?: Record<string, unknown>;
  trigger?: Record<string, unknown>;
  variable?: Record<string, unknown>;
  publish?: boolean;
  versionName?: string;
  notes?: string;
};

async function buildTagManager(tenantKey: string) {
  const auth = await buildMarketingOAuthClient(tenantKey, "gtm");
  if (!auth) throw new Error("GTM OAuth refresh token veya Google OAuth client ayarlari eksik");
  return google.tagmanager({ version: "v2", auth });
}

function payloadOf(changeSet: MarketingChangeSet): GtmPayload {
  if (!changeSet.payload || typeof changeSet.payload !== "object") throw new Error("payload object zorunlu");
  return changeSet.payload as GtmPayload;
}

async function resolveWorkspacePath(tenantKey: string, changeSet: MarketingChangeSet, payload: GtmPayload) {
  if (payload.workspacePath?.trim()) return payload.workspacePath.trim();
  const rawContainer = payload.containerPath?.trim() || changeSet.targetRef?.trim();
  if (!rawContainer) throw new Error("targetRef veya payload.containerPath zorunlu");
  const parsed: { path?: string; publicId?: string } = parseContainerPath(rawContainer);
  if (!parsed.path) {
    // Public id (GTM-XXXX) -> numeric path OTOMATIK coz (write de read gibi public-id kabul etsin).
    const publicId =
      parsed.publicId || (rawContainer.toUpperCase().startsWith("GTM-") ? rawContainer : "");
    if (!publicId) throw new Error("GTM write icin container path accounts/{accountId}/containers/{containerId} formatinda olmali");
    parsed.path = (await resolveContainerPathFromPublicId(tenantKey, publicId)).path;
  }
  const tagmanager = await buildTagManager(tenantKey);
  const workspaces = await tagmanager.accounts.containers.workspaces.list({ parent: parsed.path });
  const workspace = workspaces.data.workspace?.[0];
  if (!workspace?.path) throw new Error("GTM workspace bulunamadi");
  return workspace.path;
}

function ensureActionPayload(payload: GtmPayload) {
  if (!payload.action) throw new Error("payload.action zorunlu");
  if (payload.action === "upsert_tag" && !payload.tag) throw new Error("payload.tag zorunlu");
  if (payload.action === "upsert_trigger" && !payload.trigger) throw new Error("payload.trigger zorunlu");
  if (payload.action === "upsert_variable" && !payload.variable) throw new Error("payload.variable zorunlu");
  if (payload.action === "rollback" && !payload.versionId?.trim() && !payload.versionPath?.trim()) {
    throw new Error("rollback icin versionId veya versionPath zorunlu");
  }
  if (payload.action === "enable_built_in_variables" && !payload.builtInVariableTypes?.length) {
    throw new Error("enable_built_in_variables icin builtInVariableTypes zorunlu");
  }
}

function containerPathFromVersionPath(versionPath: string) {
  const match = versionPath.match(/^(accounts\/[^/]+\/containers\/[^/]+)\/versions\/[^/]+$/);
  if (!match) throw new Error("versionPath gecersiz");
  return match[1];
}

async function resolveContainerPath(tenantKey: string, rawContainer: string) {
  const parsed: { path?: string; publicId?: string } = parseContainerPath(rawContainer);
  if (parsed.path) return parsed.path;
  const publicId = parsed.publicId || (rawContainer.toUpperCase().startsWith("GTM-") ? rawContainer : "");
  if (!publicId) throw new Error("GTM container path accounts/{accountId}/containers/{containerId} formatinda olmali");
  return (await resolveContainerPathFromPublicId(tenantKey, publicId)).path;
}

async function resolveContainerPathForPayload(tenantKey: string, changeSet: MarketingChangeSet, payload: GtmPayload) {
  if (payload.versionPath?.trim()) return containerPathFromVersionPath(payload.versionPath.trim());
  const rawContainer = payload.containerPath?.trim() || changeSet.targetRef?.trim();
  if (!rawContainer) throw new Error("targetRef veya payload.containerPath zorunlu");
  return resolveContainerPath(tenantKey, rawContainer);
}

function versionPathFor(containerPath: string, versionId: string) {
  const id = versionId.trim();
  if (!id) throw new Error("versionId zorunlu");
  return `${containerPath}/versions/${id}`;
}

async function resolveVersionPath(tenantKey: string, changeSet: MarketingChangeSet, payload: GtmPayload) {
  if (payload.versionPath?.trim()) return payload.versionPath.trim();
  const containerPath = await resolveContainerPathForPayload(tenantKey, changeSet, payload);
  return versionPathFor(containerPath, payload.versionId ?? "");
}

async function upsertEntity(api: any, collection: "tags" | "triggers" | "variables", workspacePath: string, entity: Record<string, unknown>) {
  const path = typeof entity.path === "string" ? entity.path : "";
  const idKey = collection === "tags" ? "tagId" : collection === "triggers" ? "triggerId" : "variableId";
  const entityId = typeof entity[idKey] === "string" ? String(entity[idKey]) : "";
  const requestBody = { ...entity };
  const resource = api.accounts.containers.workspaces[collection];
  if (path || entityId) {
    const updatePath = path || `${workspacePath}/${collection}/${entityId}`;
    const res = await resource.update({ path: updatePath, requestBody });
    return res.data;
  }
  // Idempotent: explicit id/path yoksa ayni isimde entity var mi diye bak; varsa update et
  // (re-run'larda "Found entity with duplicate name" hatasini onler).
  const entityName = typeof entity.name === "string" ? entity.name : "";
  if (entityName) {
    const listKey = collection === "tags" ? "tag" : collection === "triggers" ? "trigger" : "variable";
    const existing = await resource.list({ parent: workspacePath }).catch(() => ({ data: {} as Record<string, unknown[]> }));
    const items = (existing.data?.[listKey] as Array<{ name?: string; path?: string }> | undefined) ?? [];
    const match = items.find((it) => it.name === entityName);
    if (match?.path) {
      const res = await resource.update({ path: match.path, requestBody });
      return res.data;
    }
  }
  const res = await resource.create({ parent: workspacePath, requestBody });
  return res.data;
}

async function createAndPublishVersion(api: any, workspacePath: string, payload: GtmPayload) {
  const created = await api.accounts.containers.workspaces.create_version({
    path: workspacePath,
    requestBody: {
      name: payload.versionName || "Ekosistem otomasyon yayini",
      notes: payload.notes || "Onayli change-set uzerinden olusturuldu.",
    },
  });
  const versionPath = created.data?.containerVersion?.path;
  if (!versionPath) return { createdVersion: created.data, published: null };
  const published = await api.accounts.containers.versions.publish({ path: versionPath });
  return { createdVersion: created.data, published: published.data };
}

async function rollbackVersion(api: any, versionPath: string) {
  const latest = await api.accounts.containers.versions.set_latest({ path: versionPath });
  const published = await api.accounts.containers.versions.publish({ path: versionPath });
  return { latest: latest.data, published: published.data };
}

async function enableBuiltInVariables(api: any, workspacePath: string, types: string[]) {
  const uniqueTypes = [...new Set(types.map((type) => type.trim()).filter(Boolean))];
  if (uniqueTypes.length === 0) throw new Error("built-in variable type bos olamaz");
  const res = await api.accounts.containers.workspaces.built_in_variables.create({
    parent: workspacePath,
    type: uniqueTypes,
  });
  return res.data;
}

export async function fetchGtmVersionDetail(tenantKey: string, containerIdOrPath: string, versionId: string) {
  const api = await buildTagManager(tenantKey);
  const containerPath = await resolveContainerPath(tenantKey, containerIdOrPath);
  const versionPath = versionPathFor(containerPath, versionId);
  const res = await api.accounts.containers.versions.get({ path: versionPath, containerVersionId: versionId });
  return res.data;
}

function entityMap(version: Record<string, any>, key: "tag" | "trigger" | "variable") {
  const idKey = key === "tag" ? "tagId" : key === "trigger" ? "triggerId" : "variableId";
  const items = Array.isArray(version?.[key]) ? version[key] : [];
  return new Map(
    items.map((item: Record<string, unknown>) => {
      const id = String(item[idKey] ?? item.name ?? JSON.stringify(item));
      return [id, item];
    }),
  );
}

function diffEntities(a: Record<string, any>, b: Record<string, any>, key: "tag" | "trigger" | "variable") {
  const left = entityMap(a, key);
  const right = entityMap(b, key);
  const added: unknown[] = [];
  const removed: unknown[] = [];
  const changed: Array<{ before: unknown; after: unknown }> = [];
  for (const [id, item] of right.entries()) {
    if (!left.has(id)) added.push(item);
    else if (JSON.stringify(left.get(id)) !== JSON.stringify(item)) changed.push({ before: left.get(id), after: item });
  }
  for (const [id, item] of left.entries()) {
    if (!right.has(id)) removed.push(item);
  }
  return { added, removed, changed };
}

export async function diffGtmVersions(tenantKey: string, containerIdOrPath: string, versionA: string, versionB: string) {
  const [a, b] = await Promise.all([
    fetchGtmVersionDetail(tenantKey, containerIdOrPath, versionA),
    fetchGtmVersionDetail(tenantKey, containerIdOrPath, versionB),
  ]);
  return {
    versionA: { id: versionA, name: a.name ?? null },
    versionB: { id: versionB, name: b.name ?? null },
    tags: diffEntities(a as Record<string, any>, b as Record<string, any>, "tag"),
    triggers: diffEntities(a as Record<string, any>, b as Record<string, any>, "trigger"),
    variables: diffEntities(a as Record<string, any>, b as Record<string, any>, "variable"),
  };
}

export async function fetchGtmSummary(tenantKey: string, containerIdOrPath: string) {
  let tagmanager;
  try {
    tagmanager = await buildTagManager(tenantKey);
  } catch {
    return {
      configured: false,
      message: "GTM OAuth refresh token veya Google OAuth client ayarlari eksik",
    };
  }
  const parsed: { path?: string; publicId?: string; accountId?: string; containerId?: string } =
    parseContainerPath(containerIdOrPath);

  if (!parsed.path) {
    // Public id (GTM-XXXX) -> numeric path OTOMATIK coz (detayli okuma path ister).
    const publicId =
      parsed.publicId ||
      (containerIdOrPath.trim().toUpperCase().startsWith("GTM-") ? containerIdOrPath.trim() : "");
    if (publicId) {
      try {
        parsed.path = (await resolveContainerPathFromPublicId(tenantKey, publicId)).path;
      } catch (err) {
        return {
          configured: true,
          containerId: containerIdOrPath,
          needsAccountPath: true,
          message: `GTM container path otomatik cozulemedi: ${(err as Error).message}`,
        };
      }
    }
  }

  if (!parsed.path) {
    return {
      configured: true,
      containerId: containerIdOrPath,
      needsAccountPath: true,
      message: "Detayli GTM okuma icin container path accounts/{accountId}/containers/{containerId} formatinda olmali.",
    };
  }

  const workspaces = await tagmanager.accounts.containers.workspaces.list({ parent: parsed.path });
  const workspace = workspaces.data.workspace?.[0];
  const workspacePath = workspace?.path;
  if (!workspacePath) {
    return {
      configured: true,
      container: parsed.path,
      workspaces: [],
      tags: [],
      triggers: [],
      variables: [],
      versions: [],
    };
  }

  const [tags, triggers, variables, builtInVariables, versions] = await Promise.all([
    tagmanager.accounts.containers.workspaces.tags.list({ parent: workspacePath }).catch(() => ({ data: { tag: [] } })),
    tagmanager.accounts.containers.workspaces.triggers.list({ parent: workspacePath }).catch(() => ({ data: { trigger: [] } })),
    tagmanager.accounts.containers.workspaces.variables.list({ parent: workspacePath }).catch(() => ({ data: { variable: [] } })),
    tagmanager.accounts.containers.workspaces.built_in_variables.list({ parent: workspacePath }).catch(() => ({ data: { builtInVariable: [] } })),
    // Versiyon listesi: GTM API'de 'versions.list' YOK, dogrusu 'version_headers.list'.
    // Senkron 'undefined.list' throw'unu da yakalamak icin try/catch ile sariyoruz.
    (async () => {
      try {
        const vh = await (tagmanager.accounts.containers as any).version_headers.list({ parent: parsed.path });
        return { data: { items: vh.data?.containerVersionHeader ?? [] } };
      } catch {
        return { data: { items: [] } };
      }
    })(),
  ]);

  return {
    configured: true,
    container: parsed.path,
    workspace: {
      path: workspace.path,
      name: workspace.name,
      workspaceId: workspace.workspaceId,
    },
    tags: tags.data.tag ?? [],
    triggers: triggers.data.trigger ?? [],
    variables: variables.data.variable ?? [],
    builtInVariables: builtInVariables.data.builtInVariable ?? [],
    versions: (versions.data as { items?: unknown[] }).items ?? [],
  };
}

export const gtmChangeHandler: PlatformChangeHandler = {
  async validate(tenantKey, changeSet) {
    try {
      const payload = payloadOf(changeSet);
      ensureActionPayload(payload);
      const api = await buildTagManager(tenantKey);
      if (payload.action === "rollback") {
        const versionPath = await resolveVersionPath(tenantKey, changeSet, payload);
        const version = await api.accounts.containers.versions.get({ path: versionPath });
        return {
          ok: true,
          result: {
            dryRun: true,
            action: payload.action,
            versionPath,
            versionId: version.data?.containerVersionId ?? payload.versionId,
            versionName: version.data?.name ?? null,
          },
        };
      }
      const workspacePath = await resolveWorkspacePath(tenantKey, changeSet, payload);
      // quick_preview best-effort: bazi token'lar (yalniz edit.containers+publish) bu cagri icin
      // yeterli scope'a sahip olmayabilir. Onizleme alinamazsa validate'i bloklamayiz —
      // workspace cozuldu + payload gecerli; gercek hatalar apply'da yuzeye cikar.
      let preview: { compilerError?: boolean; syncStatus?: unknown } | null = null;
      let previewError: string | null = null;
      try {
        const res = await api.accounts.containers.workspaces.quick_preview({ path: workspacePath });
        preview = { compilerError: res.data?.compilerError ?? false, syncStatus: res.data?.syncStatus ?? null };
      } catch (previewErr) {
        previewError = (previewErr as Error).message;
      }
      return {
        ok: true,
        result: {
          dryRun: true,
          workspacePath,
          action: payload.action,
          compilerError: preview?.compilerError ?? false,
          syncStatus: preview?.syncStatus ?? null,
          previewSkipped: preview ? undefined : (previewError ?? "preview unavailable"),
        },
      };
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },
  async apply(tenantKey, changeSet) {
    try {
      const payload = payloadOf(changeSet);
      ensureActionPayload(payload);
      const api = await buildTagManager(tenantKey);
      if (payload.action === "rollback") {
        const versionPath = await resolveVersionPath(tenantKey, changeSet, payload);
        const rollback = await rollbackVersion(api, versionPath);
        return {
          ok: true,
          result: {
            action: payload.action,
            versionPath,
            rollback,
          },
        };
      }
      const workspacePath = await resolveWorkspacePath(tenantKey, changeSet, payload);
      let mutation: unknown = null;
      if (payload.action === "upsert_tag") mutation = await upsertEntity(api, "tags", workspacePath, payload.tag!);
      if (payload.action === "upsert_trigger") mutation = await upsertEntity(api, "triggers", workspacePath, payload.trigger!);
      if (payload.action === "upsert_variable") mutation = await upsertEntity(api, "variables", workspacePath, payload.variable!);
      if (payload.action === "enable_built_in_variables") mutation = await enableBuiltInVariables(api, workspacePath, payload.builtInVariableTypes ?? []);
      const publication = payload.action === "publish" || payload.publish ? await createAndPublishVersion(api, workspacePath, payload) : null;
      return {
        ok: true,
        result: {
          workspacePath,
          action: payload.action,
          mutation,
          publication,
        },
      };
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },
};
