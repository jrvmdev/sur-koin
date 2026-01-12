import { NextResponse } from "next/server";

const BINANCE =
  "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

const BANDS = [
  { label: "10–50", min: 10, max: 50 },
  { label: "50–100", min: 50, max: 100 },
  { label: "100–200", min: 100, max: 200 },
  { label: "200–500", min: 200, max: 500 },
];

async function fetchAds(
  tradeType: "BUY" | "SELL",
  fiat: string
) {
  const res = await fetch(BINANCE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      asset: "USDT",
      fiat,
      tradeType,
      page: 1,
      rows: 20,
      payTypes: [],
      publisherType: null,
    }),
  });

  const json = await res.json();
  return json.data || [];
}

function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export async function POST(req: Request) {
  try {
    const { fiat = "VES" } = await req.json();

    const buyAds = await fetchAds("BUY", fiat);
    const sellAds = await fetchAds("SELL", fiat);

    const bands = BANDS.map(band => {
      const buyPrices = buyAds
        .map(a => ({
          price: parseFloat(a.adv.price),
          min: parseFloat(a.adv.minSingleTransAmount),
          max: parseFloat(a.adv.dynamicMaxSingleTransAmount),
        }))
        .filter(x => x.min <= band.min && x.max >= band.max)
        .slice(0, 8)
        .map(x => x.price);

      const sellPrices = sellAds
        .map(a => ({
          price: parseFloat(a.adv.price),
          min: parseFloat(a.adv.minSingleTransAmount),
          max: parseFloat(a.adv.dynamicMaxSingleTransAmount),
        }))
        .filter(x => x.min <= band.min && x.max >= band.max)
        .slice(0, 8)
        .map(x => x.price);

      return {
        band: band.label,
        buy: buyPrices.length ? avg(buyPrices) : 0,
        sell: sellPrices.length ? avg(sellPrices) : 0,
      };
    });

    const mids = bands
      .filter(b => b.buy > 0 && b.sell > 0)
      .map(b => (b.buy + b.sell) / 2);

    return NextResponse.json({
      bands,
      mid: mids.length ? avg(mids) : 0,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "P2P failed" },
      { status: 500 }
    );
  }
}
