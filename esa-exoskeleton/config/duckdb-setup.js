/**
 * DuckDB WASM Setup for ESA EXOSKELETON
 * 
 * ⚠️ USES EXISTING DATA - Does not recreate catalog
 * 
 * Existing data sources:
 * - platform/db/custom.db (SQLite with content)
 * - platform/src/lib/inventory-store.ts (HD Supply catalog pre-seeded)
 * 
 * This module initializes DuckDB WASM and loads the
 * EXISTING HD Supply catalog (4 parts already defined).
 */

let dbInstance = null;
let connection = null;
let initialized = false;

// ============================================
// EXISTING HD SUPPLY CATALOG (from inventory-store.ts)
// DO NOT MODIFY - this is the live catalog data
// ============================================
const EXISTING_HD_SUPPLY_CATALOG = [
  {
    sku: "HD-4421",
    name: "Bath tissue 2-ply case",
    barcode: "000442100001",
    unit: "case",
    vendor: "HD Supply",
    catalogUrl: "https://hdsupplysolutions.com",
    location: "Housekeeping",
    category: "Janitorial",
    quantity: 12,
    price: 45.99,
    status: "in_stock"
  },
  {
    sku: "HD-1180",
    name: "LED A19 60W equiv bulb 6-pack",
    barcode: "000118000006",
    unit: "pack",
    vendor: "HD Supply",
    catalogUrl: "https://hdsupplysolutions.com",
    location: "Maintenance",
    category: "Electrical",
    quantity: 8,
    price: 24.99,
    status: "in_stock"
  },
  {
    sku: "HD-9033",
    name: "HVAC filter 20x25x1 MERV-8",
    barcode: "000903300001",
    unit: "each",
    vendor: "HD Supply",
    catalogUrl: "https://hdsupplysolutions.com",
    location: "Mechanical",
    category: "HVAC",
    quantity: 4,
    price: 18.50,
    status: "low"
  },
  {
    sku: "HD-2205",
    name: "Toilet fill valve universal",
    barcode: "000220500001",
    unit: "each",
    vendor: "HD Supply",
    catalogUrl: "https://hdsupplysolutions.com",
    location: "Plumbing",
    category: "Plumbing",
    quantity: 0,
    price: 12.75,
    status: "out_of_stock"
  }
];

/**
 * Initialize DuckDB WASM with EXISTING catalog data
 * Does not download or recreate anything
 */
