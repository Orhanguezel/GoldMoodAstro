import { google } from "googleapis";
import { makeOAuthClient } from "../platforms/youtube-oauth";

export interface YouTubeAccount {
  tenantKey: string;
  accessToken: string;
  refreshToken: string;
  tokenExpires: Date;
  channelId: string;
}

async function authedYouTubeAnalytics(account: YouTubeAccount) {
  const client = await makeOAuthClient(account.tenantKey);
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.tokenExpires.getTime(),
  });
  return google.youtubeAnalytics({ version: "v2", auth: client });
}

async function authedYouTubeData(account: YouTubeAccount) {
  const client = await makeOAuthClient(account.tenantKey);
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.tokenExpires.getTime(),
  });
  return google.youtube({ version: "v3", auth: client });
}

export async function fetchVideoStats(
  videoId: string,
  account: YouTubeAccount,
  rangeDays = 30,
) {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const ytAnalytics = await authedYouTubeAnalytics(account);
  const youtube = await authedYouTubeData(account);

  // Fetch basic video details from YouTube Data API (likes, comments, views)
  const detailsRes = await youtube.videos.list({
    part: ["snippet", "statistics", "contentDetails"],
    id: [videoId],
  });
  const video = detailsRes.data.items?.[0];
  if (!video) throw new Error(`Video bulunamadı: ${videoId}`);

  // Query YouTube Analytics for views/impressions/CTR
  let viewsData: any = { totalViews: 0, totalImpressions: 0, averageCTR: 0, dailyData: [] };
  try {
    const response = await ytAnalytics.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,impressions,impressionClickThroughRate",
      dimensions: "day",
      filters: `video==${videoId}`,
    });
    const rows = response.data.rows || [];
    viewsData = {
      totalViews: rows.reduce((sum, row) => sum + Number(row[1] || 0), 0),
      totalImpressions: rows.reduce((sum, row) => sum + Number(row[2] || 0), 0),
      averageCTR: rows.length ? rows.reduce((sum, row) => sum + Number(row[3] || 0), 0) / rows.length : 0,
      dailyData: rows,
    };
  } catch (err) {
    console.warn("YouTube Analytics views query failed:", err);
  }

  // Query YouTube Analytics for watch time / retention
  let watchTimeData: any = { totalWatchTime: 0, averageViewDuration: 0, averageViewPercentage: 0 };
  try {
    const response = await ytAnalytics.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "estimatedMinutesWatched,averageViewDuration,averageViewPercentage",
      filters: `video==${videoId}`,
    });
    const data = response.data.rows?.[0] || [0, 0, 0];
    watchTimeData = {
      totalWatchTime: Number(data[0] || 0),
      averageViewDuration: Number(data[1] || 0),
      averageViewPercentage: Number(data[2] || 0),
    };
  } catch (err) {
    console.warn("YouTube Analytics watch time query failed:", err);
  }

  // Demographics
  let demographicsData: any = { ageGroups: [], genders: [] };
  try {
    const [ageRes, genderRes] = await Promise.all([
      ytAnalytics.reports.query({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "viewerPercentage",
        dimensions: "ageGroup",
        filters: `video==${videoId}`,
      }),
      ytAnalytics.reports.query({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "viewerPercentage",
        dimensions: "gender",
        filters: `video==${videoId}`,
      }),
    ]);
    demographicsData = {
      ageGroups: ageRes.data.rows || [],
      genders: genderRes.data.rows || [],
    };
  } catch (err) {
    console.warn("YouTube Analytics demographics query failed:", err);
  }

  // Traffic Sources
  let trafficSources: any[] = [];
  try {
    const response = await ytAnalytics.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views",
      dimensions: "insightTrafficSourceType",
      filters: `video==${videoId}`,
    });
    const rows = response.data.rows || [];
    const total = rows.reduce((sum, row) => sum + Number(row[1] || 0), 0);
    trafficSources = rows.map((row) => ({
      source: row[0],
      views: row[1],
      percentage: total > 0 ? ((Number(row[1]) / total) * 100).toFixed(1) : "0",
    }));
  } catch (err) {
    console.warn("YouTube Analytics traffic sources query failed:", err);
  }

  // Devices
  let deviceData: any[] = [];
  try {
    const response = await ytAnalytics.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views",
      dimensions: "deviceType",
      filters: `video==${videoId}`,
    });
    const rows = response.data.rows || [];
    const total = rows.reduce((sum, row) => sum + Number(row[1] || 0), 0);
    deviceData = rows.map((row) => ({
      device: row[0],
      views: row[1],
      percentage: total > 0 ? ((Number(row[1]) / total) * 100).toFixed(1) : "0",
    }));
  } catch (err) {
    console.warn("YouTube Analytics device type query failed:", err);
  }

  const likes = parseInt(video.statistics?.likeCount || "0", 10);
  const comments = parseInt(video.statistics?.commentCount || "0", 10);
  const views = parseInt(video.statistics?.viewCount || "0", 10);

  return {
    videoId,
    title: video.snippet?.title || "",
    publishedAt: video.snippet?.publishedAt || "",
    duration: video.contentDetails?.duration || "",
    statistics: {
      views,
      likes,
      comments,
    },
    analytics: {
      period: { startDate, endDate },
      views: viewsData,
      watchTime: watchTimeData,
      demographics: demographicsData,
      trafficSources,
      devices: deviceData,
    },
  };
}

export async function fetchChannelStats(
  account: YouTubeAccount,
  rangeDays = 30,
) {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const ytAnalytics = await authedYouTubeAnalytics(account);
  const youtube = await authedYouTubeData(account);

  // Fetch channel basic info
  const channelRes = await youtube.channels.list({
    part: ["snippet", "statistics"],
    id: [account.channelId],
  });
  const channel = channelRes.data.items?.[0];

  // Fetch channel-wide time series metrics
  let viewsReport: any[] = [];
  try {
    const response = await ytAnalytics.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,likes,comments,shares,estimatedMinutesWatched",
      dimensions: "day",
    });
    viewsReport = response.data.rows || [];
  } catch (err) {
    console.warn("YouTube Analytics channel query failed:", err);
  }

  return {
    channel: {
      id: account.channelId,
      title: channel?.snippet?.title || "",
      subscribers: parseInt(channel?.statistics?.subscriberCount || "0", 10),
      views: parseInt(channel?.statistics?.viewCount || "0", 10),
      videos: parseInt(channel?.statistics?.videoCount || "0", 10),
      thumbnails: channel?.snippet?.thumbnails,
    },
    report: viewsReport.map((row) => ({
      date: row[0],
      views: row[1],
      likes: row[2],
      comments: row[3],
      shares: row[4],
      watchTimeMinutes: row[5],
    })),
  };
}
