'use client';

import ContentModuleClient from '@/app/(main)/admin/_components/common/ContentModuleClient';
import { useLocaleContext } from '@/i18n';

export default function AdminBlogClient() {
  const { t } = useLocaleContext();
  const b = (key: string, fallback: string) => t(`admin.blog.${key}`, undefined, fallback);

  return (
    <ContentModuleClient
      moduleKeys={['blog']}
      title={b('title', 'Blog Yönetimi')}
      description={b('description', 'Web ve mobil blog sayfası buradaki yayınlanmış yazıları okur. Danışman taslakları da burada onaylanıp yayına alınır.')}
      eyebrow={b('eyebrow', 'İçerik Yönetimi')}
      newLabel={b('newPost', 'Yeni Yazı')}
      emptyLabel={b('empty', 'Henüz blog yazısı yok.')}
      formNewTitle={b('form.newTitle', 'Yeni Blog Yazısı')}
      formEditTitle={b('form.editTitle', 'Yazıyı Düzenle')}
      storageFolder="blog"
    />
  );
}
