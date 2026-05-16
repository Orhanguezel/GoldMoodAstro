import React from 'react';
import Login from '@/components/containers/auth/Login';

import PageContainer from '@/components/common/PageContainer';

export default function LoginPage() {
  return (
    <PageContainer width="full" pad="none">
      <Login />
    </PageContainer>
  );
}

