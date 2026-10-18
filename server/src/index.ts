import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const PORT = env.PORT;

// Only listen on port when running as a standalone server, not inside Vercel serverless
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`Journal API server running on port ${PORT} [${env.NODE_ENV}]`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down server gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await pool.end();
        console.log('Database pool drained.');
        process.exit(0);
      } catch (err) {
        console.error('Error during pool draining:', err);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;

