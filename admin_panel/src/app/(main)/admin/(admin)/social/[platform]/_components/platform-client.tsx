"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import SocialPlatformPage from "@/ekosistem/components/social/SocialPlatformPage";
import { getSocialPlatform } from "@/ekosistem/lib/social-platforms";

export default function SocialPlatformRoute() {
  const params = useParams();
  const router = useRouter();
  const platformKey = String(params?.platform || "");
  const config = getSocialPlatform(platformKey);

  // YouTube gibi external platformlar kendi sayfasina yonlendirilir
  useEffect(() => {
    if (config?.externalHref) {
      router.replace(config.externalHref);
    }
  }, [config, router]);

  if (config?.externalHref) return null;

  return <SocialPlatformPage platformKey={platformKey} />;
}
