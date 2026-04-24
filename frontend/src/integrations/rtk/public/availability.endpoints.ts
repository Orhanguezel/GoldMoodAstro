// =============================================================
// FILE: src/integrations/rtk/endpoints/availability.endpoints.ts
// FINAL — Public Availability endpoints
//  - /availability/slots
//  - /availability (final check)
//  - /availability/working-hours
//  - /availability/weekly-plan
//  + listAvailabilitySlotsByResourcesPublic (fan-out, no manual fetch)
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  AvailabilityGetQuery,
  AvailabilitySlotsQuery,
  AvailabilitySlotsByResourcesQuery,
  AvailabilitySlotsByResourcesResult,
  ResourceSlotDto,
  SlotAvailabilityDto,
  WeeklyPlanDayDto,
  WeeklyPlanQuery,
  PublicWorkingHoursQuery,
  ResourceWorkingHourDto,
  UUID36,
  Ymd,
  BaseQueryOk,
} from '@/integrations/shared';
import {
  isUuid36,
  isYmd,
  asSlotArray,
  EMPTY_SLOTS,
  parseBaseQueryResult,
} from '@/integrations/shared';

const BASE = '/availability';

export const availabilityPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** PUBLIC — GET /availability/slots?resource_id=...&date=YYYY-MM-DD */
    listAvailabilitySlotsPublic: build.query<ResourceSlotDto[], AvailabilitySlotsQuery>({
      query: (params) => ({
        url: `${BASE}/slots`,
        method: 'GET',
        params,
      }),
      providesTags: (result, _error, arg) => {
        const key = `PUBSLOTS:${arg.resource_id}:${arg.date}`;
        if (!result || !Array.isArray(result)) {
          return [{ type: 'AvailabilitySlots' as const, id: key }];
        }
        return [
          ...result.map((s, idx) => ({
            type: 'AvailabilitySlots' as const,
            id: String((s as any)?.id ?? `${key}:ROW:${idx}`),
          })),
          { type: 'AvailabilitySlots' as const, id: key },
        ];
      },
    }),

    /**
     * PUBLIC — Fan-out slots for multiple resources (no manual fetch in UI)
     * Returns: { [resource_id]: ResourceSlotDto[] }
     */
    listAvailabilitySlotsByResourcesPublic: build.query<
      AvailabilitySlotsByResourcesResult,
      AvailabilitySlotsByResourcesQuery
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const ids: UUID36[] = Array.isArray(arg?.resource_ids)
          ? arg.resource_ids.filter(isUuid36)
          : [];

        const date: Ymd | null = isYmd(arg?.date) ? (arg.date as Ymd) : null;

        if (!ids.length || !date) {
          return { data: {} as AvailabilitySlotsByResourcesResult };
        }

        const pairs = await Promise.all(
          ids.map(async (rid): Promise<readonly [UUID36, ResourceSlotDto[]]> => {
            const raw = await baseQuery({
              url: `${BASE}/slots`,
              method: 'GET',
              params: { resource_id: rid, date },
            });

            const res = parseBaseQueryResult(raw);
            if (!res) return [rid, EMPTY_SLOTS] as const;

            if ('error' in res && res.error) {
              return [rid, EMPTY_SLOTS] as const;
            }

            return [rid, asSlotArray((res as BaseQueryOk).data)] as const;
          }),
        );

        const map: AvailabilitySlotsByResourcesResult = {} as AvailabilitySlotsByResourcesResult;
        for (const [rid, arr] of pairs) {
          map[rid] = arr;
        }

        return { data: map };
      },

      providesTags: (_res, _err, arg) => {
        const ids: UUID36[] = Array.isArray(arg?.resource_ids)
          ? arg.resource_ids.filter(isUuid36)
          : [];

        const dateStr = isYmd(arg?.date) ? String(arg.date) : '';
        const rootKey = `PUBSLOTS:MULTI:${dateStr}`;

        return [
          { type: 'AvailabilitySlots' as const, id: rootKey },
          ...ids.map((rid) => ({
            type: 'AvailabilitySlots' as const,
            id: `PUBSLOTS:${rid}:${dateStr}`,
          })),
        ];
      },
    }),

    /** PUBLIC — GET /availability/working-hours?resource_id=... */
    listResourceWorkingHoursPublic: build.query<ResourceWorkingHourDto[], PublicWorkingHoursQuery>({
      query: (params) => ({
        url: `${BASE}/working-hours`,
        method: 'GET',
        params,
      }),
      providesTags: (_res, _err, arg) => [
        { type: 'AvailabilityWH' as const, id: `PUBWH:${arg.resource_id}` },
      ],
    }),

    /** PUBLIC — GET /availability/weekly-plan?resource_id=...&type=therapist */
    getWeeklyPlanPublic: build.query<WeeklyPlanDayDto[], WeeklyPlanQuery>({
      query: (params) => ({
        url: `${BASE}/weekly-plan`,
        method: 'GET',
        params,
      }),
      providesTags: (_res, _err, arg) => [
        { type: 'WeeklyPlan' as const, id: `PUBWEEK:${arg.resource_id}:${arg.type ?? ''}` },
      ],
    }),

    /** PUBLIC — GET /availability?resource_id=...&date=...&time=HH:mm */
    getAvailabilityPublic: build.query<SlotAvailabilityDto, AvailabilityGetQuery>({
      query: (params) => ({
        url: `${BASE}`,
        method: 'GET',
        params,
      }),
      providesTags: (_result, _error, arg) => [
        {
          type: 'AvailabilityCheck' as const,
          id: `PUBCHK:${arg.resource_id}:${arg.date}:${arg.time}`,
        },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListAvailabilitySlotsPublicQuery,
  useListAvailabilitySlotsByResourcesPublicQuery,
  useGetAvailabilityPublicQuery,
  useListResourceWorkingHoursPublicQuery,
  useGetWeeklyPlanPublicQuery,
} = availabilityPublicApi;
