const BASE_URL = '/api';

export const etfService = {
  async getBitcoinEtfFlows(days = 30) {
    try {
      const response = await fetch(`${BASE_URL}/etf/flows?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch ETF flows');
      return await response.json();
    } catch (error) {
      console.error('ETF Flow Error:', error);
      return null;
    }
  },

  async getEtfFlows(ticker, days = 30, source = 'auto') {
    try {
      const response = await fetch(`${BASE_URL}/etf/flows?days=${days}&source=${source}&ticker=${ticker}`);
      if (!response.ok) throw new Error('Failed to fetch ETF flows');
      return await response.json();
    } catch (error) {
      console.error('ETF Flow Error:', error);
      return null;
    }
  },

  async getSpotEtfFlows() {
    try {
      const response = await fetch(`${BASE_URL}/etf/spot-flows`);
      if (!response.ok) throw new Error('Failed to fetch spot ETF flows');
      return await response.json();
    } catch (error) {
      console.error('Spot ETF Flow Error:', error);
      return null;
    }
  },

  async getEtfSummary(ticker = 'IBIT', source = 'auto') {
    try {
      const response = await fetch(`${BASE_URL}/etf/summary?ticker=${ticker}&source=${source}`);
      if (!response.ok) throw new Error('Failed to fetch ETF summary');
      return await response.json();
    } catch (error) {
      console.error('ETF Summary Error:', error);
      return null;
    }
  },

  async getEtfIndex(source = 'crypto') {
    try {
      const response = await fetch(`${BASE_URL}/etf/index?source=${source}`);
      if (!response.ok) throw new Error('Failed to fetch ETF index');
      return await response.json();
    } catch (error) {
      console.error('ETF Index Error:', error);
      return null;
    }
  },

  async getEtfInfo(ticker, source = 'crypto') {
    try {
      const response = await fetch(`${BASE_URL}/etf/info?ticker=${ticker}&source=${source}`);
      if (!response.ok) throw new Error('Failed to fetch ETF info');
      return await response.json();
    } catch (error) {
      console.error('ETF Info Error:', error);
      return null;
    }
  }
};

export const fredService = {
  async getFederalFundsRate() {
    try {
      const response = await fetch(`${BASE_URL}/fred/fed-funds-rate`);
      if (!response.ok) throw new Error('Failed to fetch federal funds rate');
      return await response.json();
    } catch (error) {
      console.error('FRED Error:', error);
      return null;
    }
  },

  async getCpiYoY() {
    try {
      const response = await fetch(`${BASE_URL}/fred/cpi-yoy`);
      if (!response.ok) throw new Error('Failed to fetch CPI YoY');
      return await response.json();
    } catch (error) {
      console.error('FRED Error:', error);
      return null;
    }
  },

  async getTenYearTreasuryYield() {
    try {
      const response = await fetch(`${BASE_URL}/fred/10y-yield`);
      if (!response.ok) throw new Error('Failed to fetch 10Y yield');
      return await response.json();
    } catch (error) {
      console.error('FRED Error:', error);
      return null;
    }
  },

  async getEconomicData() {
    try {
      const response = await fetch(`${BASE_URL}/fred/economic`);
      if (!response.ok) throw new Error('Failed to fetch economic data');
      return await response.json();
    } catch (error) {
      console.error('FRED Error:', error);
      return null;
    }
  }
};

export const cotService = {
  async getCommitmentData(category = 'All') {
    try {
      const url = `${BASE_URL}/cot/socrata?limit=52&market=13874A`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch COT data');
      return await response.json();
    } catch (error) {
      console.error('COT Error:', error);
      return null;
    }
  },

  async getCotSummary() {
    try {
      const response = await fetch(`${BASE_URL}/cot/summary`);
      if (!response.ok) throw new Error('Failed to fetch COT summary');
      return await response.json();
    } catch (error) {
      console.error('COT Error:', error);
      return null;
    }
  },

  async getLegacyCotData(contractCode) {
    try {
      const response = await fetch(`${BASE_URL}/cot/legacy?contract=${contractCode}`);
      if (!response.ok) throw new Error('Failed to fetch legacy COT data');
      return await response.json();
    } catch (error) {
      console.error('Legacy COT Error:', error);
      return null;
    }
  },

  async getFilteredCotData(reportTypes, categories, subcategories, parties) {
    try {
      const params = new URLSearchParams();
      reportTypes.forEach(rt => params.append('report_types', rt));
      categories.forEach(cat => params.append('categories', cat));
      subcategories.forEach(sub => params.append('subcategories', sub));
      parties.forEach(party => params.append('parties', party));

      const response = await fetch(`${BASE_URL}/cot/filtered?${params}`);
      if (!response.ok) throw new Error('Failed to fetch filtered COT data');
      return await response.json();
    } catch (error) {
      console.error('Filtered COT Error:', error);
      return null;
    }
  },

  async getCotAnalysis(filterType = 'all', timeframeMonths = 1) {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('filter_type', filterType);
      }
      params.append('timeframe_months', timeframeMonths);

      const response = await fetch(`${BASE_URL}/cot/analysis?${params}`);
      if (!response.ok) throw new Error('Failed to fetch COT analysis');
      return await response.json();
    } catch (error) {
      console.error('COT Analysis Error:', error);
      return null;
    }
  }
};

export const eurostatService = {
  async getEurostatData(datacodes = []) {
    try {
      const params = new URLSearchParams({ datacodes: datacodes.join(',') });
      const response = await fetch(`${BASE_URL}/eurostat/data?${params}`);
      if (!response.ok) throw new Error('Failed to fetch Eurostat data');
      return await response.json();
    } catch (error) {
      console.error('Eurostat Error:', error);
      return null;
    }
  },

  async getEurostatSummary() {
    try {
      const response = await fetch(`${BASE_URL}/eurostat/summary`);
      if (!response.ok) throw new Error('Failed to fetch Eurostat summary');
      return await response.json();
    } catch (error) {
      console.error('Eurostat Error:', error);
      return null;
    }
  },

  async getDataWithFlags(datacode) {
    try {
      const response = await fetch(`${BASE_URL}/eurostat/flags?code=${datacode}`);
      if (!response.ok) throw new Error('Failed to fetch Eurostat data with flags');
      return await response.json();
    } catch (error) {
      console.error('Eurostat Error:', error);
      return null;
    }
  },

  async processEurostatFlags(datacodes, flagsToFind = []) {
    try {
      const params = new URLSearchParams({
        datacodes: datacodes.join(','),
        flags: flagsToFind.join(',')
      });
      const response = await fetch(`${BASE_URL}/eurostat/flags-process?${params}`);
      if (!response.ok) throw new Error('Failed to process Eurostat flags');
      return await response.json();
    } catch (error) {
      console.error('Eurostat Flags Process Error:', error);
      return null;
    }
  },

  async getEurostatLongFormat(datacodes = []) {
    try {
      const params = new URLSearchParams({ datacodes: datacodes.join(',') });
      const response = await fetch(`${BASE_URL}/eurostat/long-format?${params}`);
      if (!response.ok) throw new Error('Failed to fetch Eurostat long format');
      return await response.json();
    } catch (error) {
      console.error('Eurostat Long Format Error:', error);
      return null;
    }
  }
};
