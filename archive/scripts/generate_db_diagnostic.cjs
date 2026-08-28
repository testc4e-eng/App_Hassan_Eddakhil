const fs = require("fs/promises");
const path = require("path");
const { Pool } = require(path.join(__dirname, "..", "hydro_Hassan dakhil", "backend", "node_modules", "pg"));

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "DOCUMENTATION");

const DB = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "bdd_erosion_abhgzr_20-04-26",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

const SYSTEM_SCHEMAS = new Set(["pg_catalog", "information_schema", "pg_toast"]);
const GEO_TYPES = new Set(["geometry", "geography"]);
const NUMERIC_TYPES = new Set(["smallint", "integer", "bigint", "numeric", "real", "double precision", "decimal", "money"]);
const DATE_TYPES = new Set(["date", "timestamp without time zone", "timestamp with time zone", "time without time zone", "time with time zone", "interval"]);

const qident = (name) => `"${String(name).replace(/"/g, '""')}"`;
const qname = (schema, name) => `${qident(schema)}.${qident(name)}`;
const escMd = (v) => String(v ?? "").replace(/\|/g, "\\|");
const fmtValue = (v) => {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};
const pct = (n) => (n === null || n === undefined || Number.isNaN(n) ? "" : `${(n * 100).toFixed(1)}%`);
const fmtBytes = (bytes) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(bytes || 0);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};
const titleCase = (name) =>
  String(name)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function classifyRole(tableName) {
  const n = String(tableName).toLowerCase();
  if (["timeseries", "measurements", "model_runs", "qc_runs", "qc_issues", "subbasin_metrics_annual", "reservoir_bathymetry"].includes(n)) return "fact";
  if (["stations", "catchments", "subbasins", "reaches", "rivers", "reservoirs", "observed_properties", "landcover_classes", "landcover_periods", "module_properties", "permissions", "roles", "users"].includes(n)) return "dimension";
  if (n.includes("override") || n.includes("user_roles") || n.includes("role_permissions")) return "junction";
  if (n.startsWith("v_") || n.startsWith("mv_")) return "view";
  if (n === "spatial_ref_sys") return "technical";
  return "mixed";
}

