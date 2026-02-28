import axios from 'axios';
async function run() {
    try {
        const res = await axios.get('https://query2.finance.yahoo.com/v8/finance/chart/IWM?range=30d&interval=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log("Success:", !!res.data.chart.result[0]);
    } catch(e) {
        console.log("Error:", e.message);
    }
}
run();
