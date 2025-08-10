// server.js

require('dotenv').config();
const { startup, shutdown } = require('./Database/database');
const app = require('./app');

const PORT = process.env.PORT || 4000;

console.log('🔄 Server restarting with new auth system v3...');

startup()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start database, exiting.', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
