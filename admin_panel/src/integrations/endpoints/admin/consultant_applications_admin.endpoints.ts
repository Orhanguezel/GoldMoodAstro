import { baseApi } from "@/integrations/baseApi";

export type ConsultantApplicationStatus = "pending" | "approved" | "rejected";

export type ConsultantApplicationAdmin = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  bio: string | null;
  expertise: string[] | null;
  languages: string[] | null;
  experience_years: number | null;
  certifications: string | null;
  cv_url: string | null;
  sample_chart_url: string | null;
  status: ConsultantApplicationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ListParams = {
  status?: ConsultantApplicationStatus;
  limit?: number;
  offset?: number;
};

function unwrapList(raw: unknown): ConsultantApplicationAdmin[] {
  if (Array.isArray(raw)) return raw as ConsultantApplicationAdmin[];
  const data = (raw as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as ConsultantApplicationAdmin[]) : [];
}

function unwrapOne(raw: unknown): ConsultantApplicationAdmin {
  return ((raw as { data?: unknown })?.data ?? raw) as ConsultantApplicationAdmin;
}

const BASE = "/admin/consultant-applications";

export const consultantApplicationsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listConsultantApplicationsAdmin: build.query<ConsultantApplicationAdmin[], ListParams | undefined>({
      query: (params) => ({ url: BASE, method: "GET", params: params ?? undefined }),
      transformResponse: unwrapList,
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((item) => ({ type: "ConsultantApplications" as const, id: item.id })),
              { type: "ConsultantApplications" as const, id: "LIST" },
            ]
          : [{ type: "ConsultantApplications" as const, id: "LIST" }],
    }),
    getConsultantApplicationAdmin: build.query<ConsultantApplicationAdmin, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: "GET" }),
      transformResponse: unwrapOne,
      providesTags: (_result, _error, id) => [{ type: "ConsultantApplication" as const, id }],
    }),
    approveConsultantApplicationAdmin: build.mutation<ConsultantApplicationAdmin, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}/approve`, method: "POST" }),
      transformResponse: unwrapOne,
      invalidatesTags: (_result, _error, id) => [
        { type: "ConsultantApplication" as const, id },
        { type: "ConsultantApplications" as const, id: "LIST" },
        { type: "Consultants" as const, id: "LIST" },
      ],
    }),
    rejectConsultantApplicationAdmin: build.mutation<
      ConsultantApplicationAdmin,
      { id: string; rejection_reason: string }
    >({
      query: ({ id, rejection_reason }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/reject`,
        method: "POST",
        body: { rejection_reason },
      }),
      transformResponse: unwrapOne,
      invalidatesTags: (_result, _error, arg) => [
        { type: "ConsultantApplication" as const, id: arg.id },
        { type: "ConsultantApplications" as const, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListConsultantApplicationsAdminQuery,
  useGetConsultantApplicationAdminQuery,
  useApproveConsultantApplicationAdminMutation,
  useRejectConsultantApplicationAdminMutation,
} = consultantApplicationsAdminApi;
