import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const origin = url.origin;
  const marketRes = await fetch(`${origin}/api/market`, {
    cache: "no-store",
  });

  const marketJson = await marketRes.json();

  if (!marketJson.ok) {
    return NextResponse.json(
      { ok: false, error: marketJson.error || "Market API failed" },
      { status: 500 }
    );
  }

  const rows = marketJson.rows.map((r: any) => ({
    symbol: r.symbol,
    name: r.name,
    theme: r.theme,
    priority: r.priority,
    price: r.price,
    change_percent: r.changePercent,
    market_cap: r.marketCap,
    pe: r.pe,
    forward_pe: r.forwardPE,
    eps: r.eps,
    fifty_two_week_high: r.fiftyTwoWeekHigh,
    fifty_two_week_low: r.fiftyTwoWeekLow,
    provider: r.provider,
    source_url: r.sourceUrl,
    as_of: r.asOf,
  }));

  const { error } = await supabaseAdmin
    .from("market_snapshots")
    .insert(rows);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    inserted: rows.length,
    asOf: new Date().toISOString(),
  });
}
