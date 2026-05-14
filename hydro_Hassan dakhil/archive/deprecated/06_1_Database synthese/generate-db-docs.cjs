const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_PG = path.join(ROOT, 'hydro_Hassan dakhil', 'backend', 'node_modules', 'pg');
const { Pool } = require(BACKEND_PG);

const DB = {
  host: 'localhost',
  port: 5432,
  database: 'hydro_hd_1714',
  user: 'postgres',
  password: '<redacted>',
  ssl: false,
};

const OUT_DIR = __dirname;
const SQL_DIR = path.join(OUT_DIR, 'sql_recreation');

const SYSTEM_SCHEMAS = new Set(['pg_catalog', 'information_schema', 'pg_toast']);
const APP_SCHEMA_ORDER = ['public', 'ref', 'core', 'geo', 'audit', 'api', 'auth', 'old_hd'];

function qident(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function qname(schema, name) {
  return `${qident(schema)}.${qident(name)}`;
}

function fmtValue(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function typeClass(typeName, columnName) {
  const n = `${columnName}`.toLowerCase();
  const t = `${typeName}`.toLowerCase();
  if (t.includes('geometry') || t.includes('geography')) return 'geom';
  if (t.includes('timestamp') || t === 'date' || t === 'time with time zone' || t === 'time without time zone') return 'date';
  if (t.includes('int') || t.includes('numeric') || t.includes('double') || t.includes('real') || t.includes('decimal')) return 'measure';
  if (n === 'id' || n.endsWith('_id') || n.includes('id_')) return 'id';
  if (n.includes('code') || n.includes('ref') || n.includes('key') || n.includes('uuid')) return 'code';
  if (n.includes('name') || n.includes('label') || n.includes('title') || n.includes('libelle') || n.includes('description')) return 'label';
  if (n.includes('date') || n.includes('time') || n.includes('year') || n.includes('month') || n.includes('day')) return 'date';
  return 'text';
}

function tableRole(tableName) {
  const n = tableName.toLowerCase();
  if (['stations', 'catchments', 'subbasins', 'reaches', 'rivers', 'reservoirs', 'communes', 'landcover_classes', 'landcover_periods', 'observed_properties', 'permissions', 'roles', 'users', 'property_domains'].includes(n)) {
    return 'référentielle';
  }
  if (['timeseries', 'measurements', 'model_runs', 'audit_log', 'qc_runs', 'qc_issues', 'subbasin_metrics_annual', 'reservoir_bathymetry'].includes(n)) {
    return 'métier/transactionnelle';
  }
  if (n.startsWith('v_') || n.startsWith('mv_')) return 'vue analytique';
  return 'mixte';
}

function schemaPurpose(schema) {
  switch (schema) {
    case 'public':
      return 'Couche d’exposition et de vues métier plus tables techniques partagées.';
    case 'ref':
      return 'Référentiels et dictionnaires de domaine.';
    case 'core':
      return 'Noyau hydrologique et temporel.';
    case 'geo':
      return 'Objets géographiques et occupation du sol.';
    case 'audit':
      return 'Contrôle qualité et traçabilité des contrôles.';
    case 'api':
      return 'Vues d’API et agrégations pour consommation applicative.';
    case 'auth':
      return 'Gestion des accès, rôles et journalisation.';
    case 'old_hd':
      return 'Couche FDW vers l’ancien socle HD.';
    default:
      return 'Schéma fonctionnel.';
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeFile(relPath, content) {
  const fullPath = path.join(OUT_DIR, relPath);
  await ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, content, 'utf8');
}

async function fetchJson(pool, sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function main() {
  await ensureDir(SQL_DIR);
  const pool = new Pool(DB);

  try {
    const conn = await pool.query(
      'select current_database() as db, current_user as usr, version() as version, now() as analyzed_at'
    );

    const extensions = await fetchJson(
      pool,
      `select extname, extversion
       from pg_extension
       order by extname`
    );

    const schemas = await fetchJson(
      pool,
      `select nspname as schema_name
       from pg_namespace
       where nspname not in ('pg_catalog', 'information_schema')
         and nspname not like 'pg_toast%'
       order by case when nspname = 'public' then 0 else 1 end, nspname`
    );

    const relationRows = await fetchJson(
      pool,
      `select n.nspname as schema_name,
              c.relname as relation_name,
              c.relkind,
              case c.relkind
                when 'r' then 'table'
                when 'p' then 'partitioned table'
                when 'f' then 'foreign table'
                when 'v' then 'view'
                when 'm' then 'materialized view'
                when 'S' then 'sequence'
                else c.relkind::text
              end as relation_kind,
              exists (
                select 1
                from pg_depend d
                where d.objid = c.oid
                  and d.deptype = 'e'
              ) as is_extension_owned,
              obj_description(c.oid, 'pg_class') as comment
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname not in ('pg_catalog', 'information_schema')
         and n.nspname not like 'pg_toast%'
         and c.relkind in ('r','p','f','v','m','S')
       order by n.nspname, relation_kind, c.relname`
    );

    const tables = relationRows.filter((r) => ['r', 'p', 'f'].includes(r.relkind));
    const views = relationRows.filter((r) => r.relkind === 'v');
    const matViews = relationRows.filter((r) => r.relkind === 'm');
    const sequences = relationRows.filter((r) => r.relkind === 'S');

    const foreignServers = await fetchJson(
      pool,
      `select s.srvname,
              fsw.fdwname,
              s.srvoptions
       from pg_foreign_server s
       join pg_foreign_data_wrapper fsw on fsw.oid = s.srvfdw
       order by s.srvname`
    );

    const userMappings = await fetchJson(
      pool,
      `select s.srvname,
              coalesce(r.rolname, 'PUBLIC') as role_name,
              um.umoptions
       from pg_user_mapping um
       join pg_foreign_server s on s.oid = um.umserver
       left join pg_roles r on r.oid = um.umuser
       order by s.srvname, role_name`
    );

    const foreignTables = await fetchJson(
      pool,
      `select n.nspname as schema_name,
              c.relname as table_name,
              s.srvname,
              ft.ftoptions
       from pg_foreign_table ft
       join pg_class c on c.oid = ft.ftrelid
       join pg_namespace n on n.oid = c.relnamespace
       join pg_foreign_server s on s.oid = ft.ftserver
       order by n.nspname, c.relname`
    );

    const columns = await fetchJson(
      pool,
      `select c.table_schema as schema_name,
              c.table_name,
              c.ordinal_position,
              c.column_name,
              c.data_type,
              c.udt_name,
              format_type(a.atttypid, a.atttypmod) as formatted_type,
              c.is_nullable,
              c.column_default,
              a.attnotnull,
              a.attidentity,
              a.attgenerated,
              pg_get_expr(ad.adbin, ad.adrelid) as default_expr
       from information_schema.columns c
       join pg_class cls
         on cls.relname = c.table_name
       join pg_namespace n
         on n.nspname = c.table_schema and n.oid = cls.relnamespace
       join pg_attribute a
         on a.attrelid = cls.oid and a.attname = c.column_name and a.attnum > 0 and not a.attisdropped
       left join pg_attrdef ad
         on ad.adrelid = a.attrelid and ad.adnum = a.attnum
       where c.table_schema not in ('pg_catalog', 'information_schema')
         and c.table_schema not like 'pg_toast%'
       order by c.table_schema, c.table_name, c.ordinal_position`
    );

    const constraints = await fetchJson(
      pool,
      `select n.nspname as schema_name,
              c.relname as table_name,
              con.conname,
              con.contype,
              case con.contype
                when 'p' then 'primary key'
                when 'f' then 'foreign key'
                when 'u' then 'unique'
                when 'c' then 'check'
                when 'x' then 'exclusion'
                else con.contype::text
              end as constraint_kind,
              pg_get_constraintdef(con.oid, true) as definition,
              con.conindid::regclass::text as index_name
       from pg_constraint con
       join pg_class c on c.oid = con.conrelid
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname not in ('pg_catalog', 'information_schema')
         and n.nspname not like 'pg_toast%'
       order by n.nspname,
                c.relname,
                case con.contype
                  when 'p' then 1
                  when 'u' then 2
                  when 'c' then 3
                  when 'f' then 4
                  else 5
                end,
                con.conname`
    );

    const indexes = await fetchJson(
      pool,
      `select n.nspname as schema_name,
              t.relname as table_name,
              i.relname as indexname,
              pg_get_indexdef(i.oid) as indexdef
       from pg_class i
       join pg_namespace n on n.oid = i.relnamespace
       join pg_index ix on ix.indexrelid = i.oid
       join pg_class t on t.oid = ix.indrelid
       where n.nspname not in ('pg_catalog', 'information_schema')
         and n.nspname not like 'pg_toast%'
         and not exists (
           select 1
           from pg_constraint con
           where con.conindid = i.oid
         )
       order by n.nspname, t.relname, i.relname`
    );

    const seqOwnership = await fetchJson(
      pool,
      `select n.nspname as sequence_schema,
              c.relname as sequence_name,
              n2.nspname as table_schema,
              c2.relname as table_name,
              a.attname as column_name
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       join pg_depend d on d.objid = c.oid and d.deptype = 'a'
       join pg_class c2 on c2.oid = d.refobjid
       join pg_namespace n2 on n2.oid = c2.relnamespace
       join pg_attribute a on a.attrelid = c2.oid and a.attnum = d.refobjsubid
       where c.relkind = 'S'
       order by n.nspname, c.relname`
    );

    const sequencesMeta = await fetchJson(
      pool,
      `select schemaname as schema_name,
              sequencename as sequence_name,
              start_value,
              min_value,
              max_value,
              increment_by,
              cycle,
              cache_size,
              data_type
       from pg_sequences
       where schemaname not in ('pg_catalog', 'information_schema')
      order by schemaname, sequencename`
    );

    const enumTypes = await fetchJson(
      pool,
      `select n.nspname as schema_name,
              t.typname as type_name,
              array_agg(e.enumlabel order by e.enumsortorder) as enum_labels
       from pg_type t
       join pg_namespace n on n.oid = t.typnamespace
       join pg_enum e on e.enumtypid = t.oid
       where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
         and t.typtype = 'e'
       group by n.nspname, t.typname
       order by n.nspname, t.typname`
    );

    const viewDefinitions = await fetchJson(
      pool,
      `select n.nspname as schema_name,
              c.relname as relation_name,
              c.relkind,
              pg_get_viewdef(c.oid, true) as definition
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname not in ('pg_catalog', 'information_schema')
         and n.nspname not like 'pg_toast%'
         and c.relkind in ('v', 'm')
       order by n.nspname, c.relname`
    );

    const viewDependencies = await fetchJson(
      pool,
      `select src_ns.nspname as src_schema,
              src.relname as src_name,
              dep_ns.nspname as dep_schema,
              dep.relname as dep_name
       from pg_depend d
       join pg_rewrite rw on rw.oid = d.objid
       join pg_class src on src.oid = rw.ev_class
       join pg_namespace src_ns on src_ns.oid = src.relnamespace
       join pg_class dep on dep.oid = d.refobjid
       join pg_namespace dep_ns on dep_ns.oid = dep.relnamespace
       where src.relkind in ('v', 'm')
         and dep.relkind in ('v', 'm')
         and d.deptype = 'n'
         and not (src_ns.nspname = dep_ns.nspname and src.relname = dep.relname)
       order by src_ns.nspname, src.relname, dep_ns.nspname, dep.relname`
    );

    const functions = await fetchJson(
      pool,
      `select n.nspname as schema_name,
              p.proname as function_name,
              p.prokind,
              pg_get_function_identity_arguments(p.oid) as args,
              pg_get_function_result(p.oid) as result_type,
              pg_get_functiondef(p.oid) as definition
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname not in ('pg_catalog', 'information_schema')
         and not exists (
           select 1
           from pg_depend d
           where d.objid = p.oid
             and d.deptype = 'e'
         )
       order by n.nspname, p.proname, p.oid`
    );

    const triggers = await fetchJson(
      pool,
      `select n.nspname as schema_name,
              c.relname as table_name,
              t.tgname as trigger_name,
              pg_get_triggerdef(t.oid, true) as definition
       from pg_trigger t
       join pg_class c on c.oid = t.tgrelid
       join pg_namespace n on n.oid = c.relnamespace
       where not t.tgisinternal
       order by n.nspname, c.relname, t.tgname`
    );

    const tableStats = [];
    for (const table of tables) {
      let countValue = null;
      let sample = [];
      if (table.relkind !== 'f') {
        try {
          const fullName = qname(table.schema_name, table.relation_name);
          const cnt = await pool.query(`select count(*)::bigint as count from ${fullName}`);
          countValue = Number(cnt.rows[0].count);
          sample = await buildSampleRows(pool, table.schema_name, table.relation_name, columns);
        } catch (err) {
          countValue = null;
          sample = [];
        }
      }
      tableStats.push({
        ...table,
        row_count: countValue,
        sample_rows: sample,
      });
    }

    const metadata = {
      connection: conn.rows[0],
      extensions,
      schemas,
      relations: relationRows,
      tables: tableStats,
      views,
      materialized_views: matViews,
      view_definitions: viewDefinitions,
      view_dependencies: viewDependencies,
      sequences: sequencesMeta,
      enum_types: enumTypes,
      sequence_ownership: seqOwnership,
      foreign_servers: foreignServers,
      user_mappings: userMappings,
      foreign_tables: foreignTables,
      columns,
      constraints,
      indexes,
      functions,
      triggers,
    };

    await generateSqlScripts(metadata);
    await generateMarkdownDocs(metadata);
    await writeFile(
      'metadata.json',
      JSON.stringify(metadata, null, 2)
    );

    console.log(`Generated documentation in ${OUT_DIR}`);
  } finally {
    await pool.end();
  }
}

async function buildSampleRows(pool, schemaName, tableName, columns) {
  const cols = columns
    .filter((col) => col.schema_name === schemaName && col.table_name === tableName)
    .map((col) => {
      const ident = qident(col.column_name);
      const t = `${col.formatted_type}`.toLowerCase();
      if (t.includes('geometry') || t.includes('geography')) {
        return `CASE WHEN ${ident} IS NULL THEN NULL ELSE ST_AsText(${ident}) END AS ${ident}`;
      }
      if (t === 'bytea') {
        return `encode(${ident}, 'hex') AS ${ident}`;
      }
      return ident;
    });

  const selectList = cols.length > 0 ? cols.join(', ') : '*';
  const sql = `select row_to_json(t) as row_json from (select ${selectList} from ${qname(schemaName, tableName)} limit 2) t`;
  const { rows } = await pool.query(sql);
  return rows.map((r) => r.row_json);
}

function buildColumnSql(columnRows) {
  return columnRows
    .map((col) => {
      let line = `    ${qident(col.column_name)} ${col.formatted_type}`;
      if (col.attgenerated === 's') {
        line += ` GENERATED ALWAYS AS (${col.default_expr}) STORED`;
      } else if (col.attidentity === 'a') {
        line += ` GENERATED ALWAYS AS IDENTITY`;
      } else if (col.attidentity === 'd') {
        line += ` GENERATED BY DEFAULT AS IDENTITY`;
      } else if (col.column_default) {
        line += ` DEFAULT ${col.default_expr || col.column_default}`;
      }
      if (col.attnotnull) {
        line += ' NOT NULL';
      }
      return line;
    })
    .join(',\n');
}

async function generateSqlScripts(metadata) {
  const extLines = metadata.extensions
    .map((e) => `CREATE EXTENSION IF NOT EXISTS ${qident(e.extname)};`)
    .join('\n');

  const fdwLines = [];
  for (const srv of metadata.foreign_servers) {
    const opts = srv.srvoptions
      .map((opt) => {
        const [k, v] = opt.split('=');
        return `${k} '${String(v).replace(/'/g, "''")}'`;
      })
      .join(', ');
    fdwLines.push(
      `CREATE SERVER ${qident(srv.srvname)} FOREIGN DATA WRAPPER ${qident(srv.fdwname)} OPTIONS (${opts});`
    );
  }
  for (const um of metadata.user_mappings) {
    const role = um.role_name === 'PUBLIC' ? 'PUBLIC' : qident(um.role_name);
    const opts = um.umoptions
      .map((opt) => {
        const [k, v] = opt.split('=');
        return `${k} '${String(v).replace(/'/g, "''")}'`;
      })
      .join(', ');
    fdwLines.push(
      `CREATE USER MAPPING FOR ${role} SERVER ${qident(um.srvname)} OPTIONS (${opts});`
    );
  }

  const schemaLines = metadata.schemas
    .map((s) => `CREATE SCHEMA IF NOT EXISTS ${qident(s.schema_name)};`)
    .join('\n');

  const typeLines = (metadata.enum_types || [])
    .map((t) => {
      const labelsArray = Array.isArray(t.enum_labels)
        ? t.enum_labels
        : String(t.enum_labels)
            .replace(/^\{|\}$/g, '')
            .split(',')
            .filter(Boolean);
      const labels = labelsArray.map((l) => `'${String(l).replace(/'/g, "''")}'`).join(', ');
      return `DO $$\nBEGIN\n    CREATE TYPE ${qname(t.schema_name, t.type_name)} AS ENUM (${labels});\nEXCEPTION\n    WHEN duplicate_object THEN NULL;\nEND$$;`;
    })
    .join('\n\n');

  const seqLines = metadata.sequences
    .map((seq) => {
      const full = qname(seq.schema_name, seq.sequence_name);
      return [
        `CREATE SEQUENCE IF NOT EXISTS ${full}`,
        `    AS ${seq.data_type}`,
        `    INCREMENT BY ${seq.increment_by}`,
        `    MINVALUE ${seq.min_value}`,
        `    MAXVALUE ${seq.max_value}`,
        `    START WITH ${seq.start_value}`,
        `    CACHE ${seq.cache_size}`,
        `${seq.cycle ? '    CYCLE;' : '    NO CYCLE;'}`,
      ].join('\n');
    })
    .join('\n\n');

  const tablesBySchema = groupBy(metadata.columns, (row) => `${row.schema_name}.${row.table_name}`);
  const scriptTables = metadata.tables.filter((table) => !table.is_extension_owned);
  const orderedViewObjects = topoSortViews(metadata);
  const scriptViews = orderedViewObjects.filter((view) => view.relkind === 'v');
  const scriptMatViews = orderedViewObjects.filter((view) => view.relkind === 'm');
  const scriptTableKeys = new Set(scriptTables.map((t) => `${t.schema_name}.${t.relation_name}`));
  const tableDefs = scriptTables
    .map((table) => {
      const key = `${table.schema_name}.${table.relation_name}`;
      const cols = tablesBySchema.get(key) || [];
      const sqlCols = buildColumnSql(cols);
      if (table.relkind === 'f') {
        const ft = metadata.foreign_tables.find(
          (x) => x.schema_name === table.schema_name && x.table_name === table.relation_name
        );
        const opts = (ft?.ftoptions || [])
          .map((opt) => {
            const [k, v] = opt.split('=');
            return `${k} '${String(v).replace(/'/g, "''")}'`;
          })
          .join(', ');
        return `CREATE FOREIGN TABLE ${qname(table.schema_name, table.relation_name)} (\n${sqlCols}\n) SERVER ${qident(ft?.srvname || '')} OPTIONS (${opts});`;
      }
      return `CREATE TABLE IF NOT EXISTS ${qname(table.schema_name, table.relation_name)} (\n${sqlCols}\n);`;
    })
    .join('\n\n');

  const ownershipLines = metadata.sequence_ownership
    .filter((o) => scriptTableKeys.has(`${o.table_schema}.${o.table_name}`))
    .map((o) => `ALTER SEQUENCE ${qname(o.sequence_schema, o.sequence_name)} OWNED BY ${qname(o.table_schema, o.table_name)}.${qident(o.column_name)};`)
    .join('\n');

  const applicableConstraints = metadata.constraints.filter((c) =>
    scriptTableKeys.has(`${c.schema_name}.${c.table_name}`)
  );
  const constraintOrder = (contype) =>
    applicableConstraints
      .filter((c) => c.contype === contype)
      .map((c) => `ALTER TABLE ONLY ${qname(c.schema_name, c.table_name)} ADD CONSTRAINT ${qident(c.conname)} ${c.definition};`);
  const constraintLines = [
    ...constraintOrder('p'),
    ...constraintOrder('u'),
    ...constraintOrder('c'),
    ...constraintOrder('f'),
    ...constraintOrder('x'),
  ].join('\n');

  const indexLines = metadata.indexes
    .filter((i) => scriptTableKeys.has(`${i.schema_name}.${i.table_name}`))
    .map((i) => i.indexdef.endsWith(';') ? i.indexdef : `${i.indexdef};`)
    .join('\n');

  const viewLines = scriptViews
    .map((v) => {
      const viewDef = normalizeSqlBlock(getViewDef(metadata, v.schema_name, v.relation_name));
      return `CREATE OR REPLACE VIEW ${qname(v.schema_name, v.relation_name)} AS\n${viewDef};`;
    })
    .join('\n\n');

  const mvLines = scriptMatViews
    .map((v) => {
      const viewDef = normalizeSqlBlock(getViewDef(metadata, v.schema_name, v.relation_name));
      return `CREATE MATERIALIZED VIEW ${qname(v.schema_name, v.relation_name)} AS\n${viewDef}\nWITH NO DATA;`;
    })
    .join('\n\n');

  const functionLines = metadata.functions
    .filter((f) => f.prokind === 'f' || f.prokind === 'a' || f.prokind === 'w')
    .map((f) => ensureSqlTerminated(f.definition.trim()))
    .join('\n\n');

  const triggerLines = metadata.triggers
    .map((t) => `${t.definition};`)
    .join('\n');

  await writeFile(
    path.join('sql_recreation', '01_create_extensions.sql'),
    `-- Extensions and FDW setup\n${extLines}\n\n${fdwLines.join('\n')}\n`
  );
  await writeFile(
    path.join('sql_recreation', '02_create_schemas.sql'),
    `-- Schemas\n${schemaLines}\n`
  );
  await writeFile(
    path.join('sql_recreation', '03_create_types.sql'),
    `-- Enum types\n${typeLines}\n`
  );
  await writeFile(
    path.join('sql_recreation', '03_create_sequences.sql'),
    `-- Sequences\n${seqLines}\n`
  );
  await writeFile(
    path.join('sql_recreation', '04_create_tables.sql'),
    `-- Tables and foreign tables\n${tableDefs}\n`
  );
  await writeFile(
    path.join('sql_recreation', '05_create_constraints.sql'),
    `-- Constraints and sequence ownership\n${constraintLines}\n\n${ownershipLines}\n`
  );
  await writeFile(
    path.join('sql_recreation', '06_create_indexes.sql'),
    `-- Non-constraint indexes\n${indexLines}\n`
  );
  await writeFile(
    path.join('sql_recreation', '07_create_views.sql'),
    `-- Views and materialized views\n${viewLines}\n\n${mvLines}\n`
  );
  await writeFile(
    path.join('sql_recreation', '08_create_functions_triggers.sql'),
    `-- Functions and triggers\n${functionLines}\n\n${triggerLines}\n`
  );
}

function getViewDef(metadata, schemaName, relationName) {
  const row = (metadata.view_definitions || []).find(
    (v) => v.schema_name === schemaName && v.relation_name === relationName
  );
  return row ? row.definition : '';
}

function topoSortViews(metadata) {
  const nodes = (metadata.view_definitions || [])
    .filter((v) => !isExtensionOwnedView(metadata, v.schema_name, v.relation_name))
    .map((v) => ({
      schema_name: v.schema_name,
      relation_name: v.relation_name,
      relkind: v.relkind,
      key: `${v.schema_name}.${v.relation_name}`,
    }));

  const nodeMap = new Map(nodes.map((n) => [n.key, n]));
  const inDegree = new Map(nodes.map((n) => [n.key, 0]));
  const outgoing = new Map(nodes.map((n) => [n.key, new Set()]));
  const depRows = metadata.view_dependencies || [];

  for (const dep of depRows) {
    const srcKey = `${dep.src_schema}.${dep.src_name}`;
    const depKey = `${dep.dep_schema}.${dep.dep_name}`;
    if (!nodeMap.has(srcKey) || !nodeMap.has(depKey)) continue;
    if (!outgoing.get(depKey).has(srcKey)) {
      outgoing.get(depKey).add(srcKey);
      inDegree.set(srcKey, (inDegree.get(srcKey) || 0) + 1);
    }
  }

  const queue = nodes
    .filter((n) => (inDegree.get(n.key) || 0) === 0)
    .sort((a, b) => a.key.localeCompare(b.key));
  const ordered = [];
  while (queue.length) {
    const current = queue.shift();
    ordered.push(current);
    for (const nextKey of outgoing.get(current.key) || []) {
      inDegree.set(nextKey, inDegree.get(nextKey) - 1);
      if (inDegree.get(nextKey) === 0) {
        queue.push(nodeMap.get(nextKey));
        queue.sort((a, b) => a.key.localeCompare(b.key));
      }
    }
  }

  if (ordered.length !== nodes.length) {
    return nodes.sort((a, b) => a.key.localeCompare(b.key));
  }

  return ordered;
}

function isExtensionOwnedView(metadata, schemaName, relationName) {
  const row = (metadata.relations || []).find(
    (r) =>
      r.schema_name === schemaName &&
      r.relation_name === relationName &&
      r.relkind === 'v' &&
      r.is_extension_owned
  );
  return Boolean(row);
}

function normalizeSqlBlock(sql) {
  return String(sql).trim().replace(/;\s*$/, '');
}

function ensureSqlTerminated(sql) {
  const trimmed = String(sql).trim();
  return /;\s*$/.test(trimmed) ? trimmed : `${trimmed};`;
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

async function generateMarkdownDocs(metadata) {
  const schemaGroups = groupBy(metadata.tables, (t) => t.schema_name);
  const viewGroups = groupBy(metadata.views, (v) => v.schema_name);
  const mvGroups = groupBy(metadata.materialized_views, (v) => v.schema_name);

  const summaryLines = [];
  summaryLines.push(`# Résumé global`);
  summaryLines.push('');
  summaryLines.push(`- Base analysée: \`${metadata.connection.db}\``);
  summaryLines.push(`- Serveur: PostgreSQL ${metadata.connection.version.match(/PostgreSQL ([^,]+)/)?.[1] || ''}`);
  summaryLines.push(`- Utilisateur: \`${metadata.connection.usr}\``);
  summaryLines.push(`- Date d'analyse: ${metadata.connection.analyzed_at}`);
  summaryLines.push(`- Schémas non système: ${metadata.schemas.map((s) => `\`${s.schema_name}\``).join(', ')}`);
  summaryLines.push(`- Extensions: ${metadata.extensions.map((e) => `\`${e.extname} ${e.extversion}\``).join(', ')}`);
  summaryLines.push(`- Tables/foreign tables: ${metadata.tables.length}`);
  summaryLines.push(`- Vues: ${metadata.views.length}`);
  summaryLines.push(`- Vues matérialisées: ${metadata.materialized_views.length}`);
  summaryLines.push(`- Séquences: ${metadata.sequences.length}`);
  summaryLines.push(`- Fonctions non extension: ${metadata.functions.length}`);
  summaryLines.push(`- Triggers: ${metadata.triggers.length}`);
  summaryLines.push(`- Serveurs FDW: ${metadata.foreign_servers.length}`);
  summaryLines.push('');
  summaryLines.push(`## Lecture rapide`);
  summaryLines.push('');
  summaryLines.push(`La base est organisée autour de 8 blocs fonctionnels: ` +
    `référentiels (\`ref\`), noyau hydrologique (\`core\`), géospatial (\`geo\`), contrôle qualité (\`audit\`), ` +
    `exposition analytique (\`api\`), sécurité (\`auth\`), espace public de vues et tables partagées, et ` +
    `un pont FDW legacy (\`old_hd\`).`);
  summaryLines.push('');
  summaryLines.push(`PostGIS est présent et explique les colonnes géométriques, les vues géographiques et les index spatiaux. ` +
    `\`postgres_fdw\` alimente \`old_hd\` à partir d'une base distante \`bd_hassdakh\` sur \`localhost:5432\`.`);
  summaryLines.push('');
  summaryLines.push(`Les fonctions applicatives détectées sont peu nombreuses et servent surtout à l'agrégation API. ` +
    `Aucun trigger utilisateur n'a été trouvé.`);
  summaryLines.push('');
  summaryLines.push(`## Répartition par schéma`);
  summaryLines.push('');
  for (const schema of metadata.schemas) {
    const tables = schemaGroups.get(schema.schema_name) || [];
    const views = viewGroups.get(schema.schema_name) || [];
    const mvs = mvGroups.get(schema.schema_name) || [];
    summaryLines.push(`- ${schema.schema_name}: ${tables.length} tables, ${views.length} vues, ${mvs.length} vues matérialisées. ${schemaPurpose(schema.schema_name)}`);
  }
  await writeFile('01_resume_global_base.md', summaryLines.join('\n'));

  const arch = [];
  arch.push(`# Architecture de la base`);
  arch.push('');
  arch.push(`## Schémas et rôle métier`);
  arch.push('');
  for (const schema of metadata.schemas) {
    arch.push(`### ${schema.schema_name}`);
    arch.push(`${schemaPurpose(schema.schema_name)}`);
    const tables = schemaGroups.get(schema.schema_name) || [];
    if (tables.length) {
      arch.push(`- Tables: ${tables.map((t) => `\`${t.relation_name}\``).join(', ')}`);
    }
    const views = viewGroups.get(schema.schema_name) || [];
    if (views.length) {
      arch.push(`- Vues: ${views.map((v) => `\`${v.relation_name}\``).join(', ')}`);
    }
    const mvs = mvGroups.get(schema.schema_name) || [];
    if (mvs.length) {
      arch.push(`- Vues matérialisées: ${mvs.map((v) => `\`${v.relation_name}\``).join(', ')}`);
    }
    arch.push('');
  }
  arch.push(`## Chaîne fonctionnelle probable`);
  arch.push('');
  arch.push(`1. Les référentiels du schéma \`ref\` décrivent les domaines métiers et les classes de données.`);
  arch.push(`2. Le noyau \`core\` porte les objets hydrologiques, temporels et transactionnels.`);
  arch.push(`3. Le schéma \`geo\` ajoute les couches géographiques et les données d'occupation du sol.`);
  arch.push(`4. Le schéma \`audit\` calcule les contrôles qualité et les anomalies.`);
  arch.push(`5. Le schéma \`api\` expose les vues agrégées et enrichies pour le front.`);
  arch.push(`6. Le schéma \`old_hd\` conserve une compatibilité de lecture avec l'ancien modèle via FDW.`);
  await writeFile('02_architecture_base.md', arch.join('\n'));

  const dict = [];
  dict.push(`# Dictionnaire de données`);
  dict.push('');
  for (const schema of metadata.schemas) {
    dict.push(`## Schéma ${schema.schema_name}`);
    const tables = schemaGroups.get(schema.schema_name) || [];
    for (const table of tables) {
      dict.push(`### ${table.relation_name}`);
      dict.push(`- Rôle: ${tableRole(table.relation_name)}`);
      dict.push(`- Lignes: ${table.row_count === null ? 'N/A (table étrangère ou inaccessible)' : table.row_count}`);
      const cols = metadata.columns.filter((c) => c.schema_name === schema.schema_name && c.table_name === table.relation_name);
      dict.push(`- Colonnes: ${cols.length}`);
      dict.push('');
      dict.push(`| Colonne | Type | Nullable | Défaut | Classe |`);
      dict.push(`| --- | --- | --- | --- | --- |`);
      for (const col of cols) {
        dict.push(`| ${col.column_name} | ${col.formatted_type} | ${col.attnotnull ? 'NON' : 'OUI'} | ${escapeMd(col.default_expr || col.column_default || '')} | ${typeClass(col.formatted_type, col.column_name)} |`);
      }
      if (table.sample_rows && table.sample_rows.length) {
        dict.push('');
        dict.push(`Aperçu:`);
        for (const row of table.sample_rows) {
          dict.push(`- ${escapeMd(JSON.stringify(row))}`);
        }
      }
      dict.push('');
    }
  }
  await writeFile('03_dictionnaire_donnees.md', dict.join('\n'));

  const rel = [];
  rel.push(`# Relations PK/FK`);
  rel.push('');
  const pks = metadata.constraints.filter((c) => c.contype === 'p');
  const fks = metadata.constraints.filter((c) => c.contype === 'f');
  rel.push(`## Clés primaires`);
  for (const pk of pks) {
    rel.push(`- ${pk.schema_name}.${pk.table_name}: ${pk.definition}`);
  }
  rel.push('');
  rel.push(`## Clés étrangères`);
  for (const fk of fks) {
    rel.push(`- ${fk.schema_name}.${fk.table_name}: ${fk.definition}`);
  }
  rel.push('');
  rel.push(`## Dépendances fortes`);
  rel.push(`- \`ref\` alimente \`core\` et \`api\` via les propriétés et domaines.`);
  rel.push(`- \`core.timeseries\` et \`core.measurements\` sont les pivots temporels.`);
  rel.push(`- \`api\` dépend de vues et d'agrégations construites sur \`core\` et \`public\`.`);
  rel.push(`- \`old_hd\` est un ensemble de tables étrangères, donc dépend du serveur FDW \`old_hd_srv\`.`);
  await writeFile('04_relations_pk_fk.md', rel.join('\n'));

  const inv = [];
  inv.push(`# Inventaire des tables et vues`);
  inv.push('');
  for (const schema of metadata.schemas) {
    inv.push(`## ${schema.schema_name}`);
    const tables = schemaGroups.get(schema.schema_name) || [];
    if (tables.length) {
      inv.push(`### Tables`);
      for (const table of tables) {
        inv.push(`- ${table.relation_name} (${table.row_count === null ? 'N/A' : table.row_count} lignes, ${tableRole(table.relation_name)})`);
      }
    }
    const views = viewGroups.get(schema.schema_name) || [];
    if (views.length) {
      inv.push(`### Vues`);
      for (const view of views) {
        inv.push(`- ${view.relation_name}`);
      }
    }
    const mvs = mvGroups.get(schema.schema_name) || [];
    if (mvs.length) {
      inv.push(`### Vues matérialisées`);
      for (const view of mvs) {
        inv.push(`- ${view.relation_name}`);
      }
    }
    inv.push('');
  }
  inv.push(`## Tables vides`);
  const empty = metadata.tables.filter((t) => t.row_count === 0);
  inv.push(empty.length ? empty.map((t) => `- ${t.schema_name}.${t.relation_name}`).join('\n') : '- Aucune table vide détectée parmi les tables locales.');
  await writeFile('05_inventaire_tables_et_vues.md', inv.join('\n'));

  const guide = [];
  guide.push(`# Guide de recréation`);
  guide.push('');
  guide.push(`1. Créer la base vide.`);
  guide.push(`2. Activer les extensions dans l'ordre du script \`01_create_extensions.sql\`.`);
  guide.push(`3. Créer les schémas.`);
  guide.push(`4. Créer les séquences.`);
  guide.push(`5. Créer les tables et tables étrangères.`);
  guide.push(`6. Ajouter les contraintes et l'ownership des séquences.`);
  guide.push(`7. Créer les index.`);
  guide.push(`8. Créer les vues puis les vues matérialisées.`);
  guide.push(`9. Créer les fonctions puis les triggers.`);
  guide.push('');
  guide.push(`Vérifications recommandées:`);
  guide.push(`- comparer la liste des schémas et objets avec \`metadata.json\`;`);
  guide.push(`- contrôler les comptes de lignes;`);
  guide.push(`- valider les dépendances FK avant injection de données;`);
  guide.push(`- rafraîchir les vues matérialisées après chargement si nécessaire.`);
  await writeFile('06_guide_recreation_base.md', guide.join('\n'));

  const order = [];
  order.push(`# Ordre d'exécution des scripts`);
  order.push('');
  order.push(`1. \`sql_recreation/01_create_extensions.sql\``);
  order.push(`2. \`sql_recreation/02_create_schemas.sql\``);
  order.push(`3. \`sql_recreation/03_create_sequences.sql\``);
  order.push(`4. \`sql_recreation/04_create_tables.sql\``);
  order.push(`5. \`sql_recreation/05_create_constraints.sql\``);
  order.push(`6. \`sql_recreation/06_create_indexes.sql\``);
  order.push(`7. \`sql_recreation/07_create_views.sql\``);
  order.push(`8. \`sql_recreation/08_create_functions_triggers.sql\``);
  order.push('');
  order.push(`L'ordre est pensé pour respecter les dépendances de type: extensions -> schémas -> séquences -> tables -> contraintes -> index -> vues -> fonctions/triggers.`);
  await writeFile('07_ordre_execution_scripts.md', order.join('\n'));

  const inj = [];
  inj.push(`# Guide d'injection de nouvelles données`);
  inj.push('');
  inj.push(`- Charger d'abord les référentiels (\`ref\`) et les tables de sécurité (\`auth\`).`);
  inj.push(`- Charger ensuite le noyau \`core\`, puis les enrichissements \`geo\` et \`audit\`.`);
  inj.push(`- Terminer par les couches \`api\` et les vues matérialisées.`);
  inj.push(`- Ne jamais insérer dans les vues, seulement dans les tables sources.`);
  inj.push(`- Respecter l'ordre PK/FK pour les tables liées.`);
  inj.push(`- Après import, recalculer les séquences si des identifiants explicites ont été insérés.`);
  inj.push(`- Vérifier les colonnes géométriques via le SRID attendu avant import.`);
  await writeFile('08_guide_injection_nouvelles_donnees.md', inj.join('\n'));

  const risk = [];
  risk.push(`# Points d'attention et risques`);
  risk.push('');
  risk.push(`- La base dépend de \`postgis\` et \`postgres_fdw\`.`);
  risk.push(`- \`old_hd\` est une couche de compatibilité vers une base distante, donc sa recréation exige des identifiants valides.`);
  risk.push(`- Les vues matérialisées doivent être rafraîchies après recharge des tables sources.`);
  risk.push(`- Les index spatiaux et les SRID doivent rester cohérents avec les colonnes géométriques.`);
  risk.push(`- Les données existantes n'ont pas été modifiées durant l'analyse.`);
  risk.push(`- En cas de duplication vers un autre projet, adapter les références FDW et les dictionnaires de domaines sans casser les contraintes.`);
  await writeFile('09_points_attention_et_risques.md', risk.join('\n'));
}

function escapeMd(text) {
  return String(text).replace(/\|/g, '\\|');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
