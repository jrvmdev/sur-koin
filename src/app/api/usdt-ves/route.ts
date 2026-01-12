import { NextResponse } from "next/server";

const BINANCE_P2P = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

type Band = {
  band: string;
  buy: number;
  sell: number;
};

type Ad = {
  adv: {
    price: string;
    minSingleTransAmount: string;
    dynamicMaxSingleTransAmount: string;
    tradableQuantity: string;
  };
};

async function fetchAllAds(tradeType: "BUY" | "SELL", retries = 3): Promise<Ad[]> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(BINANCE_P2P, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: JSON.stringify({
          asset: "USDT",
          fiat: "VES",
          tradeType,
          payTypes: [],
          page: 1,
          rows: 20,
          countries: [],
          publisherType: null,
        }),
        next: { revalidate: 60 }, // Cache 1 minuto
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error(`Retry ${i + 1}/${retries}:`, err);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return [];
}

function getBestPriceForRange(
  ads: Ad[],
  minAmount: number,
  maxAmount: number,
  tradeType: "BUY" | "SELL"
): number | null {
  const validAds = ads.filter((ad) => {
    const adMin = Number(ad.adv.minSingleTransAmount);
    const adMax = Number(ad.adv.dynamicMaxSingleTransAmount);
    const available = Number(ad.adv.tradableQuantity);
    
    return adMin <= minAmount && adMax >= minAmount && available >= minAmount;
  });

  if (validAds.length === 0) {
    const anyValid = ads.filter((ad) => {
      const available = Number(ad.adv.tradableQuantity);
      return available >= minAmount;
    });
    
    if (anyValid.length > 0) {
      const prices = anyValid.slice(0, 3).map((ad) => Number(ad.adv.price));
      return prices.reduce((a, b) => a + b, 0) / prices.length;
    }
    
    return null;
  }

  const prices = validAds
    .slice(0, 3)
    .map((ad) => Number(ad.adv.price));

  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

export async function GET() {
  try {
    const [buyAds, sellAds] = await Promise.all([
      fetchAllAds("BUY"),
      fetchAllAds("SELL"),
    ]);

    const ranges = [
      { band: "10–50", min: 10, max: 50 },
      { band: "50–100", min: 50, max: 100 },
      { band: "100–200", min: 100, max: 200 },
      { band: "200–500", min: 200, max: 500 },
    ];

    const bands: Band[] = [];

    for (const r of ranges) {
      const buy = getBestPriceForRange(buyAds, r.min, r.max, "BUY");
      const sell = getBestPriceForRange(sellAds, r.min, r.max, "SELL");

      if (buy || sell) {
        bands.push({
          band: r.band,
          buy: buy ? Number(buy.toFixed(2)) : 0,
          sell: sell ? Number(sell.toFixed(2)) : 0,
        });
      }
    }

    if (!bands.length) {
      return NextResponse.json(
        { error: "No P2P data available" },
        { status: 500 }
      );
    }

    const validBands = bands.filter((b) => b.buy > 0 && b.sell > 0);
    const mid =
      validBands.length > 0
        ? validBands.reduce((acc, b) => acc + (b.buy + b.sell) / 2, 0) /
          validBands.length
        : bands[0]?.buy || bands[0]?.sell || 0;

    return NextResponse.json({
      source: "binance-p2p",
      currency: "VES",
      asset: "USDT",
      mid: Number(mid.toFixed(2)),
      bands,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("USDT/VES Error:", err);
    return NextResponse.json(
      { error: "USDT/VES failed", details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    );
  }
}