module.exports = {
  apps: [
    {
      name: 'goldmoodastro-backend',
      script: 'dist/index.js',
      cwd: './backend',
      interpreter: '/usr/local/bin/bun',
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
