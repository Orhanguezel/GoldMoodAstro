import { createReadStream } from "node:fs";
import { google } from "googleapis";
import { makeOAuthClient } from "./youtube-oauth";

export interface YouTubeAccount {
  tenantKey: string;
  accessToken: string;
  refreshToken: string;
  tokenExpires: Date;
  channelId: string;
}

export interface UploadVideoInput {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: "public" | "unlisted" | "private";
  publishAt?: string;
  defaultLanguage?: string;
}

export interface UploadVideoResult {
  videoId: string;
  videoUrl: string;
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function normalizeTags(tags: string[]): string[] {
  const output: string[] = [];
  let total = 0;
  for (const tag of tags) {
    const clean = tag.trim().replace(/^#/, "");
    if (!clean) continue;
    const nextTotal = total + clean.length + (output.length > 0 ? 1 : 0);
    if (nextTotal > 500) break;
    output.push(clean);
    total = nextTotal;
  }
  return output;
}

async function authedYouTube(account: YouTubeAccount) {
  const client = await makeOAuthClient(account.tenantKey);
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.tokenExpires.getTime(),
  });
  return google.youtube({ version: "v3", auth: client });
}

export async function uploadVideo(
  input: UploadVideoInput,
  account: YouTubeAccount,
): Promise<UploadVideoResult> {
  const youtube = await authedYouTube(account);
  const privacyStatus = input.publishAt ? "private" : input.privacyStatus;
  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: truncate(input.title.trim() || "YouTube Video", 100),
        description: truncate(input.description.trim(), 5000),
        tags: normalizeTags(input.tags),
        categoryId: input.categoryId || "22",
        defaultLanguage: input.defaultLanguage || "tr",
      },
      status: {
        privacyStatus,
        publishAt: input.publishAt,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: createReadStream(input.videoFilePath),
    },
  });

  const videoId = res.data.id;
  if (!videoId) throw new Error("YouTube video ID donmedi");
  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export async function uploadThumbnail(
  videoId: string,
  thumbnailFilePath: string,
  account: YouTubeAccount,
): Promise<void> {
  const youtube = await authedYouTube(account);
  await youtube.thumbnails.set({
    videoId,
    media: {
      body: createReadStream(thumbnailFilePath),
    },
  });
}

export async function uploadCaptions(
  videoId: string,
  captionsFilePath: string,
  language: string,
  account: YouTubeAccount,
): Promise<void> {
  const youtube = await authedYouTube(account);
  await youtube.captions.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        videoId,
        language,
        name: language.toUpperCase(),
        isDraft: false,
      },
    },
    media: {
      body: createReadStream(captionsFilePath),
    },
  });
}
