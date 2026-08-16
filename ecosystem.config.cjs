module.exports = {
  apps: [
    {
      name: 'goldmoodastro-backend',
      script: 'dist/index.js',
      cwd: './backend',
      interpreter: '/usr/local/bin/bun',
      // Canlıdaki tanımla hizalı (2026-08-16): 768M sınırı ~5 günde bir
      // bellek-tavanı restart'ı üretiyordu, 1G'a çıkarıldı.
      max_memory_restart: '1024M',
      env: {
        NODE_ENV: 'production',
        PORT: 8094
      }
    },
    {
      name: 'goldmoodastro-admin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3094',
      cwd: './admin_panel',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'goldmoodastro-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3095',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
