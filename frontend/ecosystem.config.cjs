// /var/www/goldmoodastro/frontend/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'goldmoodastro-frontend',
      cwd: '/var/www/goldmoodastro/frontend',
      script: '/usr/bin/env',
      args: 'bash ./scripts/pm2-start-frontend.sh',

      exec_mode: 'fork',
      instances: 1,

      watch: false,
      autorestart: true,

      max_memory_restart: '450M',

      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 5000,

      kill_timeout: 8000,
      listen_timeout: 10000,

      env: {
        NODE_ENV: 'production',
        PORT: '3095',
        // 0.0.0.0'a bind (127.0.0.1 Next rewrite+https-proxy'de 500 yapiyor — bkz
        // pm2-start-frontend.sh notu). nginx zaten 127.0.0.1:3095'e proxy'liyor.
        HOST: '0.0.0.0',
        HOSTNAME: '0.0.0.0',
        NEXT_TELEMETRY_DISABLED: '1',
      },

      out_file: '/home/orhan/.pm2/logs/goldmoodastro-frontend.out.log',
      error_file: '/home/orhan/.pm2/logs/goldmoodastro-frontend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
