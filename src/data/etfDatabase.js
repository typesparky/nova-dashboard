// ═══════════════════════════════════════════════════════════════════════════════
//  Nova Capital — ETF Categorical Database
//  Static data parsed from user input for Industry Flows / Factors.
// ═══════════════════════════════════════════════════════════════════════════════

export const etfDatabase = {
    assetClass: [
        { theme: 'Equity', rank: 1, flow3mo: 365096, topIssuer: 'Vanguard Group Inc' },
        { theme: 'Bond', rank: 2, flow3mo: 141135, topIssuer: 'BlackRock Financial Management' },
        { theme: 'Commodity', rank: 3, flow3mo: 18547, topIssuer: 'Invesco Fund' },
    ],
    sector: [
        { theme: 'Materials', rank: 1, flow3mo: 14489, topIssuer: 'Mirae Asset Global Investments Co., Ltd.' },
        { theme: 'Industrials', rank: 2, flow3mo: 10033, topIssuer: 'State Street Bank and Trust Co./IFTC' },
        { theme: 'Energy', rank: 3, flow3mo: 6499, topIssuer: 'BlackRock Financial Management' },
    ],
    industry: [
        { theme: 'Aerospace & Defense', rank: 1, flow3mo: 5680, topIssuer: 'ARK Investment Management' },
        { theme: 'Broad Industrials', rank: 2, flow3mo: 3818, topIssuer: 'State Street Bank and Trust Co./IFTC' },
        { theme: 'Oil & Gas Exploration & Production', rank: 3, flow3mo: 3484, topIssuer: 'BlackRock Financial Management' },
    ],
    region: [
        { theme: 'North America', rank: 1, flow3mo: 212963, topIssuer: 'Vanguard' },
        { theme: 'Developed Markets', rank: 2, flow3mo: 47397, topIssuer: 'Vanguard' },
        { theme: 'Broad Asia', rank: 3, flow3mo: 37543, topIssuer: 'Barclays Global Fund Advisors' },
    ],
    country: [
        { theme: 'U.S.', rank: 1, flow3mo: 208766, topIssuer: 'Vanguard' },
        { theme: 'Broad Global', rank: 2, flow3mo: 34908, topIssuer: 'BlackRock, Inc.' },
        { theme: 'Broad Developed Markets', rank: 3, flow3mo: 34892, topIssuer: 'Vanguard' },
    ],
    bond: [
        { theme: 'Total Bond Market', rank: 1, flow3mo: 45051, topIssuer: 'BlackRock Financial Management' },
        { theme: 'Treasuries', rank: 2, flow3mo: 26029, topIssuer: 'BlackRock, Inc.' },
        { theme: 'Investment Grade Corporate', rank: 3, flow3mo: 12249, topIssuer: 'Vanguard Group Inc' },
    ],
    bondDuration: [
        { theme: 'All-Term', rank: 1, flow3mo: 57152, topIssuer: 'BlackRock Financial Management' },
        { theme: 'Intermediate-Term', rank: 2, flow3mo: 29769, topIssuer: 'BlackRock Financial Management' },
        { theme: 'Ultra Short-Term', rank: 3, flow3mo: 18300, topIssuer: 'BlackRock, Inc.' },
    ],
    commodity: [
        { theme: 'Gold', rank: 1, flow3mo: 12626, topIssuer: 'World Gold Council' },
        { theme: 'Silver', rank: 2, flow3mo: 2861, topIssuer: 'Aberdeen Standard Investments' },
        { theme: 'Broad Diversified', rank: 3, flow3mo: 1339, topIssuer: 'Invesco Fund' },
    ],
    commodityExposure: [
        { theme: 'Physically Backed', rank: 1, flow3mo: 15252, topIssuer: 'Standard Life Aberdeen' },
        { theme: 'Futures Based', rank: 2, flow3mo: 3255, topIssuer: 'Invesco Fund' },
    ],
    naturalResources: [
        { theme: 'Precious Metals', rank: 1, flow3mo: 16475, topIssuer: 'Standard Life Aberdeen' },
        { theme: 'Diversified', rank: 2, flow3mo: 1339, topIssuer: 'Invesco Fund' },
        { theme: 'Industrial Metals', rank: 3, flow3mo: 685, topIssuer: 'Marygold' },
    ],
    currency: [
        { theme: 'CHF (Swiss Franc)', rank: 1, flow3mo: 165, topIssuer: 'Invesco Fund' },
        { theme: 'EUR (Euro)', rank: 2, flow3mo: 38, topIssuer: 'Citigroup' },
        { theme: 'AUD (Australian Dollar)', rank: 3, flow3mo: 20, topIssuer: 'Citigroup' },
    ],
    realEstateByRegion: [
        { theme: 'North America', rank: 1, flow3mo: 1404, topIssuer: 'Vanguard' },
        { theme: 'Developed Markets', rank: 2, flow3mo: 360, topIssuer: 'Vanguard' },
        { theme: 'Global', rank: 3, flow3mo: 33, topIssuer: 'BlackRock, Inc.' },
    ],
    alternatives: [
        { theme: 'Managed Futures', rank: 1, flow3mo: 544, topIssuer: 'First Trust' },
        { theme: 'Long/Short', rank: 2, flow3mo: 195, topIssuer: 'Convergence Investment Partners, LLC' },
        { theme: 'Real Return', rank: 3, flow3mo: 66, topIssuer: 'State Street Bank and Trust Co./IFTC' },
    ],
    multiAsset: [
        { theme: 'Moderate', rank: 1, flow3mo: 614, topIssuer: 'Barclays Global Fund Advisors' },
        { theme: 'Income-Focused', rank: 2, flow3mo: 450, topIssuer: 'Amplify' },
        { theme: 'Dynamic', rank: 3, flow3mo: 195, topIssuer: 'WisdomTree, Inc.' },
    ],
    volatility: [
        { theme: 'Mid Term Volatility', rank: 1, flow3mo: 23, topIssuer: 'Proshare Advisors LLC' },
        { theme: 'Short Term Volatility', rank: 2, flow3mo: -51, topIssuer: 'UBS Global Asset Management' },
    ],
    investmentStyle: [
        { theme: 'Socially Responsible', rank: 1, flow3mo: 218290, topIssuer: 'Vanguard Group Inc' },
        { theme: 'Consistent Growth', rank: 2, flow3mo: 110617, topIssuer: 'Vanguard Group Inc' },
        { theme: 'Low Beta', rank: 3, flow3mo: 77038, topIssuer: 'BlackRock, Inc.' },
    ],
    assetClassSize: [
        { theme: 'Large-Cap', rank: 1, flow3mo: 255238, topIssuer: 'Vanguard' },
        { theme: 'Multi-Cap', rank: 2, flow3mo: 58332, topIssuer: 'Barclays Global Fund Advisors' },
        { theme: 'Small-Cap', rank: 3, flow3mo: 9560, topIssuer: 'BlackRock, Inc.' },
    ],
    assetClassStyle: [
        { theme: 'Blend', rank: 1, flow3mo: 278214, topIssuer: 'Vanguard Group Inc' },
        { theme: 'Value', rank: 2, flow3mo: 26719, topIssuer: 'Barclays Global Fund Advisors' },
        { theme: 'Growth', rank: 3, flow3mo: 12379, topIssuer: 'BlackRock Financial Management' },
    ],
    assetClassSizeAndStyle: [
        { theme: 'Large-Cap Blend', rank: 1, flow3mo: 226683, topIssuer: 'Vanguard Group Inc' },
        { theme: 'Multi-Cap Blend', rank: 2, flow3mo: 38513, topIssuer: 'Barclays Global Fund Advisors' },
        { theme: 'Large-Cap Value', rank: 3, flow3mo: 16265, topIssuer: 'State Street Bank and Trust Co./IFTC' },
    ],
    inverse: [
        { theme: 'Inverse Commodity', rank: 1, flow3mo: 1007, topIssuer: 'Proshare Advisors LLC' },
        { theme: 'Inverse Bond', rank: 2, flow3mo: 0, topIssuer: 'Ameriprise Financial' },
        { theme: 'Inverse Real Estate', rank: 3, flow3mo: -4, topIssuer: 'Proshare Advisors LLC' },
    ],
    leveraged: [
        { theme: 'Leveraged Commodity', rank: 1, flow3mo: 1109, topIssuer: 'Proshare Advisors LLC' },
        { theme: 'Leveraged Currency', rank: 2, flow3mo: 809, topIssuer: 'Citigroup' },
        { theme: 'Leveraged Volatility', rank: 3, flow3mo: 120, topIssuer: 'Milliman, Inc.' },
    ],
};

