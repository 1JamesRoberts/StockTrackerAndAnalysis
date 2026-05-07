import { StockQuote, StockSearchResult, StockHistory, TimeRange, ChartDataPoint } from '../types';

const TWELVEDATA_API_KEYS = [
  'd9689515957d4d55bd1fa2a8cf110dbc',
  '9ec5eba69f55455990d611d57a5adad4',
  'e91b963bb3d54ca9aa260c575b2a834d',
  'fa6f354384cd4a2fb05e63ece7fd1c42',
  '011459dbadd844409d3743681e958244',
  'd9ffc01d9f3e40cea382eaf0f371d41e',
  '9d4c79b10ff94ee9b69c243fb66c2c94'
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

  // If all keys are exhausted, throw an error
  throw new Error('All API keys exhausted');
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
    return [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function getQuote(symbol: string): Promise<StockQuote> {
  try {
    const data = await fetchTwelveDataAPI('/quote', { symbol });

    if (!data || data.code === 400 || data.code === 429 || !data.close) {
      throw new Error(data.message || 'No data or API limit reached');
    }

    return {
      symbol: data.symbol,
      name: data.name || symbol,
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
    console.error('Quote error:', error);
    throw error;
  }
}

function getTwelveDataParams(range: TimeRange): { interval: string, outputsize: number } {
  switch (range) {
    case '1D': return { interval: '5min', outputsize: 78 };
    case '1W': return { interval: '1h', outputsize: 35 };
    case '1M': return { interval: '1day', outputsize: 30 };
    case '1Y': return { interval: '1week', outputsize: 52 };
    case 'ALL': return { interval: '1day', outputsize: 5000 }; // ~20 years of daily data
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
      throw new Error('Twelve Data API returned no data');
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
    console.error('History error:', error);
    return [];
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
      throw new Error('Twelve Data API returned no data or limit reached');
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
    console.error('Intraday error:', error);
    return [];
  }
}

// Finnhub API Integration for News
const FINNHUB_API_KEY = 'd7tm9kpr01qlbd3kmpcgd7tm9kpr01qlbd3kmpd0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export async function getNews(symbol?: string): Promise<any[]> {
  try {
    let url = '';
    if (symbol) {
      // Company news: Past 7 days
      const to = new Date().toISOString().split('T')[0];
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      const from = fromDate.toISOString().split('T')[0];
      url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
    } else {
      // General market news
      url = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    // Sometimes Finnhub returns { error: "..." } if limit reached
    if (data.error) {
      console.error('Finnhub API Error:', data.error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('News error:', error);
    return [];
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