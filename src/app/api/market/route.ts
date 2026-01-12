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
  "avalanche-2",
  "chainlink",
  "polkadot",
  "litecoin",
  "bitcoin-cash",
  "monero",
  "shiba-inu",
  "uniswap",
  "cosmos",
  "near",
];

export async function GET() {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    "?vs_currency=usd" +
    "&order=market_cap_desc" +
    "&per_page=100" +
    "&page=1" +
    "&sparkline=true" +
    "&price_change_percentage=24h";

  const res = await fetch(url, {
    headers: {
      "User-Agent": "sur-koin",
      "Accept": "application/json",
    },
    cache: "no-store", // 👈 CLAVE
  });

  const data = await res.json();

  const filtered = Array.isArray(data)
    ? data.filter((c: any) => ALLOWED_IDS.includes(c.id))
    : [];

  return NextResponse.json(filtered.slice(0, 20));
}
