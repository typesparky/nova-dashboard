import axios from 'axios';
async function test() {
    try {
        const resp = await axios.get('https://etfdb.com/etf/SPY/#fund-flows', { timeout: 10000 });
        console.log(resp.data.substring(0,200));
        console.log("Highcharts:", resp.data.indexOf('highcharts') !== -1);
    } catch(e) {
        console.log("Error:", e.message);
    }
}
test();
