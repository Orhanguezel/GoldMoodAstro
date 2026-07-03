import SubscriptionPlanFormClient from '../_components/subscription-plan-form-client';

export const metadata = {
  title: 'New Subscription Plan | GoldMoodAstro Admin',
};

export default function Page() {
  return <SubscriptionPlanFormClient mode="create" />;
}