function classifyBusinessDomain(name, comment = "") {
  const txt = `${name} ${comment}`.toLowerCase();
  if (txt.includes("erosi") || txt.includes("sediment") || txt.includes("sedi")) return "erosion/sediments";
  if (txt.includes("hydro") || txt.includes("streamflow") || txt.includes("debit") || txt.includes("barrage") || txt.includes("bathymetr") || txt.includes("catchment") || txt.includes("bassin") || txt.includes("station") || txt.includes("river") || txt.includes("reach") || txt.includes("reservoir") || txt.includes("subbasin") || txt.includes("commune")) return "hydrology";
  if (txt.includes("climat") || txt.includes("temperature") || txt.includes("humidity") || txt.includes("wind") || txt.includes("evaporation") || txt.includes("precip")) return "climate";
  if (txt.includes("quality") || txt.includes("water quality") || txt.includes("turbidity") || txt.includes("conductivity") || txt.includes("ph")) return "water quality";
  if (txt.includes("landcover") || txt.includes("occupation du sol")) return "environment";
  if (txt.includes("qc_") || txt.includes("audit")) return "quality control";
  return "general";
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeFile(relPath, content) {
  const full = path.join(OUT_DIR, relPath);
  await ensureDir(path.dirname(full));
  await fs.writeFile(full, content, "utf8");
}

async function fetchRows(pool, sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function main() {
  await ensureDir(OUT_DIR);
  const pool = new Pool(DB);

  try {
    const conn = await fetchRows(
      pool,
      "SELECT current_database() AS db, current_user AS usr, version() AS version, now() AS analyzed_at"
    );
    const dbInfo = conn[0];

    const extensions = await fetchRows(
      pool,
      `SELECT extname, extversion
       FROM pg_extension
       ORDER BY extname`
    );

    const schemas = await fetchRows(
      pool,
      `SELECT nspname AS schema_name
       FROM pg_namespace
       WHERE nspname NOT IN ('pg_catalog', 'information_schema')
         AND nspname NOT LIKE 'pg_toast%'
       ORDER BY CASE WHEN nspname = 'public' THEN 0 ELSE 1 END, nspname`
    );

    const relations = await fetchRows(
      pool,
      `SELECT n.nspname AS schema_name,
              c.relname AS relation_name,
              c.relkind,
              CASE c.relkind
                WHEN 'r' THEN 'table'
                WHEN 'p' THEN 'partitioned table'
                WHEN 'f' THEN 'foreign table'
                WHEN 'v' THEN 'view'
                WHEN 'm' THEN 'materialized view'
                WHEN 'S' THEN 'sequence'
                ELSE c.relkind::text
              END AS relation_kind,
              COALESCE(obj_description(c.oid, 'pg_class'), '') AS comment,
              EXISTS (
                SELECT 1
                FROM pg_depend d
                WHERE d.objid = c.oid
                  AND d.deptype = 'e'
              ) AS is_extension_owned,
              c.reltuples::bigint AS estimated_rows
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
         AND n.nspname NOT LIKE 'pg_toast%'
         AND c.relkind IN ('r', 'p', 'f', 'v', 'm', 'S')
       ORDER BY n.nspname, c.relkind, c.relname`
    );

    const tables = relations.filter((r) => ["r", "p", "f"].includes(r.relkind));
    const views = relations.filter((r) => r.relkind === "v");
    const matViews = relations.filter((r) => r.relkind === "m");

    const columns = await fetchRows(
      pool,
      `SELECT c.table_schema AS schema_name,
              c.table_name,
              c.ordinal_position,
              c.column_name,
              c.data_type,
              c.udt_name,
              format_type(a.atttypid, a.atttypmod) AS formatted_type,
              c.is_nullable,
              c.column_default,
              a.attnotnull,
              a.attidentity,
              a.attgenerated,
              COALESCE(col_description(a.attrelid, a.attnum), '') AS column_comment
       FROM information_schema.columns c
       JOIN pg_class cls
         ON cls.relname = c.table_name
       JOIN pg_namespace n
         ON n.nspname = c.table_schema AND n.oid = cls.relnamespace
       JOIN pg_attribute a
         ON a.attrelid = cls.oid AND a.attname = c.column_name AND a.attnum > 0 AND NOT a.attisdropped
       WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
         AND c.table_schema NOT LIKE 'pg_toast%'
       ORDER BY c.table_schema, c.table_name, c.ordinal_position`
    );

    const constraints = await fetchRows(
      pool,
      `SELECT n.nspname AS schema_name,
              c.relname AS table_name,
              con.conname,
              con.contype,
              CASE con.contype
                WHEN 'p' THEN 'primary key'
                WHEN 'f' THEN 'foreign key'
                WHEN 'u' THEN 'unique'
                WHEN 'c' THEN 'check'
                WHEN 'x' THEN 'exclusion'
                ELSE con.contype::text
              END AS constraint_kind,
              pg_get_constraintdef(con.oid, true) AS definition
       FROM pg_constraint con
       JOIN pg_class c ON c.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
         AND n.nspname NOT LIKE 'pg_toast%'
       ORDER BY n.nspname, c.relname, con.contype, con.conname`
    );

    const indexes = await fetchRows(
      pool,
      `SELECT schemaname AS schema_name,
              tablename AS table_name,
              indexname,
              indexdef
       FROM pg_indexes
       WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
       ORDER BY schemaname, tablename, indexname`
    );

    const tableStats = [];
    for (const table of tables) {
      tableStats.push(await analyzeTable(pool, table, columns, constraints, indexes));
    }

    const spatialTables = tableStats.filter((t) => t.spatial.length);
    const quality = buildQualityReport(tableStats);
    const recommendations = buildRecommendations({ tableStats, spatialTables, constraints, indexes, views, matViews });
    const totalSize = Number((await fetchRows(pool, "SELECT pg_database_size(current_database()) AS bytes"))[0].bytes);
    const estimatedRows = tables.reduce((acc, t) => acc + Number(t.estimated_rows || 0), 0);
    const schemaSummary = schemas.map((s) => {
      const rels = relations.filter((r) => r.schema_name === s.schema_name);
      return {
        schema_name: s.schema_name,
        tables: rels.filter((r) => ["r", "p", "f"].includes(r.relkind)).length,
        views: rels.filter((r) => r.relkind === "v").length,
        materialized_views: rels.filter((r) => r.relkind === "m").length,
        sequences: rels.filter((r) => r.relkind === "S").length,
      };
    });

    const diagnostics = {
      generated_at: dbInfo.analyzed_at,
      connection: dbInfo,
      size: { bytes: totalSize, human: fmtBytes(totalSize) },
      extensions,
      schemas,
      schema_summary: schemaSummary,
      relations,
      tables: tableStats,
      views,
      materialized_views: matViews,
      total_table_count: tables.length,
      total_view_count: views.length,
      total_materialized_view_count: matViews.length,
      estimated_row_count: estimatedRows,
      quality,
      recommendations,
      spatial_tables: spatialTables,
    };

    await writeFile("diagnostic_structured.json", JSON.stringify(diagnostics, null, 2));
    await writeFile("diagnostic_global.md", buildGlobalMarkdown(diagnostics));
    await writeFile("analyse_tables.md", buildTableMarkdown(tableStats));
    await writeFile("analyse_spatiale.md", buildSpatialMarkdown(spatialTables));
    await writeFile("analyse_qualite.md", buildQualityMarkdown(quality, tableStats));
    await writeFile("recommandations.md", buildRecommendationsMarkdown(recommendations));

    console.log(`Diagnostic written to ${OUT_DIR}`);
  } finally {
    await pool.end();
  }
}

async function analyzeTable(pool, table, columns, constraints, indexes) {
  const tableColumns = columns.filter((c) => c.schema_name === table.schema_name && c.table_name === table.relation_name);
  const tableConstraints = constraints.filter((c) => c.schema_name === table.schema_name && c.table_name === table.relation_name);
  const tableIndexes = indexes.filter((i) => i.schema_name === table.schema_name && i.table_name === table.relation_name);
  const localTable = table.relkind !== "f";

  let rowCount = null;
  let sampleRows = [];
  if (localTable) {
    rowCount = Number((await fetchRows(pool, `SELECT count(*)::bigint AS count FROM ${qname(table.schema_name, table.relation_name)}`))[0].count);
    sampleRows = await buildSampleRows(pool, table.schema_name, table.relation_name, tableColumns);
  }

  const primaryKeys = tableConstraints.filter((c) => c.contype === "p").map((c) => c.definition);
  const foreignKeys = tableConstraints.filter((c) => c.contype === "f").map((c) => c.definition);
  const stats = await columnStats(pool, table, tableColumns, rowCount);
  const spatial = await spatialStats(pool, table, tableColumns);
  const duplicates = await duplicateStats(pool, table, tableColumns, primaryKeys);

  return {
    ...table,
    role: classifyRole(table.relation_name),
    domain: classifyBusinessDomain(table.relation_name, table.comment),
    row_count: rowCount,
    sample_rows: sampleRows,
    columns: tableColumns,
    primary_keys: primaryKeys,
    foreign_keys: foreignKeys,
    indexes: tableIndexes,
    stats,
    spatial,
    duplicates,
  };
}

async function buildSampleRows(pool, schemaName, tableName, tableColumns) {
  const cols = tableColumns.map((col) => {
    const ident = qident(col.column_name);
    const type = String(col.formatted_type).toLowerCase();
    if (type.includes("geometry") || type.includes("geography")) {
      return `CASE WHEN ${ident} IS NULL THEN NULL ELSE ST_AsText(${ident}) END AS ${ident}`;
    }
    if (type === "bytea") {
      return `encode(${ident}, 'hex') AS ${ident}`;
    }
    return ident;
  });
  const selectList = cols.length ? cols.join(", ") : "*";
  const rows = await fetchRows(pool, `SELECT row_to_json(t) AS row_json FROM (SELECT ${selectList} FROM ${qname(schemaName, tableName)} LIMIT 5) t`);
  return rows.map((r) => r.row_json);
}

async function columnStats(pool, table, tableColumns, rowCount) {
  if (rowCount === null || !tableColumns.length) return [];
  const list = [];
  for (const col of tableColumns) {
    const dataType = String(col.data_type).toLowerCase();
    const fmtType = String(col.formatted_type).toLowerCase();
    const isNumeric = NUMERIC_TYPES.has(dataType);
    const isDate = DATE_TYPES.has(fmtType) || fmtType.includes("timestamp") || fmtType === "date";
    if (!isNumeric && !isDate) continue;

    const colName = qident(col.column_name);
    const baseSql = isNumeric
      ? `SELECT MIN(${colName}) AS min, MAX(${colName}) AS max, AVG(${colName}) AS avg FROM ${qname(table.schema_name, table.relation_name)} WHERE ${colName} IS NOT NULL`
      : `SELECT MIN(${colName}) AS min, MAX(${colName}) AS max FROM ${qname(table.schema_name, table.relation_name)} WHERE ${colName} IS NOT NULL`;
    const base = await fetchRows(pool, baseSql);
    const nulls = await fetchRows(pool, `SELECT COUNT(*)::bigint AS nulls FROM ${qname(table.schema_name, table.relation_name)} WHERE ${colName} IS NULL`);
    list.push({
      column_name: col.column_name,
      type: col.formatted_type,
      category: isNumeric ? "numeric" : "date",
      min: base[0].min,
      max: base[0].max,
      avg: base[0].avg ?? null,
      null_count: Number(nulls[0].nulls),
      null_pct: rowCount ? Number(nulls[0].nulls) / rowCount : null,
    });
  }
  return list;
}

async function spatialStats(pool, table, tableColumns) {
  const spatialColumns = tableColumns.filter((c) => GEO_TYPES.has(String(c.udt_name).toLowerCase()) || String(c.formatted_type).toLowerCase().includes("geometry(") || String(c.formatted_type).toLowerCase().includes("geography("));
  const list = [];
  for (const col of spatialColumns) {
    const colName = qident(col.column_name);
    const row = await fetchRows(
      pool,
      `SELECT COUNT(*)::bigint AS total_rows,
              COUNT(*) FILTER (WHERE ${colName} IS NOT NULL)::bigint AS non_null_rows,
              COUNT(*) FILTER (WHERE ${colName} IS NOT NULL AND NOT ST_IsValid(${colName}::geometry))::bigint AS invalid_rows,
              MIN(CASE WHEN ${colName} IS NOT NULL THEN GeometryType(${colName}::geometry) END) AS geom_type,
              MIN(CASE WHEN ${colName} IS NOT NULL THEN ST_SRID(${colName}::geometry) END) AS srid
       FROM ${qname(table.schema_name, table.relation_name)}`
    );
    const idx = await fetchRows(
      pool,
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE schemaname = $1
         AND tablename = $2
         AND indexdef ILIKE '%' || $3 || '%'`,
      [table.schema_name, table.relation_name, col.column_name]
    );
    list.push({
      column_name: col.column_name,
      type: col.formatted_type,
      geometry_type: row[0].geom_type,
      srid: row[0].srid,
      total_rows: Number(row[0].total_rows),
      non_null_rows: Number(row[0].non_null_rows),
      invalid_rows: Number(row[0].invalid_rows),
      spatial_indexes: idx,
    });
  }
  return list;
}

async function duplicateStats(pool, table, tableColumns, primaryKeys) {
  if (primaryKeys.length || !tableColumns.length) {
    return { method: primaryKeys.length ? "primary key" : "unavailable", duplicates: primaryKeys.length ? 0 : null };
  }
  const cols = tableColumns.map((c) => qident(c.column_name)).join(", ");
  try {
    const rows = await fetchRows(
      pool,
      `SELECT COUNT(*)::bigint AS duplicates
       FROM (
         SELECT ${cols}, COUNT(*) AS c
         FROM ${qname(table.schema_name, table.relation_name)}
         GROUP BY ${cols}
         HAVING COUNT(*) > 1
       ) d`
    );
    return { method: "full row", duplicates: Number(rows[0].duplicates) };
  } catch {
    return { method: "unavailable", duplicates: null };
  }
}

function buildQualityReport(tableStats) {
  const issues = [];
  for (const table of tableStats) {
    const nullHeavy = table.stats.filter((s) => s.null_pct !== null && s.null_pct >= 0.5);
    if (nullHeavy.length) {
      issues.push({ type: "high_null_rate", table: `${table.schema_name}.${table.relation_name}`, columns: nullHeavy });
    }
    if (!table.primary_keys.length) {
      issues.push({ type: "missing_primary_key", table: `${table.schema_name}.${table.relation_name}` });
    }
    for (const s of table.stats) {
      if (s.category === "numeric" && typeof s.min === "number" && s.min < 0) {
        issues.push({ type: "negative_numeric_value", table: `${table.schema_name}.${table.relation_name}`, column: s.column_name, min: s.min });
      }
    }
    const invalid = table.spatial.filter((s) => s.invalid_rows > 0);
    if (invalid.length) {
      issues.push({ type: "invalid_geometry", table: `${table.schema_name}.${table.relation_name}`, columns: invalid });
    }
  }
  return { issues };
}

function buildRecommendations({ tableStats, spatialTables, constraints, indexes, views, matViews }) {
  const items = [];
  items.push({ priority: "high", topic: "dashboard", text: "Construire le dashboard directement sur les tables métier du schéma `public` et isoler les requêtes de consommation dans des vues dédiées si besoin." });
  items.push({ priority: "high", topic: "timeseries", text: "Structurer les mesures météo et hydro autour des tables `mesures_*` et des stations/barrages pour faciliter les séries temporelles." });
  items.push({ priority: "medium", topic: "spatial", text: "Vérifier les index spatiaux GIST sur les couches géographiques critiques et corriger les géométries invalides avant exposition cartographique." });
  items.push({ priority: "medium", topic: "quality", text: "Mettre en place un suivi qualité sur les tables sans PK et les colonnes fortement nulles, en distinguant les colonnes métier facultatives des colonnes manquantes." });
  items.push({ priority: "medium", topic: "performance", text: "Prévoir des vues matérialisées ou un partitionnement si les tables de mesures grossissent fortement au fil du temps." });
  if (!indexes.some((i) => String(i.indexdef).toLowerCase().includes("gist"))) {
    items.push({ priority: "high", topic: "spatial-index", text: "Aucun index GIST n'a été détecté dans l'inventaire d'index; vérifier les couches spatiales critiques." });
  }
  if (!matViews.length) {
    items.push({ priority: "low", topic: "aggregations", text: "Créer des vues matérialisées métier si certaines agrégations sont recalculées fréquemment." });
  }
  return {
    items,
    fk_count: constraints.filter((c) => c.contype === "f").length,
    table_count: tableStats.length,
    spatial_table_count: spatialTables.length,
    view_count: views.length,
    materialized_view_count: matViews.length,
  };
}

function buildGlobalMarkdown(d) {
  const lines = [];
  lines.push(`# Diagnostic global`);
  lines.push("");
  lines.push(`- Base analysée: \`${d.connection.db}\``);
  lines.push(`- Serveur: ${d.connection.version}`);
  lines.push(`- Utilisateur: \`${d.connection.usr}\``);
  lines.push(`- Date d'analyse: ${d.generated_at}`);
  lines.push(`- Taille de la base: ${d.size.human} (${d.size.bytes} octets)`);
  lines.push(`- Schémas non systèmes: ${d.schemas.map((s) => `\`${s.schema_name}\``).join(", ")}`);
  lines.push(`- Extensions: ${d.extensions.map((e) => `\`${e.extname} ${e.extversion}\``).join(", ")}`);
  lines.push(`- Tables physiques/étrangères: ${d.total_table_count}`);
  lines.push(`- Vues: ${d.total_view_count}`);
  lines.push(`- Vues matérialisées: ${d.total_materialized_view_count}`);
  lines.push(`- Nombre total de lignes estimé: ${d.estimated_row_count}`);
  lines.push("");
  lines.push(`## Lecture rapide`);
  lines.push("");
  if (d.schema_summary.length === 1 && d.schema_summary[0].schema_name === "public") {
    lines.push(`La base est quasi entièrement centralisée dans le schéma \`public\`. Elle contient un socle hydrologique, spatial et climatique, sans couche applicative multi-schémas apparente.`);
  } else {
    lines.push(`La base est structurée autour de plusieurs schémas fonctionnels, avec un cœur métier, des référentiels, des couches spatiales et des vues d'exposition.`);
  }
  lines.push("");
  const hasFdw = d.extensions.some((e) => String(e.extname).toLowerCase().includes("fdw"));
  lines.push(hasFdw ? `PostGIS est disponible et un FDW est présent pour l'accès à des données externes.` : `PostGIS est disponible. Aucun FDW n'a été détecté dans cette base.`);
  lines.push("");
  lines.push(`## Répartition par schéma`);
  lines.push("");
  for (const s of d.schema_summary) {
    lines.push(`- ${s.schema_name}: ${s.tables} tables, ${s.views} vues, ${s.materialized_views} vues matérialisées, ${s.sequences} séquences.`);
  }
  lines.push("");
  lines.push(`## Tables techniques`);
  lines.push("");
  lines.push(`- \`public.spatial_ref_sys\`: table technique PostGIS.`);
  if (hasFdw) {
    lines.push(`- Tables étrangères éventuelles via FDW.`);
  }
  lines.push(`- \`pg_catalog\`, \`information_schema\`, \`pg_toast\`: schémas système exclus.`);
  return lines.join("\n");
}

function buildTableMarkdown(tableStats) {
  const lines = [];
  lines.push(`# Analyse par table`);
  lines.push("");
  lines.push(`Cette section détaille les tables du schéma \`public\`.`);
  lines.push("");
  const publicTables = tableStats.filter((t) => t.schema_name === "public" && ["r", "p", "f"].includes(t.relkind));
  for (const table of publicTables) {
    lines.push(`## ${table.schema_name}.${table.relation_name}`);
    lines.push(`- Rôle: ${table.role}`);
    lines.push(`- Domaine métier: ${table.domain}`);
    lines.push(`- Lignes: ${table.row_count === null ? "N/A" : table.row_count}`);
    lines.push(`- Commentaire: ${table.comment || "N/A"}`);
    lines.push(`- Clé primaire: ${table.primary_keys.length ? table.primary_keys.join(" ; ") : "Aucune détectée"}`);
    lines.push(`- Clés étrangères: ${table.foreign_keys.length ? table.foreign_keys.join(" ; ") : "Aucune détectée"}`);
    lines.push(`- Index: ${table.indexes.length ? table.indexes.map((i) => i.indexname).join(", ") : "Aucun index trouvé"}`);
    lines.push("");
    lines.push(`### Colonnes`);
    lines.push("");
    lines.push(`| Nom | Type | Nullable | Commentaire |`);
    lines.push(`| --- | --- | --- | --- |`);
    for (const col of table.columns) {
      lines.push(`| ${escMd(col.column_name)} | ${escMd(col.formatted_type)} | ${col.attnotnull ? "NON" : "OUI"} | ${escMd(col.column_comment || "")} |`);
    }
    lines.push("");
    if (table.stats.length) {
      lines.push(`### Statistiques`);
      lines.push("");
      lines.push(`| Colonne | Catégorie | Min | Max | Moyenne | Nulls | % nulls |`);
      lines.push(`| --- | --- | --- | --- | --- | --- | --- |`);
      for (const s of table.stats) {
        lines.push(`| ${escMd(s.column_name)} | ${s.category} | ${escMd(fmtValue(s.min))} | ${escMd(fmtValue(s.max))} | ${escMd(fmtValue(s.avg))} | ${s.null_count} | ${pct(s.null_pct)} |`);
      }
      lines.push("");
    }
    if (table.sample_rows.length) {
      lines.push(`### Échantillon`);
      lines.push("");
      for (const row of table.sample_rows) {
        lines.push(`- ${escMd(JSON.stringify(row))}`);
      }
      lines.push("");
    }
    lines.push(`### Qualité rapide`);
    lines.push("");
    lines.push(`- Duplicats: ${table.duplicates?.duplicates ?? "N/A"} (${table.duplicates?.method || "non évalué"})`);
    lines.push(`- Géométrie: ${table.spatial.length ? "présente" : "absente"}`);
    lines.push("");
  }
  return lines.join("\n");
}

function buildSpatialMarkdown(spatialTables) {
  const lines = [];
  lines.push(`# Analyse spatiale`);
  lines.push("");
  lines.push(`Les tables ci-dessous contiennent des colonnes spatiales détectées via PostGIS.`);
  lines.push("");
  if (!spatialTables.length) {
    lines.push(`Aucune table spatiale détectée.`);
    return lines.join("\n");
  }
  for (const table of spatialTables) {
    lines.push(`## ${table.schema_name}.${table.relation_name}`);
    lines.push(`- Rôle: ${table.role}`);
    lines.push(`- Domaine: ${table.domain}`);
    lines.push(`- Lignes: ${table.row_count === null ? "N/A" : table.row_count}`);
    for (const s of table.spatial) {
      lines.push(`- Colonne \`${s.column_name}\`: type ${s.type}, géométrie ${s.geometry_type || "N/A"}, SRID ${s.srid ?? "N/A"}, objets non nuls ${s.non_null_rows}, géométries invalides ${s.invalid_rows}`);
      lines.push(s.spatial_indexes.length ? `  - Index spatiaux: ${s.spatial_indexes.map((i) => i.indexname).join(", ")}` : `  - Index spatiaux: aucun détecté`);
    }
    lines.push("");
  }
  lines.push(`## Couches métier probables`);
  lines.push("");
  const names = spatialTables.map((t) => `${t.schema_name}.${t.relation_name}`);
  const find = (needle) => names.find((n) => n.toLowerCase().includes(needle));
  if (find("bassin")) lines.push(`- Bassin principal: \`${find("bassin")}\`.`);
  if (find("commune")) lines.push(`- Communes administratives: \`${find("commune")}\`.`);
  if (find("barrages")) lines.push(`- Barrages: \`${find("barrages")}\`.`);
  if (find("stations")) lines.push(`- Stations: \`${find("stations")}\`.`);
  lines.push(`- Bathymétrie: \`public.bathymetries_barrages_abhgzr\`.`);
  return lines.join("\n");
}

function buildQualityMarkdown(quality, tableStats) {
  const lines = [];
  lines.push(`# Analyse qualité`);
  lines.push("");
  lines.push(`## Résumé`);
  lines.push("");
  lines.push(`- Anomalies détectées automatiquement: ${quality.issues.length}`);
  lines.push(`- Tables sans PK: ${quality.issues.filter((i) => i.type === "missing_primary_key").length}`);
  lines.push(`- Tables avec fortes valeurs nulles: ${quality.issues.filter((i) => i.type === "high_null_rate").length}`);
  lines.push(`- Tables spatiales analysées: ${tableStats.filter((t) => t.spatial.length).length}`);
  lines.push("");
  if (!quality.issues.length) {
    lines.push(`Aucune anomalie majeure détectée par les contrôles automatiques.`);
    return lines.join("\n");
  }
  const grouped = groupBy(quality.issues, (i) => i.type);
  for (const [type, items] of grouped.entries()) {
    lines.push(`## ${titleCase(type)}`);
    lines.push("");
    for (const item of items) {
      lines.push(`- ${item.table}${item.column ? `.${item.column}` : ""}: ${escMd(JSON.stringify(item))}`);
    }
    lines.push("");
  }
  lines.push(`## Points de vigilance`);
  lines.push("");
  lines.push(`- Les tables sans clé primaire sont à surveiller pour l'intégrité et les duplications.`);
  lines.push(`- Les colonnes fortement nulles nécessitent une validation métier avant consommation dashboard.`);
  lines.push(`- Les géométries invalides doivent être corrigées avant publication cartographique.`);
  return lines.join("\n");
}

function buildRecommendationsMarkdown(recommendations) {
  const lines = [];
  lines.push(`# Recommandations`);
  lines.push("");
  lines.push(`## Compatibilité dashboard`);
  lines.push("");
  lines.push(`- Climat: exploiter \`public.mesures_temperature_jr_pn\`, \`public.mesures_temperature_m\`, \`public.mesures_humidite_relative_m\`, \`public.mesures_evaporation_m\`, \`public.mesures_precipitations_jr\`, \`public.mesures_vitesse_vent_m\`.`);
  lines.push(`- Hydrologie: exploiter \`public.stations_abhgzr\`, \`public.barrages_abhgzr\`, \`public.bassin_abhgzr\`, \`public.mesures_debits_jr\`, \`public.mesures_lachers_barrages\`, \`public.bathymetries_barrages_abhgzr\`.`);
  lines.push(`- Spatial: exploiter \`public.adm_communes_abhgzr\`, \`public.barrages_abhgzr\`, \`public.bassin_abhgzr\`, \`public.stations_abhgzr\`.`);
  lines.push("");
  lines.push(`## Recommandations prioritaires`);
  lines.push("");
  for (const item of recommendations.items) {
  lines.push(`- [${item.priority}] ${item.topic}: ${item.text}`);
  }
  lines.push("");
  lines.push(`## Schéma cible conseillé`);
  lines.push("");
  lines.push(`- \`dim_station\`, \`dim_variable\`, \`dim_basin\`, \`dim_commune\`, \`dim_date\`, \`dim_measurement_type\``);
  lines.push(`- \`fact_climate_measurements\`, \`fact_hydrology_measurements\`, \`fact_bathymetry\`, \`fact_water_quality\``);
  lines.push(`- \`bridge_station_variable\`, \`bridge_station_basin\`, \`bridge_barrage_measurement\``);
  lines.push("");
  lines.push(`## Synthèse`);
  lines.push("");
  lines.push(`La base est exploitable pour un dashboard hydrologie/climat/spatial, mais elle gagnerait à être normalisée autour de dimensions explicites et de tables de faits de mesure pour simplifier les jointures et les contrôles qualité.`);
  return lines.join("\n");
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
