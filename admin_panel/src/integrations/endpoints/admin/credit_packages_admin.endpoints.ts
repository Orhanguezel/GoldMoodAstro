import { baseApi } from '@/integrations/baseApi';
import type { CreditPackageAdmin, CreditPackageAdminInput } from '@/integrations/shared';

type WrappedPackage = { data?: CreditPackageAdmin };
type WrappedList = { data?: CreditPackageAdmin[] };

function unwrapPackage(input: unknown): CreditPackageAdmin {
  const wrapped = input as WrappedPackage;
  return (wrapped?.data ?? input) as CreditPackageAdmin;
}

export const creditPackagesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCreditPackagesAdmin: build.query<CreditPackageAdmin[], void>({
      query: () => ({ url: '/admin/credit-packages', method: 'GET' }),
      transformResponse: (res: unknown) => ((res as WrappedList)?.data ?? []) as CreditPackageAdmin[],
      providesTags: [{ type: 'CreditPackages', id: 'LIST' }],
    }),
    createCreditPackageAdmin: build.mutation<CreditPackageAdmin, CreditPackageAdminInput>({
      query: (body) => ({ url: '/admin/credit-packages', method: 'POST', body }),
      transformResponse: unwrapPackage,
      invalidatesTags: [{ type: 'CreditPackages', id: 'LIST' }],
    }),
    updateCreditPackageAdmin: build.mutation<CreditPackageAdmin, { id: string; patch: Partial<CreditPackageAdminInput> }>({
      query: ({ id, patch }) => ({
        url: `/admin/credit-packages/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: unwrapPackage,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'CreditPackages', id: 'LIST' },
        { type: 'CreditPackages', id: arg.id },
      ],
    }),
    deleteCreditPackageAdmin: build.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({ url: `/admin/credit-packages/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'CreditPackages', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCreditPackagesAdminQuery,
  useCreateCreditPackageAdminMutation,
  useUpdateCreditPackageAdminMutation,
  useDeleteCreditPackageAdminMutation,
} = creditPackagesAdminApi;
