import { Redirect } from 'expo-router';

/** Keep older deep links on the canonical wallet with native store pricing. */
export default function LegacyCreditsRoute() {
  return <Redirect href="/(tabs)/profile/credits" />;
}
