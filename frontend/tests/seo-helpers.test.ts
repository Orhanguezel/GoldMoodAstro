/// <reference types="bun-types" />
// SEO katalog 2026-10-03 düzeltmelerinin saf yardımcıları.
import { describe, expect, test } from 'bun:test';
import { resolveUiRows } from '../src/i18n/uiStringsResolve';
import { localizeHtmlLinks } from '../src/i18n/localizedRoutes';
import { minifyCss } from '../src/lib/minifyCss';

describe('resolveUiRows', () => {
  const rows = [
    { key: 'ui_header_mega_see_all', value: '{"label":{"tr":"Tümünü Gör","en":"See All","de":"Alle ansehen"}}' },
    { key: 'ui_only_en', value: { label: { en: 'Only English' } } },
    { key: 'ui_plain', value: 'Düz metin' },
    { key: 'ui_header', value: { ui_header_login: 'Giriş Yap' } },
    { key: 'ui_mobile_i18n', value: { label: { tr: 'mobil' } } },
    { key: 'ui_admin_pages', value: { label: { tr: 'admin' } } },
    { key: 'ui_self', value: { label: { tr: 'ui_self' } } },
  ];

  test('locale etiketini, yoksa en yedeğini seçer', () => {
    const tr = resolveUiRows(rows, 'tr-TR');
    expect(tr.locale).toBe('tr');
    expect(tr.labels.ui_header_mega_see_all).toBe('Tümünü Gör');
    expect(tr.labels.ui_only_en).toBe('Only English');
    expect(tr.labels.ui_plain).toBe('Düz metin');
    expect(resolveUiRows(rows, 'de').labels.ui_header_mega_see_all).toBe('Alle ansehen');
  });

  test('section satırları ayrı tutulur; mobil/admin ve anahtarın kendisi dışarıda', () => {
    const tr = resolveUiRows(rows, 'tr');
    expect(tr.sections.ui_header).toEqual({ ui_header_login: 'Giriş Yap' });
    expect(tr.labels.ui_mobile_i18n).toBeUndefined();
    expect(tr.labels.ui_admin_pages).toBeUndefined();
    expect(tr.labels.ui_self).toBeUndefined();
  });
});

describe('localizeHtmlLinks', () => {
  test('eski İngilizce iç yolları locale kanoniğine çevirir', () => {
    const html = '<a href="/tr/consultants">a</a><a href="/tr/birth-chart">b</a><a href="/de/consultants/x?y=1#z">c</a>';
    expect(localizeHtmlLinks(html, 'https://goldmoodastro.com')).toBe(
      '<a href="/tr/danismanlar">a</a><a href="/tr/dogum-haritasi">b</a><a href="/de/berater/x?y=1#z">c</a>',
    );
  });

  test('aynı alan adına giden mutlak linki çevirir, dış alan adına dokunmaz', () => {
    const html = '<a href="https://goldmoodastro.com/tr/pricing">a</a><a href="https://example.com/tr/consultants">b</a>';
    expect(localizeHtmlLinks(html, 'https://goldmoodastro.com')).toBe(
      '<a href="https://goldmoodastro.com/tr/fiyatlandirma">a</a><a href="https://example.com/tr/consultants">b</a>',
    );
  });

  test('zaten kanonik linkler ve blog yolları değişmez', () => {
    const html = '<a href="/tr/danismanlar">a</a><a href="/tr/blog/x">b</a><a href="/tr">c</a>';
    expect(localizeHtmlLinks(html, 'https://goldmoodastro.com')).toBe(html);
  });
});

describe('minifyCss', () => {
  test('yorum ve boşlukları siler, seçicideki ":" öncesi boşluğu korur', () => {
    expect(minifyCss(':root {\n  --a: 1px; /* not */\n}\n.x a :hover { color: red; }')).toBe(
      ':root{--a:1px}.x a :hover{color:red}',
    );
  });
});
