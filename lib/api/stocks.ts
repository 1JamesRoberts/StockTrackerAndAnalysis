import { StockQuote, StockSearchResult, StockHistory, TimeRange, ChartDataPoint } from '../types';

const TWELVEDATA_API_KEYS = [
  'd9689515957d4d55bd1fa2a8cf110dbc',
  '9ec5eba69f55455990d611d57a5adad4'
];
let currentKeyIndex = 0;
const TWELVEDATA_BASE_URL = 'https://api.twelvedata.com';

async function fetchTwelveDataAPI(endpoint: string, params: Record<string, string>): Promise<any> {
  for (let attempts = 0; attempts < TWELVEDATA_API_KEYS.length; attempts++) {
    const url = new URL(TWELVEDATA_BASE_URL + endpoint);
    url.searchParams.append('apikey', TWELVEDATA_API_KEYS[currentKeyIndex]);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    const data = await response.json();

    // If rate limit is reached, switch to the next key and retry
    if (data && data.code === 429) {
      console.log(`API key ${currentKeyIndex + 1} limit reached, rotating...`);
      currentKeyIndex = (currentKeyIndex + 1) % TWELVEDATA_API_KEYS.length;
      continue;
    }

    return data;
  }
  
  // If all keys are exhausted, return a generic 429 error to trigger the mock fallback
  return { code: 429, message: 'All API keys exhausted' };
}

const MOCK_NAMES: Record<string, string> = {
  'AAPL': 'Apple Inc.',
  'GOOGL': 'Alphabet Inc.',
  'MSFT': 'Microsoft Corporation',
  'AMZN': 'Amazon.com Inc.',
  'TSLA': 'Tesla Inc.',
  'META': 'Meta Platforms Inc.',
  'NVDA': 'NVIDIA Corporation',
  'JPM': 'JPMorgan Chase & Co.',
  'V': 'Visa Inc.',
  'WMT': 'Walmart Inc.',
};

const MOCK_STOCKS: Record<string, number> = {
  'AAPL': 178.52,
  'GOOGL': 141.80,
  'MSFT': 378.91,
  'AMZN': 178.25,
  'TSLA': 248.50,
  'META': 505.75,
  'NVDA': 875.28,
  'JPM': 198.45,
  'V': 279.80,
  'WMT': 165.30,
};

function generateMockQuote(symbol: string): StockQuote {
  const basePrice = MOCK_STOCKS[symbol] || (100 + Math.random() * 200);
  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol,
    name: MOCK_NAMES[symbol] || symbol,
    price: basePrice + change,
    change,
    changePercent,
    high: basePrice + Math.random() * 5,
    low: basePrice - Math.random() * 5,
    open: basePrice + (Math.random() - 0.5) * 3,
    previousClose: basePrice,
    volume: Math.floor(Math.random() * 50000000) + 10000000,
  };
}

