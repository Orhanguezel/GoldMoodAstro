// =============================================================
// FILE: src/components/common/ClientOnly.tsx
// konigsmassage – Client-only render helper (prevents hydration mismatch)
// =============================================================

import React from 'react';

export function ClientOnly(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { children, fallback = null } = props;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
