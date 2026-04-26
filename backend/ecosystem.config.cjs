// /var/www/goldmoodastro/backend/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'goldmoodastro-backend',
      cwd: '/var/www/goldmoodastro/backend',

      interpreter: '/home/orhan/.bun/bin/bun',
      script: 'dist/index.js',

      exec_mode: 'fork',
      instances: 1,

      watch: false,
      autorestart: true,

      max_memory_restart: '400M',

      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 5000,

      kill_timeout: 8000,
      listen_timeout: 10000,

      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 8094,
      },

      out_file: '/home/orhan/.pm2/logs/goldmoodastro-backend.out.log',
      error_file: '/home/orhan/.pm2/logs/goldmoodastro-backend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
