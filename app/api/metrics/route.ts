import { NextResponse } from 'next/server';
import metrics from '@/data/metrics.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  const enriched = metrics.map((m: any) => ({
    ...m,
    lastCheckedAt: new Date().toISOString(),
    dataMode: 'versioned-source-record',
  }));
  return NextResponse.json({
    ok: true,
    count: enriched.length,
    lastCheckedAt: new Date().toISOString(),
    metrics: enriched,
  });
}
