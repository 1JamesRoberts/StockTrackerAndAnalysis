import { StockQuote, StockSearchResult, StockHistory, TimeRange, ChartDataPoint } from '../types';

const API_KEY = 'B00GQ63MNG57P7JE';
const BASE_URL = 'https://www.alphavantage.co/query';

async function fetchAPI(params: Record<string, string>): Promise<any> {
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString());
  return response.json();
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
    const data = await fetchAPI({
      function: 'GLOBAL_QUOTE',
      symbol: symbol,
      apikey: API_KEY,
    });
    
    if (data['Error Message'] || data['Note'] || !data['Global Quote']) {
      console.log('API limit reached, using mock data');
      return generateMockQuote(symbol);
    }
    
    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      return generateMockQuote(symbol);
    }
    
    return {
      symbol: quote['01. symbol'],
      name: MOCK_NAMES[symbol] || symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      volume: parseInt(quote['06. volume']),
    };
  } catch (error) {
    console.error('Quote error, using mock data:', error);
    return generateMockQuote(symbol);
  }
}

function getDaysForRange(range: TimeRange): number {
  switch (range) {
    case '1D': return 1;
    case '1W': return 7;
    case '1M': return 30;
    case '1Y': return 365;
    default: return 30;
  }
}

export async function getStockHistory(symbol: string, range: TimeRange = '1M'): Promise<StockHistory[]> {
  const days = getDaysForRange(range);
  
  try {
    const data = await fetchAPI({
      function: 'TIME_SERIES_DAILY',
      symbol: symbol,
      outputsize: days > 100 ? 'full' : 'compact',
      apikey: API_KEY,
    });
    
    if (data['Error Message'] || data['Note'] || !data['Time Series (Daily)']) {
      console.log('API limit reached, using mock data');
      return generateMockHistory(days);
    }
    
    const timeSeries = data['Time Series (Daily)'];
    const entries = Object.entries(timeSeries).slice(0, days).reverse();
    
    return entries.map(([date, values]: [string, any]) => ({
      date: date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    }));
  } catch (error) {
    console.error('History error, using mock data:', error);
    return generateMockHistory(days);
  }
}

export async function getIntradayData(symbol: string): Promise<ChartDataPoint[]> {
  try {
    const data = await fetchAPI({
      function: 'TIME_SERIES_INTRADAY',
      symbol: symbol,
      interval: '5min',
      outputsize: 'compact',
      apikey: API_KEY,
    });
    
    if (data['Error Message'] || data['Note'] || !data['Time Series (5min)']) {
      console.log('API limit reached, using mock data');
      return generateMockIntraday();
    }
    
    const timeSeries = data['Time Series (5min)'];
    const entries = Object.entries(timeSeries).slice(0, 78).reverse();
    
    return entries.map(([datetime, values]: [string, any]) => ({
      date: datetime,
      price: parseFloat(values['4. close']),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
    }));
  } catch (error) {
    console.error('Intraday error, using mock data:', error);
    return generateMockIntraday();
  }
}

export async function getChartData(symbol: string, range: TimeRange): Promise<ChartDataPoint[]> {
  if (range === '1D') {
    const intraday = await getIntradayData(symbol);
    return intraday;
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