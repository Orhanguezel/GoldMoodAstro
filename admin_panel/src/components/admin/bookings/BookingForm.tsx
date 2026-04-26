import * as Mod from '@/app/(main)/admin/(admin)/bookings/booking-form';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.BookingForm;
export const BookingForm = AnyMod.BookingForm ?? C;
export default C;
export * from '@/app/(main)/admin/(admin)/bookings/booking-form';
