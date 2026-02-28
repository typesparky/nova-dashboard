import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const testDb = async (url) => {
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log(`✅ Success for URL ending in ...${url.slice(-20)}`);
        const res = await client.query('SELECT NOW()');
        console.log(res.rows[0]);
        await client.end();
        return true;
    } catch (e) {
        console.error(`❌ Failed for URL ending in ...${url.slice(-20)}`);
        console.error(e.message);
        return false;
    }
};

const run = async () => {
    console.log("Testing connection...");

    // Test the pooler connection
    const url = process.env.DATABASE_URL;

    if (!url) {
        console.log("No URL found in .env");
        return;
    }

    await testDb(url);
};

run();