export const etfIssuersMap = [
    { issuer: 'BlackRock, Inc.', rank: 2, flow3mo: 130516 },
    { issuer: 'State Street', rank: 3, flow3mo: 19866 },
    { issuer: 'JPMorgan Chase', rank: 4, flow3mo: 18763 },
];

export const esgInvestingFilters = [
    {
        category: 'Environmentally Responsible',
        filters: ['Carbon Intensity', 'Fossil Fuel Reserves', 'Water Stress', 'Energy Efficiency', 'Alternative Energy', 'Green Building', 'Pollution Prevention', 'Water Sustainability']
    },
    {
        category: 'Socially Responsible',
        filters: ['Affordable Real Estate', 'Education', 'Major Disease Treatment', 'Healthy Nutrition', 'Global Sanitation', 'SME Finance', 'Human Rights Violations', 'Labor Rights Violations', 'Customer Controversies', 'UN Principles Violations', 'Catholic Values', 'Sharia Compliant Investing', 'Adult Entertainment', 'Alcohol', 'Gambling', 'Nuclear Power', 'Tobacco', 'Weapons Involvement', 'Firearms', 'Predatory Lending', 'GMO Involvement']
    },
    {
        category: 'Responsible Governance',
        filters: ['Board Flag', 'Board Independence', 'Board Diversity', 'Entrenched Board', 'Overboarding', 'Shareholder Rights', 'Fund Ownership', 'Poison Pill', 'Executive Compensation', 'Accounting Flags']
    }
];

export const otherEtfTypes = [
    'Trending ETFs',
    'Artificial Intelligence ETFs',
    'FAANG ETFs',
    'Blockchain ETFs',
    'Marijuana ETFs'
];

export const commissionFreePlatforms = [
    { name: 'Charles Schwab', count: 121 },
    { name: 'E*TRADE', count: 57 },
    { name: 'Fidelity', count: 80 },
    { name: 'Firstrade', count: 10 },
    { name: 'Interactive Brokers', count: 24 },
    { name: 'TD Ameritrade', count: 95 },
    { name: 'Vanguard', count: 67 }
];