export async function initDuckDB() {
  // Return existing instance if already initialized
  if (initialized && dbInstance && connection) {
    console.log('%c[ESA.DuckDB] ✓ Already initialized with existing catalog', 'color: #689d6a');
    return { db: dbInstance, conn: connection, catalogSize: EXISTING_HD_SUPPLY_CATALOG.length };
  }

  console.log('%c[ESA.DuckDB] Initializing DuckDB WASM with EXISTING catalog...', 'color: #689d6a');
  logToConsole('[ESA.DuckDB] Loading existing HD Supply catalog (' + EXISTING_HD_SUPPLY_CATALOG.length + ' items)...', 'info');

  try {
    // Dynamic import of DuckDB WASM
    const duckdbModule = await import('https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/+esm');
    const duckdb = duckdbModule.default || duckdbModule;

    // Get the bundled files from CDN
    const JSDELIVR_CDN = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist';
    
    // Select bundle based on platform
    const bundle = await duckdb.selectBundle({
      mvp: {
        main: `${JSDELIVR_CDN}/duckdb-mvp.wasm`,
        worker: `${JSDELIVR_CDN}/duckdb-mvp-browser.mjs`
      },
      eh: {
        main: `${JSDELIVR_CDN}/duckdb-eh.wasm`,
        worker: `${JSDELIVR_CDN}/duckdb-eh-browser.mjs`
      }
    });

    // Create worker
    const worker = await duckdb.createWorker(bundle.mainWorker);

    // Create async database instance
    dbInstance = new duckdb.AsyncDuckDB(worker, bundle.main);
    await dbInstance.instantiate(bundle.main);

    // Open connection
    connection = await dbInstance.connect();

    // ============================================
    // LOAD EXISTING CATALOG (not recreating)
    // ============================================
    await loadExistingCatalog();

    initialized = true;

    console.log('%c[ESA.DuckDB] ✓ Ready with existing catalog (' + EXISTING_HD_SUPPLY_CATALOG.length + ' items)', 'color: #98971a');
    logToConsole('[ESA.DuckDB] ✓ Existing catalog loaded successfully', 'success');
    logToConsole('[ESA.DuckDB] Source: platform/src/lib/inventory-store.ts', 'info');

    return { 
      db: dbInstance, 
      conn: connection, 
      catalogSize: EXISTING_HD_SUPPLY_CATALOG.length,
      catalogSource: 'existing'
    };

  } catch (error) {
    console.error('%c[ESA.DuckDB] Initialization failed:', 'color: #cc241d', error);
    logToConsole(`[ESA.DuckDB] Error: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Load the EXISTING HD Supply catalog into DuckDB
 * This does NOT download or fetch - uses predefined data
 */
async function loadExistingCatalog() {
  // Create catalog table schema (matches existing inventory-store.ts structure)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS hd_supply_catalog (
      sku VARCHAR PRIMARY KEY,
      name VARCHAR,
      barcode VARCHAR,
      unit VARCHAR,
      vendor VARCHAR,
      catalog_url VARCHAR,
      location VARCHAR,
      category VARCHAR,
      quantity INTEGER,
      price DOUBLE,
      status VARCHAR,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check if catalog already has data
  const existingCount = await connection.query('SELECT COUNT(*) as count FROM hd_supply_catalog');
  const count = existingCount.toArray()[0].count;

  if (count > 0) {
    console.log('%c[ESA.DuckDB] Catalog already has data (' + count + ' items), skipping load', 'color: #d79921');
    logToConsole('[ESA.DuckDB] Catalog already populated (' + count + ' items)', 'warning');
    return count;
  }

  // Insert EXISTING catalog data (no download, no recreation)
  for (const part of EXISTING_HD_SUPPLY_CATALOG) {
    await connection.query(`
      INSERT INTO hd_supply_catalog (sku, name, barcode, unit, vendor, catalog_url, location, category, quantity, price, status)
      VALUES (
        '${part.sku}',
        '${part.name.replace(/'/g, "''")}',
        '${part.barcode}',
        '${part.unit}',
        '${part.vendor}',
        '${part.catalogUrl}',
        '${part.location}',
        '${part.category}',
        ${part.quantity},
        ${part.price},
        '${part.status}'
      )
    `);
  }

  console.log('%c[ESA.DuckDB] ✓ Loaded ' + EXISTING_HD_SUPPLY_CATALOG.length + ' items from existing catalog', 'color: #98971a');
  return EXISTING_HD_SUPPLY_CATALOG.length;
}

/**
 * Execute SQL query against DuckDB
 */
export async function queryDuckDB(sql) {
  if (!connection) {
    throw new Error('DuckDB not initialized. Call initDuckDB() first.');
  }

  try {
    const result = await connection.query(sql);
    console.log('%c[ESA.DuckDB] Query executed:', 'color: #458588', sql);
    return result;
  } catch (error) {
    console.error('%c[ESA.DuckDB] Query error:', 'color: '#cc241d', error);
    throw error;
  }
}

/**
 * Search parts in the EXISTING catalog
 */
export async function searchParts(searchTerm) {
  const results = await queryDuckDB(`
    SELECT * FROM hd_supply_catalog 
    WHERE name LIKE '%${searchTerm}%' 
       OR sku LIKE '%${searchTerm}%'
       OR category LIKE '%${searchTerm}%'
       OR location LIKE '%${searchTerm}%'
    LIMIT 50
  `);
  
  return results.toArray();
}

/**
 * Get all parts from existing catalog
 */
export async function getAllParts() {
  const results = await queryDuckDB(`
    SELECT * FROM hd_supply_catalog ORDER BY name
  `);
  
  return results.toArray();
}

/**
 * Get part by SKU from existing catalog
 */
export async function getPartBySKU(sku) {
  const results = await queryDuckDB(`
    SELECT * FROM hd_supply_catalog WHERE sku = '${sku}'
  `);
  
  const arr = results.toArray();
  return arr.length > 0 ? arr[0] : null;
}

/**
 * Update quantity for a part (syncs with inventory-store concept)
 */
export async function updatePartQuantity(sku, newQuantity) {
  await queryDuckDB(`
    UPDATE hd_supply_catalog 
    SET quantity = ${newQuantity},
        status = CASE 
          WHEN ${newQuantity} <= 0 THEN 'out_of_stock'
          WHEN ${newQuantity} <= 3 THEN 'low'
          ELSE 'in_stock'
        END,
        last_updated = CURRENT_TIMESTAMP
    WHERE sku = '${sku}'
  `);
  
  logToConsole(`[ESA.DuckDB] Updated ${sku} quantity to ${newQuantity}`, 'success');
  return getPartBySKU(sku);
}

/**
 * Get catalog statistics
 */
export async function getCatalogStats() {
  const results = await queryDuckDB(`
    SELECT 
      COUNT(*) as total_items,
      SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as in_stock,
      SUM(CASE WHEN status = 'low' THEN 1 ELSE 0 END) as low_stock,
      SUM(CASE WHEN status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock,
      SUM(quantity) as total_quantity,
      SUM(price * quantity) as total_value
    FROM hd_supply_catalog
  `);
  
  return results.toArray()[0];
}

/**
 * Close DuckDB connection
 */
export async function closeDuckDB() {
  if (connection) {
    await connection.close();
    connection = null;
  }
  if (dbInstance) {
    await dbInstance.terminate();
    dbInstance = null;
  }
  initialized = false;
  console.log('%c[ESA.DuckDB] Connection closed', 'color: #a89984');
}

/**
 * Check if DuckDB is initialized
 */
export function isInitialized() {
  return initialized;
}

/**
 * Get the existing catalog data (without DuckDB, for reference)
 */
export function getExistingCatalogData() {
  return [...EXISTING_HD_SUPPLY_CATALOG];
}

function logToConsole(message, level = 'info') {
  const consoleOutput = document.getElementById('esa-console-output');
  if (!consoleOutput) return;

  const colors = {
    info: '#ebdbb2',
    success: '#98971a',
    warning: '#d79921',
    error: '#cc241d'
  };

  const entry = document.createElement('div');
  entry.style.color = colors[level] || colors.info;
  entry.style.marginBottom = '4px';
  entry.style.fontFamily = "'Courier New', monospace";
  entry.style.fontSize = '12px';
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  
  consoleOutput.appendChild(entry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

export default { 
  initDuckDB, 
  queryDuckDB, 
  searchParts, 
  getAllParts, 
  getPartBySKU, 
  updatePartQuantity, 
  getCatalogStats, 
  closeDuckDB, 
  isInitialized,
  getExistingCatalogData 
};
