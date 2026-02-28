// server/config/etf_list.js
export const ETF_CATEGORIES = {
    Crypto: ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB', 'HODL', 'ETHA', 'EFCT', 'SOLH'],
    BroadMarket: ['SPY', 'IVV', 'VOO', 'QQQ', 'DIA', 'VTI', 'IWM'],
    Tech: ['XLK', 'VGT', 'IYW', 'SMH', 'SOXX', 'IGV', 'FTEC'],
    Financials: ['XLF', 'VFH', 'KRE', 'IAT', 'IXG'],
    Healthcare: ['XLV', 'VHT', 'IBB', 'XBI', 'IHI'],
    Energy: ['XLE', 'VDE', 'XOP', 'OIH', 'AMLP'],
    Materials: ['XLB', 'VAW', 'GDX', 'XME', 'SLX'],
    Industrials: ['XLI', 'VIS', 'ITA', 'JETS', 'PAVE'],
    ConsumerDiscretionary: ['XLY', 'VCR', 'XRT', 'RTH', 'PBJ'],
    ConsumerStaples: ['XLP', 'VDC', 'KXI', 'MOO'],
    Utilities: ['XLU', 'VPU', 'IDU'],
    RealEstate: ['XLRE', 'VNQ', 'SCHH', 'IYR'],
    Thematic_AI_Robotics: ['BOTZ', 'ROBO', 'AIQ', 'IRBO'],
    Thematic_Cybersecurity: ['HACK', 'CIBR', 'BUG'],
    Thematic_CleanEnergy: ['ICLN', 'TAN', 'PBW', 'QCLN'],
    Bonds_FixedIncome: ['AGG', 'BND', 'TLT', 'IEF', 'SHY', 'LQD', 'HYG'],
    Commodities: ['GLD', 'SLV', 'PDBC', 'USO', 'UNG', 'DBA'],
    International: ['EFA', 'VEA', 'IEMG', 'VWO', 'EEM', 'VGK', 'EWJ']
};

export const getAllETFs = () => {
    const all = [];
    for (const [category, tickers] of Object.entries(ETF_CATEGORIES)) {
        tickers.forEach(ticker => {
            all.push({ ticker, category });
        });
    }
    return all;
};
