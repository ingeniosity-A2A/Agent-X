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
  
  // Create Help Assembly catalog table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS help_assembly_catalog (
      sku VARCHAR,
      name VARCHAR,
      category VARCHAR,
      price DECIMAL(10,2),
      inventory INTEGER,
      location VARCHAR,
      last_updated TIMESTAMP
    )
  `);
  
  // Insert Help Assembly catalog data (services + hardware)
  await conn.query(`INSERT OR REPLACE INTO help_assembly_catalog VALUES 
    ('HA-1001', 'Standard Assembly — IKEA KALLAX', 'Services', 75.00, 0, 'Field', CURRENT_TIMESTAMP),
    ('HA-1002', 'Premium Assembly — Murphy Bed', 'Services', 450.00, 0, 'Field', CURRENT_TIMESTAMP),
    ('HA-1003', 'Outdoor Playset Assembly', 'Services', 300.00, 0, 'Field', CURRENT_TIMESTAMP),
    ('HA-1004', 'Commercial Desk Cluster Setup', 'Services', 800.00, 0, 'Field', CURRENT_TIMESTAMP),
    ('HA-2001', 'Cam Lock Kit (50-pk)', 'Hardware', 12.99, 85, 'Van Stock', CURRENT_TIMESTAMP),
    ('HA-2002', 'Dowel Pin Set (8mm, 100-pk)', 'Hardware', 8.50, 120, 'Warehouse', CURRENT_TIMESTAMP),
    ('HA-2003', 'Allen Wrench Set (Metric)', 'Tools', 15.00, 32, 'Van Stock', CURRENT_TIMESTAMP),
    ('HA-2004', 'Moving Blanket (72×80, 12-pk)', 'Supplies', 42.00, 18, 'Warehouse', CURRENT_TIMESTAMP),
    ('HA-2005', 'Furniture Slider Kit', 'Supplies', 22.50, 45, 'Van Stock', CURRENT_TIMESTAMP),
    ('HA-2006', 'Cordless Drill Kit (20V)', 'Tools', 189.00, 8, 'Warehouse', CURRENT_TIMESTAMP),
    ('HA-2007', 'Wall Anchor Kit (50-pk)', 'Hardware', 11.25, 64, 'Van Stock', CURRENT_TIMESTAMP),
    ('HA-2008', 'Wood Glue (16 oz)', 'Supplies', 6.99, 40, 'Warehouse', CURRENT_TIMESTAMP)
  `);
  
  console.log(`%c[HA DuckDB] Help Assembly catalog initialized (12 items)`, `color: ${activeTheme.aqua}`);
  
  return { db, conn };
}

export async function searchCatalog(conn, query, filters = {}) {
  let sql = `SELECT * FROM help_assembly_catalog WHERE 1=1`;
  
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
    `SELECT * FROM help_assembly_catalog WHERE sku = '${sku}' LIMIT 1`
  );
  return results[0] || null;
}

export async function streamCatalogUpdates(conn, catalogUrl) {
  try {
    const response = await fetch(catalogUrl);
    const catalogData = await response.json();
    
    for (const item of catalogData) {
      await conn.query(`
        INSERT OR REPLACE INTO help_assembly_catalog 
        VALUES ('${item.sku}', '${item.name}', '${item.category}', 
                ${item.price}, ${item.inventory}, '${item.location}', 
                CURRENT_TIMESTAMP)
      `);
    }
    
    console.log(`%c[HA DuckDB] Catalog updated: ${catalogData.length} items`, `color: ${activeTheme.green}`);
  } catch (error) {
    console.error(`%c[HA DuckDB] Stream error: ${error.message}`, `color: ${activeTheme.red}`);
  }
}
