const { Pool } = require("pg");
require("dotenv").config();

async function diagnoseDatabase() {
  console.log("🔍 Diagnostic de la base de données hydro_hd\n");

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    const client = await pool.connect();

    console.log("1. 📊 Tables disponibles:");
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    tables.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });

    console.log("\n2. 🔍 Structure des tables principales:");

    // Stations
    console.log('\n   Table "stations":');
    const stationsCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stations'
      ORDER BY ordinal_position
    `);
    stationsCols.rows.forEach((col) => {
      console.log(`     - ${col.column_name} (${col.data_type})`);
    });

    // Timeseries
    console.log('\n   Table "timeseries":');
    const timeseriesCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'timeseries'
      ORDER BY ordinal_position
    `);
    timeseriesCols.rows.forEach((col) => {
      console.log(`     - ${col.column_name} (${col.data_type})`);
    });

    // Données d'exemple
    console.log("\n3. 🎯 Données d'exemple:");

    console.log("\n   Stations (première ligne):");
    const stationExample = await client.query("SELECT * FROM stations LIMIT 1");
    if (stationExample.rows.length > 0) {
      Object.entries(stationExample.rows[0]).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    }

    console.log("\n   Timeseries (première ligne):");
    const tsExample = await client.query("SELECT * FROM timeseries LIMIT 1");
    if (tsExample.rows.length > 0) {
      Object.entries(tsExample.rows[0]).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    }

    console.log("\n4. ✅ Test des requêtes de base:");

    // Test requête stations
    try {
      const stationsCount = await client.query("SELECT COUNT(*) FROM stations");
      console.log(`   - Nombre de stations: ${stationsCount.rows[0].count}`);
    } catch (err) {
      console.log(`   - ❌ Erreur stations: ${err.message}`);
    }

    // Test requête timeseries avec JOIN
    try {
      const tsQuery = await client.query(`
        SELECT ts.ts_id, s.name as station_name, op.property_name
        FROM timeseries ts
        LEFT JOIN stations s ON ts.station_id = s.station_id
        LEFT JOIN observed_properties op ON ts.property_id = op.property_id
        LIMIT 1
      `);
      if (tsQuery.rows.length > 0) {
        console.log("   - ✅ Timeseries JOIN fonctionne");
      }
    } catch (err) {
      console.log(`   - ❌ Erreur timeseries JOIN: ${err.message}`);
    }

    client.release();
    await pool.end();

    console.log("\n🎉 Diagnostic terminé!");
  } catch (error) {
    console.error("\n❌ Erreur de connexion:", error.message);
  }
}

diagnoseDatabase();
