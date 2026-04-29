import { baseApi } from '../baseApi';

export const coffeePublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    readCoffee: build.mutation<any, { image_ids: string[]; locale?: string }>({
      query: (body) => ({
        url: '/coffee/read',
        method: 'POST',
        body,
      }),
    }),
    getCoffeeReading: build.query<any, string>({
      query: (id) => `/coffee/reading/${id}`,
    }),
  }),
  overrideExisting: false,
});

export const { useReadCoffeeMutation, useGetCoffeeReadingQuery } = coffeePublicApi;
