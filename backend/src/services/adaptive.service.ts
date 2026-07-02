//src/services/adaptive.services.ts
import { DatabaseService } from "./database.service";

export class AdaptiveHydroService {
  private db = new DatabaseService();
  private tableColumns: Record<string, string[]> = {};

  // Méthode pour détecter les colonnes d'une table
  private async detectTableColumns(tableName: string): Promise<string[]> {
    if (this.tableColumns[tableName]) {
      return this.tableColumns[tableName];
    }

    try {
      const query = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `;
      const result = await this.db.query<{ column_name: string }>(query, [
        tableName,
      ]);
      const columns = result.map((row) => row.column_name);

      this.tableColumns[tableName] = columns;
      console.log(`📊 Colonnes détectées pour ${tableName}:`, columns);

      return columns;
    } catch (error) {
      console.error(`Erreur détection colonnes ${tableName}:`, error);
      return [];
    }
  }

  // Stations adaptative
  async getStationsAdaptive(filter?: any): Promise<any[]> {
    const columns = await this.detectTableColumns("stations");

    // Colonnes minimales requises
    let selectColumns = ["station_id", "name"];

    // Ajouter les colonnes si elles existent
    if (columns.includes("geom")) {
      selectColumns.push("ST_AsGeoJSON(geom) as geom");
    }
    if (columns.includes("station_type")) {
      selectColumns.push("station_type as type");
    } else if (columns.includes("type")) {
      selectColumns.push("type");
    } else {
      selectColumns.push("'station' as type");
    }
    if (columns.includes("created_at")) {
      selectColumns.push("created_at");
    }
    if (columns.includes("code")) {
      selectColumns.push("code");
    }

    let query = `SELECT ${selectColumns.join(", ")} FROM stations WHERE 1=1`;
    const params: any[] = [];

    if (filter?.stationIds?.length) {
      query += ` AND station_id = ANY($${params.length + 1})`;
      params.push(filter.stationIds);
    }

    query += " ORDER BY name";

    if (filter?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(filter.limit);
    }

    return this.db.query(query, params);
  }

  // Timeseries adaptative
  async getTimeseriesAdaptive(
    stationId?: number,
    propertyId?: number
  ): Promise<any[]> {
    const tsColumns = await this.detectTableColumns("timeseries");
    const opColumns = await this.detectTableColumns("observed_properties");

    // Construction de la requête SELECT
    const selectParts: string[] = [
      "ts.ts_id",
      "ts.station_id",
      "ts.property_id",
    ];

    // Gérer la colonne unit
    if (tsColumns.includes("unit")) {
      selectParts.push("ts.unit");
    } else if (opColumns.includes("unit")) {
      selectParts.push("op.unit");
    } else {
      selectParts.push("'N/A' as unit");
    }

    // Ajouter autres colonnes si elles existent
    if (tsColumns.includes("model_run_id")) selectParts.push("ts.model_run_id");
    if (tsColumns.includes("catchment_id")) selectParts.push("ts.catchment_id");
    if (tsColumns.includes("created_at")) selectParts.push("ts.created_at");

    // Informations des tables liées
    selectParts.push("s.name as station_name");
    if (opColumns.includes("property_name"))
      selectParts.push("op.property_name");
    if (opColumns.includes("property_code"))
      selectParts.push("op.property_code");

    let query = `
      SELECT ${selectParts.join(", ")}
      FROM timeseries ts
      LEFT JOIN stations s ON ts.station_id = s.station_id
      LEFT JOIN observed_properties op ON ts.property_id = op.property_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (stationId) {
      query += ` AND ts.station_id = $${params.length + 1}`;
      params.push(stationId);
    }

    if (propertyId) {
      query += ` AND ts.property_id = $${params.length + 1}`;
      params.push(propertyId);
    }

    query += " ORDER BY ts.created_at DESC";

    return this.db.query(query, params);
  }

  // Méthode pour vérifier la santé avec détection
  async checkDatabaseHealth(): Promise<any> {
    try {
      // Test de connexion basique
      await this.db.query("SELECT NOW()");

      // Détecter les tables disponibles
      const tablesResult = await this.db.query<{ table_name: string }>(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      // CORRECTION ICI : utiliser tablesResult directement (c'est déjà un tableau)
      const tables = tablesResult.map((row) => row.table_name);

      // Détecter la structure de chaque table importante
      const tableStructures: Record<string, string[]> = {};
      const importantTables = [
        "stations",
        "timeseries",
        "catchments",
        "observed_properties",
      ];

      for (const table of importantTables) {
        const columns = await this.detectTableColumns(table);
        tableStructures[table] = columns;
      }

      return {
        connected: true,
        tables: tables,
        structures: tableStructures,
        message: "Database connected successfully",
      };
    } catch (error) {
      return {
        connected: false,
        tables: [],
        structures: {},
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Database connection failed",
      };
    }
  }
}
