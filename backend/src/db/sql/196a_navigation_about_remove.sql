-- Remove "About" from Header menu items (moving to footer only)
DELETE FROM menu_items_i18n WHERE menu_item_id = 'mi-h-about';
DELETE FROM menu_items WHERE id = 'mi-h-about';
