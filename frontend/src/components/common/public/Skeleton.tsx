// =============================================================
// FILE: src/components/common/public/Skeleton.tsx
// goldmoodastro – Blog Detail Skeleton (NO inline styles)
// Used by pages/blog/[slug].tsx while slug/data loads
// =============================================================

'use client';

import React from 'react';

export default function Skeleton() {
  return (
    <div className="news__area grey-bg-3 pt-120 pb-90">
      <div className="container">
        <div className="row">
          <div className="col-12">
            {/* Rely on the default height from the existing skeleton-line SCSS class. */}
            <div className="skeleton-line" />
            <div className="skeleton-line mt-10" />
            <div className="skeleton-line mt-10" />
            <div className="skeleton-line mt-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
