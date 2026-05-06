import { StockQuote, StockSearchResult, StockHistory, TimeRange, ChartDataPoint } from '../types';

const API_KEY = 'd7tm9kpr01qlbd3kmpcgd7tm9kpr01qlbd3kmpd0';
const BASE_URL = 'https://finnhub.io/api/v1';

const POLYGON_API_KEY = 'vQssTpYb4gJFuOo2Z_1EJQzLH1vKhAVr';
const POLYGON_BASE_URL = 'https://api.polygon.io/v2';

async function fetchAPI(endpoint: string, params: Record<string, string>): Promise<any> {
  const url = new URL(BASE_URL + endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString());
  return response.json();
}

async function fetchPolygonAPI(endpoint: string): Promise<any> {
  const url = new URL(POLYGON_BASE_URL + endpoint);
  url.searchParams.append('apiKey', POLYGON_API_KEY);
  url.searchParams.append('adjusted', 'true');
  url.searchParams.append('sort', 'asc');
  
  const response = await fetch(url.toString());
  return response.json();
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
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
    const data = await fetchAPI('/search', { q: query, token: API_KEY });
    if (data && data.result && data.result.length > 0) {
      return data.result.slice(0, 10).map((r: any) => ({
        symbol: r.symbol,
        name: r.description,
        type: r.type,
        region: 'US', // Finnhub primarily supports US equities for free search
        currency: 'USD'
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
    const data = await fetchAPI('/quote', { symbol, token: API_KEY });
    
    if (!data || data.c === undefined || data.c === 0) {
      console.log('API limit reached or invalid symbol, using mock data');
      return generateMockQuote(symbol);
    }
    
    return {
      symbol: symbol,
      name: MOCK_NAMES[symbol] || symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    };
  } catch (error) {
    console.error('Quote error, using mock data:', error);
    return generateMockQuote(symbol);
  }
}

function getPolygonParamsForRange(range: TimeRange): { multiplier: string, timespan: string, daysBack: number } {
  switch (range) {
    case '1D': return { multiplier: '5', timespan: 'minute', daysBack: 3 }; // 3 days to account for weekends
    case '1W': return { multiplier: '1', timespan: 'hour', daysBack: 7 };
    case '1M': return { multiplier: '1', timespan: 'day', daysBack: 30 };
    case '1Y': return { multiplier: '1', timespan: 'week', daysBack: 365 };
    default: return { multiplier: '1', timespan: 'day', daysBack: 30 };
  }
}

export async function getStockHistory(symbol: string, range: TimeRange = '1M'): Promise<StockHistory[]> {
  const params = getPolygonParamsForRange(range);
  
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - params.daysBack);

  const toStr = formatDate(toDate);
  const fromStr = formatDate(fromDate);

  try {
    const data = await fetchPolygonAPI(`/aggs/ticker/${symbol}/range/${params.multiplier}/${params.timespan}/${fromStr}/${toStr}`);
    
    if (!data || (data.status !== 'OK' && data.status !== 'DELAYED') || !data.results || data.results.length === 0) {
      console.log('Polygon API returned no data or error, using mock data:', data.status);
      return generateMockHistory(params.daysBack);
    }
    
    return data.results.map((r: any) => ({
      date: new Date(r.t).toISOString(),
      close: r.c,
      high: r.h,
      low: r.l,
      open: r.o,
    }));
  } catch (error) {
    console.error('History error, using mock data:', error);
    return generateMockHistory(params.daysBack);
  }
}

export async function getIntradayData(symbol: string): Promise<ChartDataPoint[]> {
  const params = getPolygonParamsForRange('1D');
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - params.daysBack);

  const toStr = formatDate(toDate);
  const fromStr = formatDate(fromDate);

  try {
    const data = await fetchPolygonAPI(`/aggs/ticker/${symbol}/range/${params.multiplier}/${params.timespan}/${fromStr}/${toStr}`);
    
    if (!data || (data.status !== 'OK' && data.status !== 'DELAYED') || !data.results || data.results.length === 0) {
      console.log('Polygon API limit reached or delayed, using mock data:', data.status);
      return generateMockIntraday();
    }
    
    return data.results.map((r: any) => ({
      date: new Date(r.t).toISOString(),
      price: r.c,
      open: r.o,
      high: r.h,
      low: r.l,
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