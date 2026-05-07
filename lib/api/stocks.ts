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