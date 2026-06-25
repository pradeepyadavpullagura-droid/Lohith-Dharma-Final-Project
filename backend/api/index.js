const { app, initDatabase } = require('../server');

module.exports = async (req, res) => {
  try {
    await initDatabase();
  } catch (err) {
    console.error('Failed to initialize database in Vercel Serverless Function:', err);
  }
  return app(req, res);
};
