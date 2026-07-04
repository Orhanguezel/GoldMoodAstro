import { baseApi } from '@/integrations/baseApi';
import type {
  AccountDeletionRequestStatus,
  AccountDeletionRequestsResponse,
} from '@/integrations/shared';

export const accountDeletionAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAccountDeletionRequestsAdmin: build.query<
      AccountDeletionRequestsResponse,
      { status?: AccountDeletionRequestStatus; limit?: number; offset?: number } | void
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.status) sp.set('status', params.status);
        if (params?.limit) sp.set('limit', String(params.limit));
        if (params?.offset) sp.set('offset', String(params.offset));
        const qs = sp.toString();
        return {
          url: qs ? `/admin/account-deletion-requests?${qs}` : '/admin/account-deletion-requests',
          method: 'GET',
        };
      },
      providesTags: [{ type: 'AccountDeletionRequests', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const { useListAccountDeletionRequestsAdminQuery } = accountDeletionAdminApi;
