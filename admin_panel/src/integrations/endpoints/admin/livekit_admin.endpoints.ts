import { baseApi } from '@/integrations/baseApi';

export type LiveKitAdminStatus = {
  configured: boolean;
  livekit_url: string;
  api_key_masked: string;
  webhook_signing_key_configured: boolean;
  active_rooms: number | null;
  rooms_error: string | null;
};

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['LiveKit'] as const });

export const liveKitAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    getLiveKitAdminStatus: b.query<LiveKitAdminStatus, void>({
      query: () => ({ url: '/admin/livekit/status', method: 'GET' }),
      transformResponse: (res: unknown): LiveKitAdminStatus => {
        const data = (res as { data?: LiveKitAdminStatus })?.data;
        return (
          data ?? {
            configured: false,
            livekit_url: '',
            api_key_masked: '',
            webhook_signing_key_configured: false,
            active_rooms: null,
            rooms_error: 'empty_response',
          }
        );
      },
      providesTags: [{ type: 'LiveKit' as const, id: 'STATUS' }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetLiveKitAdminStatusQuery } = liveKitAdminApi;
