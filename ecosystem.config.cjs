// PM2 process definition for the chat backend (which also serves the React build).
// Run from the repo root:  pm2 start ecosystem.config.cjs
//
// cwd is set to ./backend so dotenv loads backend/.env correctly.
module.exports = {
  apps: [
    {
      name: "chat",
      script: "src/index.js",
      cwd: "./backend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      // Guard rail for small free-tier instances (t2.micro / t3.micro ~1GB RAM).
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
