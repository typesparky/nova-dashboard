import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL not found in .env. Please add it to connect to Supabase.");
}

export const db = new Pool({
  connectionString,
  // Add SSL if we are connecting to a remote database (Supabase requires it)
  ssl: connectionString && connectionString.includes('supabase') ? { rejectUnauthorized: false } : false
});

export const initDb = async () => {
  if (!connectionString) return;

  try {
    const client = await db.connect();

    // 1. Table for ETF Flows
    await client.query(`
      CREATE TABLE IF NOT EXISTS etf_flows (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        flow_usd NUMERIC,
        source VARCHAR(50),
        UNIQUE(ticker, date)
      );
    `);

    // 2. Table for ETF metadata and categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS etf_metadata (
        ticker VARCHAR(10) PRIMARY KEY,
        category VARCHAR(50),
        name VARCHAR(255)
      );
    `);

    // 3. Table for High Short Interest
    await client.query(`
      CREATE TABLE IF NOT EXISTS short_interest (
        ticker VARCHAR(10) PRIMARY KEY,
        company VARCHAR(255),
        exchange VARCHAR(50),
        short_interest VARCHAR(20),
        float_val VARCHAR(20),
        target VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Optional: Index on date to make time-series queries faster
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_etf_flows_date ON etf_flows(date DESC);
      CREATE INDEX IF NOT EXISTS idx_etf_flows_ticker ON etf_flows(ticker);
    `);

    console.log("✅ Supabase Database tables initialized successfully.");
    client.release();
  } catch (err) {
    console.error("❌ Error initializing Supabase database:", err.message);
  }
};

// Start the init process
initDb();
