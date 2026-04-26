import * as Mod from '@/app/(main)/admin/(admin)/bookings/bookings-header';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.BookingsHeader;
export const BookingsHeader = AnyMod.BookingsHeader ?? C;
export default C;
export * from '@/app/(main)/admin/(admin)/bookings/bookings-header';
