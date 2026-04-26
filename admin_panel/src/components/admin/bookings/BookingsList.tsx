import * as Mod from '@/app/(main)/admin/(admin)/bookings/bookings-list';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.BookingsList;
export const BookingsList = AnyMod.BookingsList ?? C;
export default C;
export * from '@/app/(main)/admin/(admin)/bookings/bookings-list';
