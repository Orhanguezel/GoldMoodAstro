// Faz 3 stub — video oto-duzenleme kuyrugu (BullMQ + ioredis) devre disi.
// Yalnizca /posts/:id/auto-edit* endpoint'leri kullanir; goldmoodastro'da video
// oto-duzenleme aktif degil (Redis yok). Cagrilirsa net hata verir.
export type VideoEditJobPayload = Record<string, unknown>;

export async function enqueueVideoEditJob(
  _payload: VideoEditJobPayload,
): Promise<{ id: string }> {
  throw new Error(
    "Video oto-duzenleme bu surumde devre disi (Redis/BullMQ kurulu degil).",
  );
}

export function getVideoEditQueue(): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getJob: (id: string) => Promise<any>;
} {
  throw new Error(
    "Video oto-duzenleme bu surumde devre disi (Redis/BullMQ kurulu degil).",
  );
}
