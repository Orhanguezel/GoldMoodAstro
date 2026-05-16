import React from 'react';
import Logout from '@/components/containers/auth/Logout';

import PageContainer from '@/components/common/PageContainer';

export default function LogoutPage() {
  return (
    <PageContainer width="narrow" center className="min-h-screen bg-(--gm-bg)" withHeaderOffset>
      <Logout />
    </PageContainer>
  );
}

