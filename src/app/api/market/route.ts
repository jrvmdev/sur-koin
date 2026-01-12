import { NextResponse } from "next/server";

const ALLOWED_IDS = [
  "bitcoin",
  "ethereum",
  "tether",
  "binancecoin",
  "solana",
  "ripple",
  "cardano",
  "dogecoin",
  "tron",
  "toncoin",
];

export async function GET() {
  try {
    const url =
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd" +
      "&order=market_cap_desc" +
      "&per_page=50" +
      "&page=1" +
      "&sparkline=true" +
      "&price_change_percentage=24h";

    const res = await fetch(url, {
      headers: {
        "User-Agent": "sur-koin-app",
        "Accept": "application/json",
      },
      next: { revalidate: 120 }, // Cache 2 minutos
    });

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();

    const filtered = Array.isArray(data)
      ? data.filter((c: any) => ALLOWED_IDS.includes(c.id))
      : [];

    return NextResponse.json(filtered.slice(0, 10));
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}