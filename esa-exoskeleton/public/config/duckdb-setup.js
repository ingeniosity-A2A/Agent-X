import { activeTheme } from './gruvbox-colors.js';

export async function initDuckDB() {
  const duckdb = await import('@duckdb/duckdb-wasm');
  
  const JSDELIVRBundles = new duckdb.DuckDBBundles();
  JSDELIVRBundles.mainModule = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-mvp.wasm';
  JSDELIVRBundles.mainWorker = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-mvp.worker.js';
  
  await duckdb.instantiate(JSDELIVRBundles);
  const db = new duckdb.AsyncDuckDB();
  await db.instantiate(JSDELIVRBundles.mainModule, JSDELIVRBundles.mainWorker);
  
  const conn = await db.connect();
  
  // Create HD Supply catalog table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS hd_supply_catalog (
      sku VARCHAR,
      name VARCHAR,
      category VARCHAR,
      price DECIMAL(10,2),
      inventory INTEGER,
      location VARCHAR,
      last_updated TIMESTAMP
    )
  `);
  
  // Insert existing HD Supply catalog data (4 parts)
  await conn.query(`INSERT OR REPLACE INTO hd_supply_catalog VALUES 
    ('HD-4421', 'Seasons 9000 BTU PTAC Unit', 'PTAC Units', 899.00, 15, 'Warehouse A', CURRENT_TIMESTAMP),
    ('HD-1180', 'PTAC Subbase 20A', 'Accessories', 45.00, 42, 'Warehouse B', CURRENT_TIMESTAMP),
    ('HD-9033', 'Double Packed Filter', 'Filters', 12.50, 150, 'Warehouse A', CURRENT_TIMESTAMP),
    ('HD-2205', 'Wireless Thermostat', 'Controls', 159.00, 28, 'Warehouse C', CURRENT_TIMESTAMP)
  `);
  
  console.log(`%c[ESA DuckDB] HD Supply catalog initialized (4 parts)`, `color: ${activeTheme.aqua}`);
  
  return { db, conn };
}

export async function searchCatalog(conn, query, filters = {}) {
  let sql = `SELECT * FROM hd_supply_catalog WHERE 1=1`;
  
  if (query) {
    sql += ` AND (name ILIKE '%${query}%' OR sku ILIKE '%${query}%')`;
  }
  
  if (filters.category) {
    sql += ` AND category = '${filters.category}'`;
  }
  
  sql += ` ORDER BY last_updated DESC LIMIT 100`;
  
  const results = await conn.query(sql);
  return results;
}

export async function getPartBySKU(conn, sku) {
  const results = await conn.query(
    `SELECT * FROM hd_supply_catalog WHERE sku = '${sku}' LIMIT 1`
  );
  return results[0] || null;
}

export async function streamCatalogUpdates(conn, catalogUrl) {
  try {
    const response = await fetch(catalogUrl);
    const catalogData = await response.json();
    
    for (const item of catalogData) {
      await conn.query(`
        INSERT OR REPLACE INTO hd_supply_catalog 
        VALUES ('${item.sku}', '${item.name}', '${item.category}', 
                ${item.price}, ${item.inventory}, '${item.location}', 
                CURRENT_TIMESTAMP)
      `);
    }
    
    console.log(`%c[ESA DuckDB] Catalog updated: ${catalogData.length} items`, `color: ${activeTheme.green}`);
  } catch (error) {
    console.error(`%c[ESA DuckDB] Stream error: ${error.message}`, `color: ${activeTheme.red}`);
  }
}
