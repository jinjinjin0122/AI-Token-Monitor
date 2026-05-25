import { NextResponse } from 'next/server';
import watchlist from '@/data/watchlist.json';

export const dynamic = 'force-dynamic';

const FMP = process.env.FMP_API_KEY;
const FINNHUB = process.env.FINNHUB_API_KEY;

type Row = {
  symbol: string;
  name: string;
  theme: string;
  priority: string;
  price?: number | null;
  changePercent?: number | null;
  marketCap?: number | null;
  pe?: number | null;
  forwardPE?: number | null;
  eps?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  provider: string;
  sourceUrl: string;
  asOf: string;
  error?: string;
};

function toNumber(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

async function fetchFmp(symbols: string[]): Promise<Row[]> {
  const joined = symbols.join(',');
  const quoteUrl = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(joined)}&apikey=${FMP}`;
  const metricsPromises = symbols.map(async (s) => {
    const url = `https://financialmodelingprep.com/stable/key-metrics?symbol=${encodeURIComponent(s)}&apikey=${FMP}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [s, null] as const;
    const json = await res.json();
    return [s, Array.isArray(json) ? json[0] : json] as const;
  });

  const [quoteRes, metricsEntries] = await Promise.all([
    fetch(quoteUrl, { next: { revalidate: 30 } }),
    Promise.all(metricsPromises),
  ]);
  if (!quoteRes.ok) throw new Error(`FMP quote failed: ${quoteRes.status}`);
  const quotes = await quoteRes.json();
  const metricsMap = new Map(metricsEntries);

  return (Array.isArray(quotes) ? quotes : []).map((q: any) => {
    const meta: any = (watchlist as any[]).find((w) => w.symbol === q.symbol) || {};
    const km: any = metricsMap.get(q.symbol) || {};
    return {
      symbol: q.symbol,
      name: meta.name || q.name || q.symbol,
      theme: meta.theme || '',
      priority: meta.priority || '',
      price: toNumber(q.price),
      changePercent: toNumber(q.changesPercentage),
      marketCap: toNumber(q.marketCap),
      pe: toNumber(q.pe) ?? toNumber(km.peRatio),
      forwardPE: toNumber(km.forwardPERatio),
      eps: toNumber(q.eps),
      fiftyTwoWeekHigh: toNumber(q.yearHigh),
      fiftyTwoWeekLow: toNumber(q.yearLow),
      provider: 'Financial Modeling Prep',
      sourceUrl: 'https://site.financialmodelingprep.com/developer/docs',
      asOf: new Date().toISOString(),
    };
  });
}

async function fetchFinnhub(symbols: string[]): Promise<Row[]> {
  const rows = await Promise.all(symbols.map(async (symbol) => {
    const meta: any = (watchlist as any[]).find((w) => w.symbol === symbol) || {};
    try {
      const [quoteRes, metricRes] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB}`, { next: { revalidate: 30 } }),
        fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB}`, { next: { revalidate: 300 } }),
      ]);
      if (!quoteRes.ok) throw new Error(`quote ${quoteRes.status}`);
      const q = await quoteRes.json();
      const m = metricRes.ok ? await metricRes.json() : { metric: {} };
      return {
        symbol,
        name: meta.name || symbol,
        theme: meta.theme || '',
        priority: meta.priority || '',
        price: toNumber(q.c),
        changePercent: toNumber(q.dp),
        marketCap: toNumber(m.metric?.marketCapitalization) ? toNumber(m.metric.marketCapitalization)! * 1_000_000 : null,
        pe: toNumber(m.metric?.peTTM),
        forwardPE: toNumber(m.metric?.forwardPE),
        eps: toNumber(m.metric?.epsTTM),
        fiftyTwoWeekHigh: toNumber(m.metric?.['52WeekHigh']),
        fiftyTwoWeekLow: toNumber(m.metric?.['52WeekLow']),
        provider: 'Finnhub',
        sourceUrl: 'https://finnhub.io/docs/api',
        asOf: new Date().toISOString(),
      } as Row;
    } catch (err: any) {
      return {
        symbol,
        name: meta.name || symbol,
        theme: meta.theme || '',
        priority: meta.priority || '',
        provider: 'Finnhub',
        sourceUrl: 'https://finnhub.io/docs/api',
        asOf: new Date().toISOString(),
        error: err.message,
      } as Row;
    }
  }));
  return rows;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get('symbols');
  const symbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : (watchlist as any[]).map(w => w.symbol);

  try {
    if (FMP) {
      const rows = await fetchFmp(symbols);
      return NextResponse.json({ ok: true, provider: 'fmp', rows, asOf: new Date().toISOString() });
    }
    if (FINNHUB) {
      const rows = await fetchFinnhub(symbols);
      return NextResponse.json({ ok: true, provider: 'finnhub', rows, asOf: new Date().toISOString() });
    }
    return NextResponse.json({
      ok: false,
      error: 'No market data API key configured. Add FMP_API_KEY or FINNHUB_API_KEY to .env.local.',
      rows: (watchlist as any[]).map((w) => ({ ...w, provider: 'none', asOf: new Date().toISOString() })),
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message, asOf: new Date().toISOString() }, { status: 500 });
  }
}