function generateMockHistory(days: number): StockHistory[] {
  const basePrice = 100 + Math.random() * 200;
  const history: StockHistory[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const volatility = 0.03;
    const dailyChange = (Math.random() - 0.5) * basePrice * volatility;
    const open = basePrice + (Math.random() - 0.5) * 5;
    const close = open + dailyChange;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;

    history.push({
      date: date.toISOString().split('T')[0],
      close: Math.round(close * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      open: Math.round(open * 100) / 100,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }

  return history;
}

function generateMockIntraday(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  const basePrice = 150 + Math.random() * 50;

  for (let i = 78; i >= 0; i--) {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - (i * 5));

    const change = (Math.random() - 0.5) * 2;
    const price = basePrice + change;

    data.push({
      date: date.toISOString(),
      price: Math.round(price * 100) / 100,
      open: price - Math.random(),
      high: price + Math.random(),
      low: price - Math.random(),
    });
  }

  return data;
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query || query.length < 1) return [];

  try {
    const data = await fetchTwelveDataAPI('/symbol_search', { symbol: query });
    if (data && data.data && data.data.length > 0) {
      return data.data
        .filter((r: any) => r.country === 'United States')
        .slice(0, 10)
        .map((r: any) => ({
          symbol: r.symbol,
          name: r.instrument_name,
          type: r.instrument_type,
          region: r.country,
          currency: r.currency
        }));
    }
  } catch (error) {
    console.error('Search error, using mock data:', error);
  }

  const mockResults: StockSearchResult[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'V', name: 'Visa Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'WMT', name: 'Walmart Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
  ];

  return mockResults.filter(
    s => s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
  );
}

export async function getQuote(symbol: string): Promise<StockQuote> {
  try {
    const data = await fetchTwelveDataAPI('/quote', { symbol });

    if (!data || data.code === 400 || data.code === 429 || !data.close) {
      console.log('Twelve Data API limit reached or invalid symbol, using mock data:', data.message || 'No data');
      return generateMockQuote(symbol);
    }

    return {
      symbol: data.symbol,
      name: data.name || MOCK_NAMES[symbol] || symbol,
      price: parseFloat(data.close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      open: parseFloat(data.open),
      previousClose: parseFloat(data.previous_close),
      volume: parseInt(data.volume, 10),
    };
  } catch (error) {
    console.error('Quote error, using mock data:', error);
    return generateMockQuote(symbol);
  }
}

function getTwelveDataParams(range: TimeRange): { interval: string, outputsize: number } {
  switch (range) {
    case '1D': return { interval: '5min', outputsize: 78 };
    case '1W': return { interval: '1h', outputsize: 35 };
    case '1M': return { interval: '1day', outputsize: 30 };
    case '1Y': return { interval: '1week', outputsize: 52 };
    default: return { interval: '1day', outputsize: 30 };
  }
}

export async function getStockHistory(symbol: string, range: TimeRange = '1M'): Promise<StockHistory[]> {
  const params = getTwelveDataParams(range);

  try {
    const data = await fetchTwelveDataAPI('/time_series', {
      symbol,
      interval: params.interval,
      outputsize: params.outputsize.toString()
    });

    if (!data || data.status !== 'ok' || !data.values || data.values.length === 0) {
      console.log('Twelve Data API returned no data, using mock data');
      return generateMockHistory(params.outputsize);
    }

    // Twelve Data returns newest to oldest, we want oldest to newest for the chart
    const reversedValues = [...data.values].reverse();

    return reversedValues.map((r: any) => ({
      date: r.datetime,
      close: parseFloat(r.close),
      high: parseFloat(r.high),
      low: parseFloat(r.low),
      open: parseFloat(r.open),
      volume: parseInt(r.volume, 10),
    }));
  } catch (error) {
    console.error('History error, using mock data:', error);
    return generateMockHistory(params.outputsize);
  }
}

export async function getIntradayData(symbol: string): Promise<ChartDataPoint[]> {
  const params = getTwelveDataParams('1D');

  try {
    const data = await fetchTwelveDataAPI('/time_series', {
      symbol,
      interval: params.interval,
      outputsize: params.outputsize.toString()
    });

    if (!data || data.status !== 'ok' || !data.values || data.values.length === 0) {
      console.log('Twelve Data API limit reached, using mock data');
      return generateMockIntraday();
    }

    // Twelve Data returns newest to oldest
    const reversedValues = [...data.values].reverse();

    return reversedValues.map((r: any) => ({
      date: r.datetime,
      price: parseFloat(r.close),
      open: parseFloat(r.open),
      high: parseFloat(r.high),
      low: parseFloat(r.low),
    }));
  } catch (error) {
    console.error('Intraday error, using mock data:', error);
    return generateMockIntraday();
  }
}

export async function getChartData(symbol: string, range: TimeRange): Promise<ChartDataPoint[]> {
  if (range === '1D') {
    return await getIntradayData(symbol);
  }

  const history = await getStockHistory(symbol, range);
  return history.map(d => ({
    date: d.date,
    price: d.close,
    open: d.open,
    high: d.high,
    low: d.low,
  }));
}