// =============================================================
// FILE: src/integrations/rtk/public/review_outcomes.endpoints.ts
// FAZ 17 / T17-6 — Astrolog karnesi (review outcomes) public endpoints
// =============================================================
import { baseApi } from '@/integrations/rtk/baseApi';

export type ReviewOutcomeResponse =
  | 'happened'
  | 'partially'
  | 'did_not_happen'
  | 'no_answer';

export interface PendingOutcomeDto {
  id: string;
  review_id: string;
  consultant_id: string;
  follow_up_at: string;
  review_rating: number | null;
  review_created_at: string | null;
  consultant_slug: string | null;
  consultant_avatar: string | null;
  consultant_name: string | null;
}

export interface ConsultantOutcomeScoreDto {
  consultant_id: string;
  total_followups: number;
  happened: number;
  partially: number;
  did_not_happen: number;
  no_answer: number;
  total_answered: number;
  score: number | null;
}

export const reviewOutcomesEndpoints = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /reviews/me/pending-outcomes (auth)
    listMyPendingOutcomes: build.query<PendingOutcomeDto[], void>({
      query: () => ({ url: '/reviews/me/pending-outcomes', method: 'GET' }),
      transformResponse: (raw: { data?: PendingOutcomeDto[] } | PendingOutcomeDto[]) =>
        Array.isArray(raw) ? raw : raw?.data ?? [],
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((o) => ({ type: 'ReviewOutcome' as const, id: o.id })),
              { type: 'ReviewOutcome' as const, id: 'PENDING' },
            ]
          : [{ type: 'ReviewOutcome' as const, id: 'PENDING' }],
    }),

    // PATCH /reviews/:id/outcome (auth)
    submitReviewOutcome: build.mutation<
      { data: { id: string; user_response: ReviewOutcomeResponse } },
      { reviewId: string; user_response: ReviewOutcomeResponse; notes?: string }
    >({
      query: ({ reviewId, user_response, notes }) => ({
        url: `/reviews/${encodeURIComponent(reviewId)}/outcome`,
        method: 'PATCH',
        body: { user_response, notes },
      }),
      invalidatesTags: [{ type: 'ReviewOutcome', id: 'PENDING' }],
    }),

    // GET /consultants/:id/outcomes/score (public)
    getConsultantOutcomeScore: build.query<ConsultantOutcomeScoreDto, string>({
      query: (consultantId) => ({
        url: `/consultants/${encodeURIComponent(consultantId)}/outcomes/score`,
        method: 'GET',
      }),
      transformResponse: (raw: { data?: ConsultantOutcomeScoreDto } | ConsultantOutcomeScoreDto) =>
        (raw && 'data' in (raw as any) ? (raw as any).data : raw) as ConsultantOutcomeScoreDto,
      providesTags: (_r, _e, id) => [{ type: 'ConsultantOutcomeScore', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListMyPendingOutcomesQuery,
  useSubmitReviewOutcomeMutation,
  useGetConsultantOutcomeScoreQuery,
} = reviewOutcomesEndpoints;
