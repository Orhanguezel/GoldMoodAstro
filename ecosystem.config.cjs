module.exports = {
  apps: [
    {
      name: 'goldmoodastro-backend',
      script: 'dist/index.js',
      cwd: './backend',
      interpreter: 'node',
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
    }
  ]
};
