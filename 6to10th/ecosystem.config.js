module.exports = {
  apps: [
    {
      name: 'smartslate-student-pi',
      script: './student/server/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '250M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      }
    }
  ]
};
