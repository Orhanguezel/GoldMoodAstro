INSERT INTO site_settings (id, `key`, locale, value)
VALUES (
  '01000000-0000-4000-8000-000000000016',
  'custom_css',
  '*',
  '/* Premium Theme CSS Managed via Admin */\n\nbody::before {\n  content: "";\n  position: fixed;\n  inset: 0;\n  pointer-events: none;\n  z-index: 100;\n  opacity: 0.2;\n  mix-blend-mode: multiply;\n  background-image: url("data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' width=''200'' height=''200''%3E%3Cfilter id=''n''%3E%3CfeTurbulence type=''fractalNoise'' baseFrequency=''0.85'' numOctaves=''2'' stitchTiles=''stitch''/%3E%3CfeColorMatrix values=''0 0 0 0 0.66 0 0 0 0 0.53 0 0 0 0 0.29 0 0 0 0 0.08 0''/%3E%3C/filter%3E%3Crect width=''100%25'' height=''100%25'' filter=''url(%23n)''/%3E%3C/svg%3E");\n}'
) ON DUPLICATE KEY UPDATE value = VALUES(value);
