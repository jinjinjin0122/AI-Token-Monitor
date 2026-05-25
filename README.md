# AI Token Investment Monitor

A local-deployable Next.js dashboard for AI token-economy investment monitoring.

## What this app does

- Turns the indicator system into data records with: current value, unit, date, source, status, threshold, update frequency, and investment interpretation.
- Pulls core stock watchlist price and valuation data from real API providers.
- Keeps API keys on the server side through Next.js API routes.
- Supports local deployment and later migration to Vercel / Render / Railway / a private server.

## Data design

### A/B indicator system

The `/api/metrics` endpoint returns structured metrics:

- `currentValue`
- `unit`
- `asOf`
- `sourceName`
- `sourceUrl`
- `frequency`
- `status`
- `bullishThreshold`
- `riskThreshold`
- `interpretation`

Some metrics are not available from clean public real-time APIs, such as OpenAI/Anthropic/Gemini API pricing, hyperscaler capex, Nvidia quarterly revenue, and IEA data center power demand. These are treated as versioned source-of-truth records in `data/metrics.json`, with explicit source URLs and as-of dates.

### C stock monitor

The `/api/market` endpoint pulls stock price and valuation data.

Provider priority:

1. Financial Modeling Prep, if `FMP_API_KEY` is present.
2. Finnhub, if `FINNHUB_API_KEY` is present.
3. Returns a clear error if no key is configured.

## Local setup

```bash
cd ai-token-monitor-next
cp .env.example .env.local
# Fill in FMP_API_KEY and/or FINNHUB_API_KEY
npm install
npm run dev
```

Open:

```bash
http://localhost:3001
```

## Production deployment

### Vercel

```bash
npm run build
```

Then deploy to Vercel and add environment variables:

- `FMP_API_KEY`
- `FINNHUB_API_KEY`
- `NEXT_PUBLIC_REFRESH_SECONDS`

### Private VPS / server

```bash
npm install
npm run build
npm run start
```

For long-running deployment, use `pm2` or Docker.

## Recommended data APIs

- FMP: quote + key metrics / P/E / market cap
- Finnhub: real-time stock quote + basic financial metrics
- Alpha Vantage: useful as a backup and for historical series

## Notes

This is an investment monitoring tool, not investment advice. API vendor free tiers may have limits, delayed data, or licensing restrictions. For real trading decisions, use a licensed real-time market-data provider.
