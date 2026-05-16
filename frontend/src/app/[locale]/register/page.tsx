import React from 'react';
import Register from '@/components/containers/auth/Register';

import PageContainer from '@/components/common/PageContainer';

export default function RegisterPage() {
  return (
    <PageContainer width="full" pad="none">
      <Register />
    </PageContainer>
  );
}

