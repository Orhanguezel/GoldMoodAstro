-- ============================================================
-- 221_gutschein.seed.sql
-- Gutschein Produkt-Vorlagen (100 € / 200 €)
-- ============================================================

INSERT INTO `gutschein_products`
  (`id`, `name`, `value`, `currency`, `validity_days`, `description`, `is_active`, `display_order`)
VALUES
  (
    UUID(),
    'Gutschein 100 €',
    100.00,
    'EUR',
    365,
    'Verschenken Sie Entspannung - einlösbar für alle Massageleistungen.',
    1,
    10
  ),
  (
    UUID(),
    'Gutschein 200 €',
    200.00,
    'EUR',
    365,
    'Verwöhnen Sie Ihre Liebsten mit einem Premium-Wellnesserlebnis.',
    1,
    20
  );
