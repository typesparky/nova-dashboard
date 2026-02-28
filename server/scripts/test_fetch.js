const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

async function run() {
    try {
        const res1 = await fetch('https://farside.co.uk/bitcoin-etf-flow-all-data/', {headers: HEADERS});
        console.log("Farside HTTP", res1.status);
    } catch(e) {
        console.log("Farside error:", e.message);
    }

    try {
        const res2 = await fetch('https://etfdb.com/etf/SPY/#fund-flows', {headers: HEADERS});
        console.log("ETFDB HTTP", res2.status);
    } catch(e) {
        console.log("ETFDB error:", e.message);
    }
}
run();
