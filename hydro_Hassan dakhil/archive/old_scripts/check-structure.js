const { Pool } = require('pg');
require('dotenv').config();

async function checkStructure() {
  console.log('🔍 Vérification de la structure de la base de données...\n');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    const client = await pool.connect();
    
    console.log('1. Colonnes de la table "stations":');
    const stationCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stations'
      ORDER BY ordinal_position
    `);
    
    stationCols.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n2. Exemple de données "stations":');
    const stationData = await client.query('SELECT * FROM stations LIMIT 1');
    if (stationData.rows.length > 0) {
      const row = stationData.rows[0];
      Object.keys(row).forEach(key => {
        console.log(`   ${key}: ${row[key]}`);
      });
    }
    
    console.log('\n3. Colonnes de la table "timeseries":');
    const tsCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'timeseries'
      ORDER BY ordinal_position
    `);
    
    tsCols.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n✅ Structure vérifiée. Le service adaptatif va s\'ajuster automatiquement.');
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkStructure();