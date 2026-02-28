import { db } from './server/db/database.js';

async function test() {
   try {
      const res = await db.query('SELECT ticker, source, count(*) as count FROM etf_flows GROUP BY ticker, source ORDER BY source, ticker');
      console.log(JSON.stringify(res.rows, null, 2));
   } catch (e) {
      console.error("error:", e.message);
   } finally {
      process.exit(0);
   }
}
test();
