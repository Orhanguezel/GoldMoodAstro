'use client';

// =============================================================
// FILE: src/app/(main)/admin/reports/_components/admin-reports-client.tsx
// FINAL — Admin Reports (KPI + Users Performance + Locations)
// - Tabs: kpi | users | locations
// - URL state: tab, from, to, role
// - RTK: reports_admin.api.ts hooks
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCcw, Calendar, Users, MapPin, BarChart3, Loader2, Download } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { KpiRow, UserPerformanceRow, LocationRow } from '@/integrations/shared';

import {
  useAdminReportsKpiQuery,
  useAdminReportsUsersPerformanceQuery,
  useAdminReportsLocationsQuery,
  useListResourcesAdminQuery,
  useListServicesAdminQuery,
} from '@/integrations/hooks';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';

/* ----------------------------- helpers ----------------------------- */

type TabKey = 'kpi' | 'users' | 'locations';

const KPI_CHART_CONFIG = {
  bookings_total: { label: 'Bookings', color: 'var(--chart-1)' },
  completed_total: { label: 'Completed', color: 'var(--chart-2)' },
  previous_bookings_total: { label: 'Previous', color: 'var(--muted-foreground)' },
} satisfies ChartConfig;

const RESOURCE_CHART_CONFIG = {
  bookings_total: { label: 'Bookings', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const LOCALE_CHART_CONFIG = {
  bookings_total: { label: 'Bookings', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const STATUS_OPTIONS = ['new', 'confirmed', 'rejected', 'completed', 'cancelled', 'expired'] as const;
const COMPARE_OPTIONS = ['off', 'previous'] as const;
const RANGE_PRESETS = [7, 30, 90] as const;

function safeText(v: unknown, fb = ''): string {
  const s = String(v ?? '').trim();
  return s ? s : fb;
}

function getErrMessage(err: unknown, t: (k: string, p?: any, fb?: string) => string): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return t('reports.error.generic', {}, 'İşlem başarısız. Lütfen tekrar deneyin.');
}

function pickTab(sp: URLSearchParams): TabKey {
  const t = (sp.get('tab') ?? 'kpi').toLowerCase();
  if (t === 'users' || t === 'locations') return t;
  return 'kpi';
}

function toQS(next: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(next).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

function yyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  return { from: yyyyMmDd(from), to: yyyyMmDd(to) };
}

function parseYmd(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const d = new Date(`${input}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffDaysInclusive(from: string, to: string): number {
  const f = parseYmd(from);
  const t = parseYmd(to);
  if (!f || !t) return 0;
  const diff = Math.round((t.getTime() - f.getTime()) / (24 * 3600 * 1000));
  return diff >= 0 ? diff + 1 : 0;
}

function shiftYmd(input: string, days: number): string {
  const d = parseYmd(input);
  if (!d) return input;
  d.setDate(d.getDate() + days);
  return yyyyMmDd(d);
}

function fmtNum(n: any): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  return new Intl.NumberFormat('tr-TR').format(x);
}

function fmtRate(r: any): string {
  const x = Number(r);
  if (!Number.isFinite(x)) return '0%';
  // backend 0..1 => percent
  return `${Math.round(x * 10000) / 100}%`;
}

function labelForBucket(v: string): string {
  if (!v) return '—';
  if (v.includes('-W')) return v;
  if (/^\d{4}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
}

function csvEscape(v: unknown): string {
  const text = String(v ?? '');
  if (/[",\n;]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function csvString(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(';'),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(';')),
  ];
  return `\uFEFF${lines.join('\n')}`;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (typeof window === 'undefined' || rows.length === 0) return;
  const blob = new Blob([csvString(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function chartElementToCanvas(container: HTMLElement): Promise<HTMLCanvasElement> {
  const svg = container.querySelector('svg');
  if (!(svg instanceof SVGElement)) {
    throw new Error('chart_svg_not_found');
  }

  const rect = container.getBoundingClientRect();
  const width = Math.max(800, Math.round(rect.width || 800));
  const height = Math.max(360, Math.round(rect.height || 360));
  const cloned = svg.cloneNode(true) as SVGElement;
  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  cloned.setAttribute('width', String(width));
  cloned.setAttribute('height', String(height));
  if (!cloned.getAttribute('viewBox')) {
    cloned.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  const serialized = new XMLSerializer().serializeToString(cloned);
  const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('chart_image_load_failed'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('chart_canvas_context_failed');
    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function downloadCanvasAsPng(filename: string, canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('chart_png_blob_failed');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildPdfFromJpeg(jpegBytes: Uint8Array, widthPx: number, heightPx: number): Uint8Array {
  return buildPdfFromImages([{ jpegBytes, widthPx, heightPx }]);
}

function buildPdfFromImages(
  pages: Array<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }>,
): Uint8Array {
  const pxToPt = 0.75;
  const maxWidth = 842;
  const maxHeight = 595;
  const objects: (string | Uint8Array)[] = [];
  const offsets: number[] = [0];

  const addString = (value: string) => {
    objects.push(value);
  };
  const addBinary = (value: Uint8Array) => {
    objects.push(value);
  };

  addString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const pageObjectIds: number[] = [];
  let nextObjectId = 3;
  for (let index = 0; index < pages.length; index += 1) {
    pageObjectIds.push(nextObjectId);
    nextObjectId += 3;
  }

  addString(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>\nendobj\n`,
  );

  for (let index = 0; index < pages.length; index += 1) {
    const { jpegBytes, widthPx, heightPx } = pages[index];
    let pageWidth = widthPx * pxToPt;
    let pageHeight = heightPx * pxToPt;
    const scale = Math.min(maxWidth / pageWidth, maxHeight / pageHeight, 1);
    pageWidth = Math.round(pageWidth * scale);
    pageHeight = Math.round(pageHeight * scale);

    const pageId = pageObjectIds[index];
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const imageName = `Im${index}`;
    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/${imageName} Do\nQ\n`;

    addString(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /${imageName} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
    );
    addString(
      `${contentId} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`,
    );
    addString(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
    );
    addBinary(jpegBytes);
    addString('\nendstream\nendobj\n');
  }

  let size = '%PDF-1.4\n'.length;
  for (const part of objects) {
    offsets.push(size);
    size += typeof part === 'string' ? new TextEncoder().encode(part).length : part.length;
  }

  const xrefStart = size;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [encoder.encode('%PDF-1.4\n')];
  for (const part of objects) {
    parts.push(typeof part === 'string' ? encoder.encode(part) : part);
  }
  parts.push(encoder.encode(xref));
  parts.push(encoder.encode(trailer));

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

async function downloadChartAsPdf(filename: string, canvas: HTMLCanvasElement) {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const pdfBytes = buildPdfFromJpeg(bytes, canvas.width, canvas.height);
  const blob = new Blob([toArrayBuffer(pdfBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function canvasToJpegBytes(canvas: HTMLCanvasElement): Uint8Array {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Uint8Array {
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function downloadChartsAsPdf(
  filename: string,
  canvases: HTMLCanvasElement[],
) {
  const pdfBytes = buildPdfFromImages(
    canvases.map((canvas) => ({
      jpegBytes: canvasToJpegBytes(canvas),
      widthPx: canvas.width,
      heightPx: canvas.height,
    })),
  );
  const blob = new Blob([toArrayBuffer(pdfBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function summarizeTotals(
  tab: TabKey,
  kpis: KpiRow[],
  users: UserPerformanceRow[],
  locales: LocationRow[],
) {
  if (tab === 'kpi') {
    return kpis
      .filter((row) => row.period === 'day')
      .reduce(
        (acc, row) => ({
          bookings_total: acc.bookings_total + Number(row.bookings_total || 0),
          completed_total: acc.completed_total + Number(row.completed_total || 0),
          cancelled_total: acc.cancelled_total + Number(row.cancelled_total || 0),
        }),
        { bookings_total: 0, completed_total: 0, cancelled_total: 0 },
      );
  }

  const rows = tab === 'users' ? users : locales;
  return rows.reduce(
    (acc, row) => ({
      bookings_total: acc.bookings_total + Number((row as any).bookings_total || 0),
      completed_total: acc.completed_total + Number((row as any).completed_total || 0),
      cancelled_total: acc.cancelled_total + Number((row as any).cancelled_orders || 0),
    }),
    { bookings_total: 0, completed_total: 0, cancelled_total: 0 },
  );
}

function deltaText(current: number, previous: number): string {
  const diff = current - previous;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${fmtNum(diff)}`;
}

function toRowMap<T extends Record<string, unknown>>(rows: T[], key: keyof T): Map<string, T> {
  return new Map(rows.map((row) => [String(row[key] ?? ''), row]));
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function u32(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function buildZip(files: Array<{ name: string; bytes: Uint8Array }>): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.bytes;
    const crc = crc32(data);
    const local = new Uint8Array([
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(crc),
      ...u32(data.length),
      ...u32(data.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...nameBytes,
      ...data,
    ]);
    locals.push(local);

    const central = new Uint8Array([
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(crc),
      ...u32(data.length),
      ...u32(data.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(offset),
      ...nameBytes,
    ]);
    centrals.push(central);
    offset += local.length;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(files.length),
    ...u16(files.length),
    ...u32(centralSize),
    ...u32(offset),
    ...u16(0),
  ]);

  return concatBytes([...locals, ...centrals, end]);
}

/* ----------------------------- component ----------------------------- */

export default function AdminReportsClient() {
  const t = useAdminT();
  const router = useRouter();
  const sp = useSearchParams();

  const tab = React.useMemo(() => pickTab(sp), [sp]);

  // URL params
  const { from: dfb, to: dtb } = React.useMemo(() => defaultRange(), []);
  const from = sp.get('from') ?? dfb;
  const to = sp.get('to') ?? dtb;
  const serviceId = sp.get('service_id') ?? '';
  const resourceId = sp.get('resource_id') ?? '';
  const status = sp.get('status') ?? '';
  const locale = sp.get('locale') ?? '';
  const compare = sp.get('compare') === 'previous' ? 'previous' : 'off';

  // local inputs
  const [fromText, setFromText] = React.useState(from);
  const [toText, setToText] = React.useState(to);
  const [serviceIdText, setServiceIdText] = React.useState(serviceId);
  const [resourceIdText, setResourceIdText] = React.useState(resourceId);
  const [statusText, setStatusText] = React.useState(status);
  const [localeText, setLocaleText] = React.useState(locale);
  const [compareText, setCompareText] = React.useState<typeof COMPARE_OPTIONS[number]>(compare);
  const { localeOptions } = useAdminLocales();
  const kpiChartRef = React.useRef<HTMLDivElement | null>(null);
  const usersChartRef = React.useRef<HTMLDivElement | null>(null);
  const localesChartRef = React.useRef<HTMLDivElement | null>(null);
  const resourcesQ = useListResourcesAdminQuery({ status: 'active', limit: 200 });
  const servicesQ = useListServicesAdminQuery({ is_active: 1, limit: 200 });
  const serviceOptions = React.useMemo(
    () =>
      Array.isArray((servicesQ.data as any)?.items)
        ? ((servicesQ.data as any).items as any[]).map((item) => ({
            value: String(item.id),
            label: safeText(item.name, item.id),
          }))
        : [],
    [servicesQ.data],
  );
  const resourceOptions = React.useMemo(
    () => (Array.isArray(resourcesQ.data) ? resourcesQ.data : []).map((item) => ({
      value: item.id,
      label: safeText(item.title || (item as any).label, item.id),
    })),
    [resourcesQ.data],
  );

  React.useEffect(() => setFromText(from), [from]);
  React.useEffect(() => setToText(to), [to]);
  React.useEffect(() => setServiceIdText(serviceId), [serviceId]);
  React.useEffect(() => setResourceIdText(resourceId), [resourceId]);
  React.useEffect(() => setStatusText(status), [status]);
  React.useEffect(() => setLocaleText(locale), [locale]);
  React.useEffect(() => setCompareText(compare), [compare]);

  function apply(
    next: Partial<{
      tab: TabKey;
      from: string;
      to: string;
      service_id: string;
      resource_id: string;
      status: string;
      locale: string;
      compare: 'off' | 'previous';
    }>,
  ) {
    const merged = {
      tab,
      from,
      to,
      service_id: serviceId,
      resource_id: resourceId,
      status,
      locale,
      compare,
      ...next,
    };

    const qs = toQS({
      tab: merged.tab,
      from: merged.from || undefined,
      to: merged.to || undefined,
      service_id: merged.service_id || undefined,
      resource_id: merged.resource_id || undefined,
      status: merged.status || undefined,
      locale: merged.locale || undefined,
      compare: merged.compare !== 'off' ? merged.compare : undefined,
    });

    router.push(`/admin/reports${qs}`);
  }

  function onSubmitFilters(e: React.FormEvent) {
    e.preventDefault();

    // minimal UI guard (backend refine will still validate)
    const f = fromText.trim();
    const toVal = toText.trim();

    if (f && Number.isNaN(new Date(f).getTime())) {
      toast.error(t('reports.filter.invalidFrom', {}, 'Başlangıç geçersiz tarih.'));
      return;
    }
    if (toVal && Number.isNaN(new Date(toVal).getTime())) {
      toast.error(t('reports.filter.invalidTo', {}, 'Bitiş geçersiz tarih.'));
      return;
    }

    apply({
      from: f,
      to: toVal,
      service_id: serviceIdText.trim(),
      resource_id: resourceIdText.trim(),
      status: statusText.trim(),
      locale: localeText.trim(),
      compare: compareText,
    });
  }

  function onReset() {
    const d = defaultRange();
    setFromText(d.from);
    setToText(d.to);
    setServiceIdText('');
    setResourceIdText('');
    setStatusText('');
    setLocaleText('');
    setCompareText('off');
    apply({ from: d.from, to: d.to, service_id: '', resource_id: '', status: '', locale: '', compare: 'off' });
  }

  function applyPreset(days: (typeof RANGE_PRESETS)[number]) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const nextFrom = yyyyMmDd(start);
    const nextTo = yyyyMmDd(end);
    setFromText(nextFrom);
    setToText(nextTo);
    apply({
      from: nextFrom,
      to: nextTo,
      service_id: serviceIdText.trim(),
      resource_id: resourceIdText.trim(),
      status: statusText.trim(),
      locale: localeText.trim(),
      compare: compareText,
    });
  }

  /* ----------------------------- queries ----------------------------- */

  const commonRange = React.useMemo(
    () => ({
      from,
      to,
      ...(serviceId ? { service_id: serviceId } : {}),
      ...(resourceId ? { resource_id: resourceId } : {}),
      ...(status ? { status } : {}),
      ...(locale ? { locale } : {}),
    }),
    [from, locale, resourceId, serviceId, status, to],
  );
  const compareRange = React.useMemo(() => {
    if (compare !== 'previous') return null;
    const length = diffDaysInclusive(from, to);
    if (!length) return null;
    const prevTo = shiftYmd(from, -1);
    const prevFrom = shiftYmd(from, -length);
    return {
      ...commonRange,
      from: prevFrom,
      to: prevTo,
    };
  }, [commonRange, compare, from, to]);

  const kpiQ = useAdminReportsKpiQuery(tab === 'kpi' ? (commonRange as any) : (undefined as any), {
    skip: tab !== 'kpi',
  } as any) as any;
  const compareKpiQ = useAdminReportsKpiQuery(
    tab === 'kpi' && compareRange ? (compareRange as any) : (undefined as any),
    { skip: tab !== 'kpi' || !compareRange } as any,
  ) as any;

  const usersQ = useAdminReportsUsersPerformanceQuery(
    tab === 'users' ? ({ ...commonRange } as any) : (undefined as any),
    { skip: tab !== 'users' } as any,
  ) as any;
  const compareUsersQ = useAdminReportsUsersPerformanceQuery(
    tab === 'users' && compareRange ? ({ ...compareRange } as any) : (undefined as any),
    { skip: tab !== 'users' || !compareRange } as any,
  ) as any;

  const locQ = useAdminReportsLocationsQuery(
    tab === 'locations' ? (commonRange as any) : (undefined as any),
    { skip: tab !== 'locations' } as any,
  ) as any;
  const compareLocQ = useAdminReportsLocationsQuery(
    tab === 'locations' && compareRange ? (compareRange as any) : (undefined as any),
    { skip: tab !== 'locations' || !compareRange } as any,
  ) as any;

  const busy =
    kpiQ.isFetching ||
    usersQ.isFetching ||
    locQ.isFetching ||
    compareKpiQ.isFetching ||
    compareUsersQ.isFetching ||
    compareLocQ.isFetching;

  const kpiRows: KpiRow[] = Array.isArray(kpiQ.data) ? (kpiQ.data as any) : [];
  const userRows: UserPerformanceRow[] = Array.isArray(usersQ.data) ? (usersQ.data as any) : [];
  const locRows: LocationRow[] = Array.isArray(locQ.data) ? (locQ.data as any) : [];
  const compareKpiRows: KpiRow[] = Array.isArray(compareKpiQ.data) ? (compareKpiQ.data as any) : [];
  const compareUserRows: UserPerformanceRow[] = Array.isArray(compareUsersQ.data)
    ? (compareUsersQ.data as any)
    : [];
  const compareLocRows: LocationRow[] = Array.isArray(compareLocQ.data) ? (compareLocQ.data as any) : [];

  // convenience splits for KPI
  const kpiDay = kpiRows.filter((x) => x.period === 'day');
  const kpiWeek = kpiRows.filter((x) => x.period === 'week');
  const kpiMonth = kpiRows.filter((x) => x.period === 'month');
  const compareKpiDay = compareKpiRows.filter((x) => x.period === 'day');
  const resourceChartRows = React.useMemo(
    () =>
      [...userRows]
        .sort((a, b) => Number(b.bookings_total) - Number(a.bookings_total))
        .slice(0, 8)
        .map((row) => ({
          name: safeText(row.resource_title, '—'),
          bookings_total: row.bookings_total,
          completed_total: row.completed_total,
        })),
    [userRows],
  );
  const localeChartRows = React.useMemo(
    () =>
      [...locRows]
        .sort((a, b) => Number(b.bookings_total) - Number(a.bookings_total))
        .map((row) => ({
          name: safeText(row.locale_label, row.locale),
          bookings_total: row.bookings_total,
          completed_total: row.completed_total,
        })),
    [locRows],
  );
  const exportRows = React.useMemo(() => {
    if (compareRange) {
      if (tab === 'kpi') {
        const previousByBucket = toRowMap(compareKpiRows, 'bucket');
        return kpiRows.map((r) => {
          const prev = previousByBucket.get(String(r.bucket));
          const previousBookings = Number(prev?.bookings_total ?? 0);
          const previousCompleted = Number(prev?.completed_total ?? 0);
          const previousCancelled = Number(prev?.cancelled_total ?? 0);
          return {
            period: r.period,
            bucket: r.bucket,
            current_bookings_total: r.bookings_total,
            previous_bookings_total: previousBookings,
            delta_bookings_total: Number(r.bookings_total) - previousBookings,
            current_completed_total: r.completed_total,
            previous_completed_total: previousCompleted,
            delta_completed_total: Number(r.completed_total) - previousCompleted,
            current_cancelled_total: r.cancelled_total,
            previous_cancelled_total: previousCancelled,
            delta_cancelled_total: Number(r.cancelled_total) - previousCancelled,
            current_success_rate_percent: fmtRate(r.success_rate),
            previous_success_rate_percent: fmtRate(prev?.success_rate ?? 0),
          };
        });
      }

      if (tab === 'users') {
        const previousByResource = toRowMap(compareUserRows, 'resource_id');
        return userRows.map((r) => {
          const prev = previousByResource.get(String(r.resource_id));
          const previousBookings = Number(prev?.bookings_total ?? 0);
          const previousCompleted = Number(prev?.completed_total ?? 0);
          const previousCancelled = Number(prev?.cancelled_orders ?? 0);
          return {
            resource_id: r.resource_id,
            resource_title: r.resource_title,
            current_bookings_total: r.bookings_total,
            previous_bookings_total: previousBookings,
            delta_bookings_total: Number(r.bookings_total) - previousBookings,
            current_completed_total: r.completed_total,
            previous_completed_total: previousCompleted,
            delta_completed_total: Number(r.completed_total) - previousCompleted,
            current_cancelled_total: r.cancelled_orders,
            previous_cancelled_total: previousCancelled,
            delta_cancelled_total: Number(r.cancelled_orders) - previousCancelled,
            current_success_rate_percent: fmtRate(r.success_rate),
            previous_success_rate_percent: fmtRate(prev?.success_rate ?? 0),
          };
        });
      }

      const previousByLocale = toRowMap(compareLocRows, 'locale');
      return locRows.map((r) => {
        const prev = previousByLocale.get(String(r.locale));
        const previousBookings = Number(prev?.bookings_total ?? 0);
        const previousCompleted = Number(prev?.completed_total ?? 0);
        const previousCancelled = Number(prev?.cancelled_orders ?? 0);
        return {
          locale: r.locale,
          locale_label: r.locale_label,
          current_bookings_total: r.bookings_total,
          previous_bookings_total: previousBookings,
          delta_bookings_total: Number(r.bookings_total) - previousBookings,
          current_completed_total: r.completed_total,
          previous_completed_total: previousCompleted,
          delta_completed_total: Number(r.completed_total) - previousCompleted,
          current_cancelled_total: r.cancelled_orders,
          previous_cancelled_total: previousCancelled,
          delta_cancelled_total: Number(r.cancelled_orders) - previousCancelled,
          current_success_rate_percent: fmtRate(r.success_rate),
          previous_success_rate_percent: fmtRate(prev?.success_rate ?? 0),
        };
      });
    }

    if (tab === 'kpi') {
      return kpiRows.map((r) => ({
        period: r.period,
        bucket: r.bucket,
        bookings_total: r.bookings_total,
        completed_total: r.completed_total,
        cancelled_total: r.cancelled_total,
        success_rate_percent: fmtRate(r.success_rate),
      }));
    }
    if (tab === 'users') {
      return userRows.map((r) => ({
        resource_id: r.resource_id,
        resource_title: r.resource_title,
        bookings_total: r.bookings_total,
        completed_total: r.completed_total,
        cancelled_total: r.cancelled_orders,
        success_rate_percent: fmtRate(r.success_rate),
      }));
    }
    return locRows.map((r) => ({
      locale: r.locale,
      locale_label: r.locale_label,
      bookings_total: r.bookings_total,
      completed_total: r.completed_total,
      cancelled_total: r.cancelled_orders,
      success_rate_percent: fmtRate(r.success_rate),
    }));
  }, [compareKpiRows, compareLocRows, compareRange, compareUserRows, kpiRows, locRows, tab, userRows]);
  const exportRowsByTab = React.useMemo(
    () => ({
      kpi: (() => {
        const prev = compareRange ? toRowMap(compareKpiRows, 'bucket') : new Map<string, KpiRow>();
        return kpiRows.map((r) => {
          const p = prev.get(String(r.bucket));
          if (!compareRange) {
            return {
              period: r.period,
              bucket: r.bucket,
              bookings_total: r.bookings_total,
              completed_total: r.completed_total,
              cancelled_total: r.cancelled_total,
              success_rate_percent: fmtRate(r.success_rate),
            };
          }
          return {
            period: r.period,
            bucket: r.bucket,
            current_bookings_total: r.bookings_total,
            previous_bookings_total: Number(p?.bookings_total ?? 0),
            delta_bookings_total: Number(r.bookings_total) - Number(p?.bookings_total ?? 0),
            current_completed_total: r.completed_total,
            previous_completed_total: Number(p?.completed_total ?? 0),
            delta_completed_total: Number(r.completed_total) - Number(p?.completed_total ?? 0),
            current_cancelled_total: r.cancelled_total,
            previous_cancelled_total: Number(p?.cancelled_total ?? 0),
            delta_cancelled_total: Number(r.cancelled_total) - Number(p?.cancelled_total ?? 0),
            current_success_rate_percent: fmtRate(r.success_rate),
            previous_success_rate_percent: fmtRate(p?.success_rate ?? 0),
          };
        });
      })(),
      users: (() => {
        const prev = compareRange
          ? toRowMap(compareUserRows, 'resource_id')
          : new Map<string, UserPerformanceRow>();
        return userRows.map((r) => {
          const p = prev.get(String(r.resource_id));
          if (!compareRange) {
            return {
              resource_id: r.resource_id,
              resource_title: r.resource_title,
              bookings_total: r.bookings_total,
              completed_total: r.completed_total,
              cancelled_total: r.cancelled_orders,
              success_rate_percent: fmtRate(r.success_rate),
            };
          }
          return {
            resource_id: r.resource_id,
            resource_title: r.resource_title,
            current_bookings_total: r.bookings_total,
            previous_bookings_total: Number(p?.bookings_total ?? 0),
            delta_bookings_total: Number(r.bookings_total) - Number(p?.bookings_total ?? 0),
            current_completed_total: r.completed_total,
            previous_completed_total: Number(p?.completed_total ?? 0),
            delta_completed_total: Number(r.completed_total) - Number(p?.completed_total ?? 0),
            current_cancelled_total: r.cancelled_orders,
            previous_cancelled_total: Number(p?.cancelled_orders ?? 0),
            delta_cancelled_total: Number(r.cancelled_orders) - Number(p?.cancelled_orders ?? 0),
            current_success_rate_percent: fmtRate(r.success_rate),
            previous_success_rate_percent: fmtRate(p?.success_rate ?? 0),
          };
        });
      })(),
      locations: (() => {
        const prev = compareRange ? toRowMap(compareLocRows, 'locale') : new Map<string, LocationRow>();
        return locRows.map((r) => {
          const p = prev.get(String(r.locale));
          if (!compareRange) {
            return {
              locale: r.locale,
              locale_label: r.locale_label,
              bookings_total: r.bookings_total,
              completed_total: r.completed_total,
              cancelled_total: r.cancelled_orders,
              success_rate_percent: fmtRate(r.success_rate),
            };
          }
          return {
            locale: r.locale,
            locale_label: r.locale_label,
            current_bookings_total: r.bookings_total,
            previous_bookings_total: Number(p?.bookings_total ?? 0),
            delta_bookings_total: Number(r.bookings_total) - Number(p?.bookings_total ?? 0),
            current_completed_total: r.completed_total,
            previous_completed_total: Number(p?.completed_total ?? 0),
            delta_completed_total: Number(r.completed_total) - Number(p?.completed_total ?? 0),
            current_cancelled_total: r.cancelled_orders,
            previous_cancelled_total: Number(p?.cancelled_orders ?? 0),
            delta_cancelled_total: Number(r.cancelled_orders) - Number(p?.cancelled_orders ?? 0),
            current_success_rate_percent: fmtRate(r.success_rate),
            previous_success_rate_percent: fmtRate(p?.success_rate ?? 0),
          };
        });
      })(),
    }),
    [compareKpiRows, compareLocRows, compareRange, compareUserRows, kpiRows, locRows, userRows],
  );
  const exportFilename = React.useMemo(() => {
    const suffix = from && to ? `_${from}_${to}` : '';
    if (tab === 'kpi') return `reports_kpi${suffix}.csv`;
    if (tab === 'users') return `reports_resources${suffix}.csv`;
    return `reports_locales${suffix}.csv`;
  }, [from, tab, to]);
  const compareChartRows = React.useMemo(() => {
    const previousByIndex = compareKpiDay;
    return kpiDay.map((row, index) => ({
      bucket: row.bucket,
      bookings_total: row.bookings_total,
      completed_total: row.completed_total,
      previous_bookings_total: previousByIndex[index]?.bookings_total ?? 0,
      previous_completed_total: previousByIndex[index]?.completed_total ?? 0,
    }));
  }, [compareKpiDay, kpiDay]);
  const currentTotals = React.useMemo(() => summarizeTotals(tab, kpiRows, userRows, locRows), [kpiRows, locRows, tab, userRows]);
  const previousTotals = React.useMemo(
    () => summarizeTotals(tab, compareKpiRows, compareUserRows, compareLocRows),
    [compareKpiRows, compareLocRows, compareUserRows, tab],
  );
  const chartFilenameBase = React.useMemo(() => {
    const suffix = from && to ? `_${from}_${to}` : '';
    if (tab === 'kpi') return `reports_chart_kpi${suffix}`;
    if (tab === 'users') return `reports_chart_resources${suffix}`;
    return `reports_chart_locales${suffix}`;
  }, [from, tab, to]);
  const fullReportFilename = React.useMemo(() => {
    const suffix = from && to ? `_${from}_${to}` : '';
    return `reports_full${suffix}.pdf`;
  }, [from, to]);
  const zipFilename = React.useMemo(() => {
    const suffix = from && to ? `_${from}_${to}` : '';
    return `reports_bundle${suffix}.zip`;
  }, [from, to]);
  const activeChartRef =
    tab === 'kpi' ? kpiChartRef : tab === 'users' ? usersChartRef : localesChartRef;

  async function exportActiveChart(kind: 'png' | 'pdf') {
    const el = activeChartRef.current;
    if (!el) {
      toast.error(t('reports.chart.exportError', {}, 'Grafik bulunamadı.'));
      return;
    }
    try {
      const canvas = await chartElementToCanvas(el);
      if (kind === 'png') {
        await downloadCanvasAsPng(`${chartFilenameBase}.png`, canvas);
      } else {
        await downloadChartAsPdf(`${chartFilenameBase}.pdf`, canvas);
      }
    } catch (error) {
      toast.error(getErrMessage(error, t));
    }
  }

  async function exportAllChartsPdf() {
    const refs = [kpiChartRef.current, usersChartRef.current, localesChartRef.current].filter(
      (value): value is HTMLDivElement => !!value,
    );
    if (!refs.length) {
      toast.error(t('reports.chart.exportError', {}, 'Grafik bulunamadı.'));
      return;
    }

    try {
      const canvases = [];
      for (const ref of refs) {
        canvases.push(await chartElementToCanvas(ref));
      }
      await downloadChartsAsPdf(fullReportFilename, canvases);
    } catch (error) {
      toast.error(getErrMessage(error, t));
    }
  }

  async function exportRawZip() {
    const refs = [
      { name: 'kpi', el: kpiChartRef.current },
      { name: 'resources', el: usersChartRef.current },
      { name: 'locales', el: localesChartRef.current },
    ].filter((item): item is { name: string; el: HTMLDivElement } => !!item.el);

    if (!refs.length) {
      toast.error(t('reports.chart.exportError', {}, 'Grafik bulunamadı.'));
      return;
    }

    try {
      const encoder = new TextEncoder();
      const files: Array<{ name: string; bytes: Uint8Array }> = [
        { name: 'csv/reports_kpi.csv', bytes: encoder.encode(csvString(exportRowsByTab.kpi)) },
        { name: 'csv/reports_resources.csv', bytes: encoder.encode(csvString(exportRowsByTab.users)) },
        { name: 'csv/reports_locales.csv', bytes: encoder.encode(csvString(exportRowsByTab.locations)) },
      ];

      for (const ref of refs) {
        const canvas = await chartElementToCanvas(ref.el);
        files.push({
          name: `charts/${ref.name}.png`,
          bytes: canvasToPngBytes(canvas),
        });
      }

      const zipBytes = buildZip(files);
      const blob = new Blob([toArrayBuffer(zipBytes)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrMessage(error, t));
    }
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t('reports.title', {}, 'Raporlar (Admin)')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('reports.description', {}, 'KPI, kaynak performansı ve dil kırılımı.')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void exportRawZip()}
            disabled={busy}
            title={t('reports.chart.exportZip', {}, 'CSV ve chart paketini ZIP indir')}
          >
            {t('reports.chart.exportZip', {}, 'ZIP Bundle')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void exportAllChartsPdf()}
            disabled={busy}
            title={t('reports.chart.exportAllPdf', {}, 'Tüm chartları PDF indir')}
          >
            {t('reports.chart.exportAllPdf', {}, 'Full Report PDF')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void exportActiveChart('png')}
            disabled={busy}
            title={t('reports.chart.exportPng', {}, 'Grafiği PNG indir')}
          >
            {t('reports.chart.exportPng', {}, 'PNG')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void exportActiveChart('pdf')}
            disabled={busy}
            title={t('reports.chart.exportPdf', {}, 'Grafiği PDF indir')}
          >
            {t('reports.chart.exportPdf', {}, 'PDF')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadCsv(exportFilename, exportRows)}
            disabled={busy || exportRows.length === 0}
            title={t('reports.export', {}, 'CSV dışa aktar')}
          >
            <Download className="mr-2 size-4" />
            {t('reports.export', {}, 'CSV dışa aktar')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (tab === 'kpi') kpiQ.refetch();
              if (tab === 'users') usersQ.refetch();
              if (tab === 'locations') locQ.refetch();
            }}
            disabled={busy}
            title={t('reports.refresh', {}, 'Yenile')}
          >
            {busy ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 size-4" />
            )}
            {t('reports.refresh', {}, 'Yenile')}
          </Button>
        </div>
      </div>

      {/* tabs */}
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('reports.tabs.title', {}, 'Sekmeler')}</CardTitle>
          <CardDescription>
            {t('reports.tabs.description', {}, 'KPI • Kaynak Performansı • Dil Kırılımı')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => apply({ tab: v as TabKey })}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="kpi" className="gap-2">
                <BarChart3 className="size-4" />
                {t('reports.tabs.kpi', {}, 'KPI')}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="size-4" />
                {t('reports.tabs.users', {}, 'Kaynaklar')}
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-2">
                <MapPin className="size-4" />
                {t('reports.tabs.locations', {}, 'Diller')}
              </TabsTrigger>
            </TabsList>

            {/* filters (shared) */}
            <div className="mt-4">
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('reports.filter.title', {}, 'Filtre')}</CardTitle>
                  <CardDescription>
                    {t('reports.filter.description', {}, 'Tarih aralığına göre KPI, kaynak ve dil dağılımı analizi.')}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {RANGE_PRESETS.map((days) => (
                      <Button
                        key={days}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => applyPreset(days)}
                        disabled={busy}
                      >
                        {t(`reports.filter.preset.${days}` as any, {}, `${days}g`)}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSubmitFilters} className="grid gap-3 lg:grid-cols-12">
                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="from">{t('reports.filter.from', {}, 'Başlangıç')}</Label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="from"
                          value={fromText}
                          onChange={(e) => setFromText(e.target.value)}
                          className="pl-9"
                          placeholder="YYYY-MM-DD"
                          disabled={busy}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="to">{t('reports.filter.to', {}, 'Bitiş')}</Label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="to"
                          value={toText}
                          onChange={(e) => setToText(e.target.value)}
                          className="pl-9"
                          placeholder="YYYY-MM-DD"
                          disabled={busy}
                        />
                      </div>
                    </div>


                    <div className="space-y-2 lg:col-span-2">
                      <Label>{t('reports.filter.service', {}, 'Hizmet')}</Label>
                      <Select value={serviceIdText || 'all'} onValueChange={(value) => setServiceIdText(value === 'all' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('reports.filter.servicePlaceholder', {}, 'Tüm hizmetler')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('reports.filter.serviceAll', {}, 'Tüm hizmetler')}</SelectItem>
                          {serviceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <Label>{t('reports.filter.resource', {}, 'Kaynak')}</Label>
                      <Select value={resourceIdText || 'all'} onValueChange={(value) => setResourceIdText(value === 'all' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('reports.filter.resourcePlaceholder', {}, 'Tüm kaynaklar')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('reports.filter.resourceAll', {}, 'Tüm kaynaklar')}</SelectItem>
                          {resourceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <Label>{t('reports.filter.status', {}, 'Durum')}</Label>
                      <Select value={statusText || 'all'} onValueChange={(value) => setStatusText(value === 'all' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('reports.filter.statusPlaceholder', {}, 'Tüm durumlar')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('reports.filter.statusAll', {}, 'Tüm durumlar')}</SelectItem>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <Label>{t('reports.filter.locale', {}, 'Dil')}</Label>
                      <Select value={localeText || 'all'} onValueChange={(value) => setLocaleText(value === 'all' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('reports.filter.localePlaceholder', {}, 'Tüm diller')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('reports.filter.localeAll', {}, 'Tüm diller')}</SelectItem>
                          {localeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <Label>{t('reports.filter.compare', {}, 'Karşılaştırma')}</Label>
                      <Select value={compareText} onValueChange={(value) => setCompareText(value as 'off' | 'previous')}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('reports.filter.comparePlaceholder', {}, 'Kapalı')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">{t('reports.filter.compareOff', {}, 'Kapalı')}</SelectItem>
                          <SelectItem value="previous">{t('reports.filter.comparePrevious', {}, 'Önceki dönem')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 lg:col-span-12 lg:items-end">
                      <Button type="submit" disabled={busy} className="w-full">
                        {t('reports.filter.apply', {}, 'Uygula')}
                      </Button>
                      <Button type="button" variant="outline" onClick={onReset} disabled={busy}>
                        {t('reports.filter.reset', {}, 'Sıfırla')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-5" />

            {/* KPI */}
            <TabsContent value="kpi" className="space-y-4">
              {kpiQ.isError ? (
                <div className="rounded-md border p-4 text-sm">
                  {t('reports.kpi.loadingError', {}, 'KPI yüklenemedi.')}{' '}
                  <Button variant="link" className="px-1" onClick={() => kpiQ.refetch()}>
                    {t('reports.retry', {}, 'Yeniden dene')}
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getErrMessage(kpiQ.error, t)}
                  </div>
                </div>
              ) : (
                <>
                  {compareRange ? (
                    <ComparisonSummary
                      title={t('reports.compare.title', {}, 'Dönem Karşılaştırması')}
                      currentLabel={`${from} → ${to}`}
                      previousLabel={`${compareRange.from} → ${compareRange.to}`}
                      currentTotals={currentTotals}
                      previousTotals={previousTotals}
                    />
                  ) : null}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('reports.kpi.chart.title', {}, 'Zaman Serisi')}</CardTitle>
                      <CardDescription>
                        {t('reports.kpi.chart.description', {}, 'Günlük rezervasyon ve tamamlanma trendi.')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2" ref={kpiChartRef}>
                      {kpiDay.length ? (
                        <ChartContainer config={KPI_CHART_CONFIG} className="aspect-auto h-72 w-full">
                          <AreaChart data={compareRange ? compareChartRows : kpiDay}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="bucket" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={labelForBucket} />
                            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  labelFormatter={(label) => labelForBucket(String(label))}
                                  formatter={(value) => `${Number(value ?? 0)}`}
                                />
                              }
                            />
                            <Area dataKey="bookings_total" type="monotone" stroke="var(--color-bookings_total)" fill="var(--color-bookings_total)" fillOpacity={0.18} />
                            <Area dataKey="completed_total" type="monotone" stroke="var(--color-completed_total)" fill="var(--color-completed_total)" fillOpacity={0.12} />
                            {compareRange ? (
                              <Area dataKey="previous_bookings_total" type="monotone" stroke="var(--muted-foreground)" fill="transparent" fillOpacity={0} />
                            ) : null}
                          </AreaChart>
                        </ChartContainer>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {t('reports.kpi.noData', {}, 'Kayıt yok.')}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <KpiTable
                      title={t('reports.kpi.daily', {}, 'Günlük')}
                      rows={kpiDay}
                      t={t}
                    />
                    <KpiTable
                      title={t('reports.kpi.weekly', {}, 'Haftalık')}
                      rows={kpiWeek}
                      t={t}
                    />
                    <KpiTable
                      title={t('reports.kpi.monthly', {}, 'Aylık')}
                      rows={kpiMonth}
                      t={t}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Users */}
            <TabsContent value="users" className="space-y-4">
              {usersQ.isError ? (
                <div className="rounded-md border p-4 text-sm">
                  {t('reports.users.loadingError', {}, 'Performans raporu yüklenemedi.')}{' '}
                  <Button variant="link" className="px-1" onClick={() => usersQ.refetch()}>
                    {t('reports.retry', {}, 'Yeniden dene')}
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getErrMessage(usersQ.error, t)}
                  </div>
                </div>
              ) : (
                <>
                  {compareRange ? (
                    <ComparisonSummary
                      title={t('reports.compare.title', {}, 'Dönem Karşılaştırması')}
                      currentLabel={`${from} → ${to}`}
                      previousLabel={`${compareRange.from} → ${compareRange.to}`}
                      currentTotals={currentTotals}
                      previousTotals={previousTotals}
                    />
                  ) : null}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('reports.users.chart.title', {}, 'Kaynak Dağılımı')}</CardTitle>
                      <CardDescription>
                        {t('reports.users.chart.description', {}, 'En çok randevu alan kaynaklar.')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2" ref={usersChartRef}>
                      {resourceChartRows.length ? (
                        <ChartContainer config={RESOURCE_CHART_CONFIG} className="aspect-auto h-72 w-full">
                          <BarChart data={resourceChartRows}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={resourceChartRows.length > 4 ? -12 : 0} textAnchor={resourceChartRows.length > 4 ? 'end' : 'middle'} height={48} />
                            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent labelFormatter={(label) => String(label)} formatter={(value) => `${Number(value ?? 0)}`} />}
                            />
                            <Bar dataKey="bookings_total" fill="var(--color-bookings_total)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                      ) : (
                        <div className="text-sm text-muted-foreground">Kayıt bulunamadı.</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {t('reports.users.title', {}, 'Kaynak Performansı')}
                      </CardTitle>
                      <CardDescription>
                        {t('reports.users.description', { count: usersQ.isFetching ? '—' : userRows.length }, `kayıt: ${usersQ.isFetching ? '—' : userRows.length}`)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('reports.users.table.user', {}, 'Kaynak')}</TableHead>
                              <TableHead className="text-right">{t('reports.users.table.total', {}, 'Rezervasyon')}</TableHead>
                              <TableHead className="text-right">{t('reports.users.table.completed', {}, 'Tamamlanan')}</TableHead>
                              <TableHead className="text-right">{t('reports.users.table.cancelled', {}, 'İptal')}</TableHead>
                              <TableHead className="text-right">{t('reports.users.table.success', {}, 'Başarı')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userRows.map((r) => (
                              <TableRow key={r.resource_id}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="truncate">{safeText(r.resource_title, '—')}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {r.resource_id ? `#${r.resource_id.slice(0, 8)}` : '—'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{fmtNum(r.bookings_total)}</TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(r.completed_total)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(r.cancelled_orders)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtRate(r.success_rate)}
                                </TableCell>
                              </TableRow>
                            ))}

                            {!usersQ.isFetching && userRows.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="py-10 text-center text-muted-foreground"
                                >
                                  Kayıt bulunamadı.
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Locations */}
            <TabsContent value="locations" className="space-y-4">
              {locQ.isError ? (
                <div className="rounded-md border p-4 text-sm">
                  {t('reports.locations.loadingError', {}, 'Lokasyon raporu yüklenemedi.')}{' '}
                  <Button variant="link" className="px-1" onClick={() => locQ.refetch()}>
                    {t('reports.retry', {}, 'Yeniden dene')}
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getErrMessage(locQ.error, t)}
                  </div>
                </div>
              ) : (
                <>
                  {compareRange ? (
                    <ComparisonSummary
                      title={t('reports.compare.title', {}, 'Dönem Karşılaştırması')}
                      currentLabel={`${from} → ${to}`}
                      previousLabel={`${compareRange.from} → ${compareRange.to}`}
                      currentTotals={currentTotals}
                      previousTotals={previousTotals}
                    />
                  ) : null}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('reports.locations.chart.title', {}, 'Locale Dağılımı')}</CardTitle>
                      <CardDescription>
                        {t('reports.locations.chart.description', {}, 'Randevuların dile göre dağılımı.')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2" ref={localesChartRef}>
                      {localeChartRows.length ? (
                        <ChartContainer config={LOCALE_CHART_CONFIG} className="aspect-auto h-72 w-full">
                          <BarChart data={localeChartRows}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent labelFormatter={(label) => String(label)} formatter={(value) => `${Number(value ?? 0)}`} />}
                            />
                            <Bar dataKey="bookings_total" fill="var(--color-bookings_total)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                      ) : (
                        <div className="text-sm text-muted-foreground">Kayıt bulunamadı.</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {t('reports.locations.title', {}, 'Dil Kırılımı')}
                      </CardTitle>
                      <CardDescription>
                        {t('reports.locations.description', { count: locQ.isFetching ? '—' : locRows.length }, `kayıt: ${locQ.isFetching ? '—' : locRows.length}`)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('reports.locations.table.city', {}, 'Dil')}</TableHead>
                              <TableHead>{t('reports.locations.table.district', {}, 'Kod')}</TableHead>
                              <TableHead className="text-right">{t('reports.locations.table.total', {}, 'Rezervasyon')}</TableHead>
                              <TableHead className="text-right">{t('reports.locations.table.completed', {}, 'Tamamlanan')}</TableHead>
                              <TableHead className="text-right">{t('reports.locations.table.cancelled', {}, 'İptal')}</TableHead>
                              <TableHead className="text-right">{t('reports.locations.table.success', {}, 'Başarı')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {locRows.map((r, i) => (
                              <TableRow key={`${r.locale}-${i}`}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="truncate">{r.locale_label ?? '—'}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {safeText(r.locale, '—')}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {safeText(r.locale, '—')}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">{fmtNum(r.bookings_total)}</TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(r.completed_total)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(r.cancelled_orders)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtRate(r.success_rate)}
                                </TableCell>
                              </TableRow>
                            ))}

                            {!locQ.isFetching && locRows.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="py-10 text-center text-muted-foreground"
                                >
                                  Kayıt bulunamadı.
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------- KPI table ----------------------------- */

function ComparisonSummary(props: {
  title: string;
  currentLabel: string;
  previousLabel: string;
  currentTotals: { bookings_total: number; completed_total: number; cancelled_total: number };
  previousTotals: { bookings_total: number; completed_total: number; cancelled_total: number };
}) {
  const { title, currentLabel, previousLabel, currentTotals, previousTotals } = props;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{currentLabel} vs {previousLabel}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Rezervasyon</div>
          <div className="text-lg font-semibold">{fmtNum(currentTotals.bookings_total)}</div>
          <div className="text-xs text-muted-foreground">
            Önceki: {fmtNum(previousTotals.bookings_total)} · Fark: {deltaText(currentTotals.bookings_total, previousTotals.bookings_total)}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Tamamlanan</div>
          <div className="text-lg font-semibold">{fmtNum(currentTotals.completed_total)}</div>
          <div className="text-xs text-muted-foreground">
            Önceki: {fmtNum(previousTotals.completed_total)} · Fark: {deltaText(currentTotals.completed_total, previousTotals.completed_total)}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">İptal</div>
          <div className="text-lg font-semibold">{fmtNum(currentTotals.cancelled_total)}</div>
          <div className="text-xs text-muted-foreground">
            Önceki: {fmtNum(previousTotals.cancelled_total)} · Fark: {deltaText(currentTotals.cancelled_total, previousTotals.cancelled_total)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiTable(props: {
  title: string;
  rows: KpiRow[];
  t: (k: string, p?: any, fb?: string) => string;
}) {
  const { title, rows, t } = props;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>
          {t('reports.kpi.count', { count: rows.length }, `Kayıt: ${rows.length}`)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.kpi.bucket', {}, 'Dönem')}</TableHead>
                <TableHead className="text-right">{t('reports.kpi.total', {}, 'Toplam')}</TableHead>
                <TableHead className="text-right">{t('reports.kpi.completed', {}, 'Tamamlanan')}</TableHead>
                <TableHead className="text-right">{t('reports.kpi.success', {}, 'Başarı')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.period}-${r.bucket}`}>
                  <TableCell className="font-medium">{r.bucket}</TableCell>
                  <TableCell className="text-right">{fmtNum(r.bookings_total)}</TableCell>
                  <TableCell className="text-right">{fmtNum(r.completed_total)}</TableCell>
                  <TableCell className="text-right">{fmtRate(r.success_rate)}</TableCell>
                </TableRow>
              ))}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {t('reports.kpi.noData', {}, 'Kayıt yok.')}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
