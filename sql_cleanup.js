import { db } from './server/db/database.js';

async function cleanup() {
   try {
       await db.query("DELETE FROM etf_flows WHERE source LIKE '%Synthetic%'");
       console.log("Deleted synthetic data.");
   } catch(e) {
       console.error("error:", e.message);
   } finally {
       process.exit(0);
   }
}
cleanup();
