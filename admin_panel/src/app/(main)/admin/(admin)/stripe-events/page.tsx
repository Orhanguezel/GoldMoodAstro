import StripeEventsClient from './_components/stripe-events-client';

export const metadata = {
  title: 'Stripe Ödemeleri | GoldMoodAstro Admin',
};

export default function Page() {
  return <StripeEventsClient />;
}
