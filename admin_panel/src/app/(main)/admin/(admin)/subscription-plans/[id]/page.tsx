import SubscriptionPlanFormClient from '../_components/subscription-plan-form-client';

export const metadata = {
  title: 'Edit Subscription Plan | GoldMoodAstro Admin',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubscriptionPlanFormClient mode="edit" id={id} />;
}
