import axios from 'axios';
import { JSDOM } from 'jsdom';

async function test() {
  try {
    const res = await axios.get('https://farside.xyz/btco', { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log(res.data.substring(0, 500));
    console.log("Includes SVG?", res.data.includes("<svg"));
    console.log("Includes highcharts?", res.data.includes("highcharts"));
  } catch (e) {
    console.log(e.message);
  }
}
test();
