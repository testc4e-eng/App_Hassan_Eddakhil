const { Pool } = require("pg");
require("dotenv").config();

async function testDatabase() {
  console.log("🧪 Test de connexion à la base de données...\n");

  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  console.log("Configuration:");
  console.log("- Host:", config.host);
  console.log("- Port:", config.port);
  console.log("- Database:", config.database);
  console.log("- User:", config.user);
  console.log("- Password:", config.password ? "******" : "vide");

  const pool = new Pool(config);

  try {
    console.log("\n🔗 Tentative de connexion...");
    const client = await pool.connect();

    console.log("✅ Connexion réussie!");

    // Test 1: Vérifier la version de PostgreSQL
    const versionResult = await client.query("SELECT version()");
    console.log(
      "\n📊 Version PostgreSQL:",
      versionResult.rows[0].version.split(",")[0]
    );

    // Test 2: Lister les tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("\n🗃️  Tables disponibles:");
    if (tablesResult.rows.length === 0) {
      console.log("   ❌ Aucune table trouvée!");
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }

    // Test 3: Compter les stations
    try {
      const stationsResult = await client.query(
        "SELECT COUNT(*) as count FROM stations"
      );
      console.log(`\n👷 Nombre de stations: ${stationsResult.rows[0].count}`);
    } catch (err) {
      console.log('\n⚠️  Table "stations" non trouvée');
    }

    // Test 4: Compter les bassins
    try {
      const catchmentsResult = await client.query(
        "SELECT COUNT(*) as count FROM catchments"
      );
      console.log(
        `🏞️  Nombre de bassins versants: ${catchmentsResult.rows[0].count}`
      );
    } catch (err) {
      console.log('⚠️  Table "catchments" non trouvée');
    }

    client.release();
    await pool.end();

    console.log("\n🎉 Tous les tests terminés avec succès!");
  } catch (error) {
    console.error("\n❌ Erreur de connexion:", error.message);
    console.log("\n🔧 Solutions possibles:");
    console.log("1. Vérifiez que PostgreSQL est démarré");
    console.log("2. Vérifiez le mot de passe dans .env");
    console.log('3. Vérifiez que la base "hydro_my" existe');
    console.log('4. Essayez: psql -U postgres -c "CREATE DATABASE hydro_my;"');
  }
}

testDatabase();
