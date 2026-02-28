import cron from 'node-cron';
import { db } from '../db/database.js';
import { getAllETFs } from '../config/etf_list.js';
import { scrapeEtfdFlows, scrapeFarsideFlows } from '../scraper/etf.js';

export const startJobs = () => {
    console.log('Background job scheduler initialized.');

    // Cron schedule: Run every day at 02:00 AM
    // We'll also expose a command to run it manually later
    cron.schedule('0 2 * * *', async () => {
        console.log('[CRON] Starting nightly ETF flow scrape job...');
        runScraperJob();
    });
};

export const runScraperJob = async () => {
    const allETFs = getAllETFs();

    for (let i = 0; i < allETFs.length; i++) {
        const etf = allETFs[i];
        console.log(`[JOB] Scraping data for ${etf.ticker} (${etf.category})...`);

        try {
            // Determine source
            let chartData = [];
            let sourceName = '';

            // Add metadata to DB just in case
            await db.query(
                `INSERT INTO etf_metadata (ticker, category, name) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (ticker) 
             DO UPDATE SET category = EXCLUDED.category, name = EXCLUDED.name`,
                [etf.ticker, etf.category, etf.ticker]
            );

            if (etf.category === 'Crypto') {
                const res = await scrapeFarsideFlows(etf.ticker, 10000); // Max timeframe
                chartData = res.chartData;
                sourceName = res.source;
            } else {
                chartData = await scrapeEtfdFlows(etf.ticker, 10000); // Max timeframe
                sourceName = 'ETFDB';
            }

            if (!chartData || chartData.length === 0) {
                console.log(`[JOB] No data returned for ${etf.ticker}`);
                continue;
            }

            // Database Insertion Example (UPSERT using INSERT ON CONFLICT in Postgres)
            for (let dataPoint of chartData) {
                const dateKeys = Object.keys(dataPoint).filter(k => k !== 'date');
                const flowVal = dataPoint[dateKeys[0]];

                if (flowVal !== undefined) {
                    await db.query(
                        `INSERT INTO etf_flows (ticker, date, flow_usd, source) 
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (ticker, date)
                     DO UPDATE SET flow_usd = EXCLUDED.flow_usd, source = EXCLUDED.source`,
                        [etf.ticker, dataPoint.date, flowVal, sourceName]
                    );
                }
            }

            console.log(`[JOB] Success for ${etf.ticker}`);
        } catch (error) {
            console.error(`[JOB] Failed scraping for ${etf.ticker}: ${error.message}`);
            console.log(`[JOB] Failed scraping for ${etf.ticker}: ${error.message}`);
            console.log(`[JOB] Data for ${etf.ticker}: NA`);

            // Log the 'NA' directly to the database so we have a record that it failed today
            const dateStr = new Date().toISOString().split('T')[0];
            await db.query(
                `INSERT INTO etf_flows (ticker, date, flow_usd, source) 
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (ticker, date) DO NOTHING`,
                [etf.ticker, dateStr, null, 'NA']
            );
        }

        // Wait 3 seconds between scrapings to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    console.log('[JOB] Finished scraping top ETFs.');
};
