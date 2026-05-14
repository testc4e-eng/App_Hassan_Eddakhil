const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_NAME = process.env.DB_NAME || 'hydro_hd_1714';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Hydro Data API v1.0',
    database: DB_NAME,
    endpoints: ['/health', '/stations', '/timeseries', '/test-db']
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, version() as version');
    client.release();
    await pool.end();
    
    res.json({
      success: true,
      database: 'connected',
      time: result.rows[0].time,
      version: result.rows[0].version
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      config: {
        host: process.env.DB_HOST,
        database: DB_NAME,
        user: process.env.DB_USER
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
