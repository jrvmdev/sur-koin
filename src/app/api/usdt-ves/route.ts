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

async function fetchAllAds(tradeType: "BUY" | "SELL") {
  const res = await fetch(BINANCE_P2P, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Binance P2P fetch failed");

  const json = await res.json();
  return json?.data || [];
}

function getBestPriceForRange(
  ads: Ad[],
  minAmount: number,
  maxAmount: number,
  tradeType: "BUY" | "SELL"
): number | null {
  // Filtra anuncios que cubren este rango
  const validAds = ads.filter((ad) => {
    const adMin = Number(ad.adv.minSingleTransAmount);
    const adMax = Number(ad.adv.dynamicMaxSingleTransAmount);
    const available = Number(ad.adv.tradableQuantity);
    
    // El anuncio debe poder manejar al menos el minAmount del rango
    return adMin <= minAmount && adMax >= minAmount && available >= minAmount;
  });

  if (validAds.length === 0) {
    // Fallback: toma cualquier anuncio que tenga liquidez
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

  // Promedia los 3 mejores precios
  const prices = validAds
    .slice(0, 3)
    .map((ad) => Number(ad.adv.price));

  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

export async function GET() {
  try {
    // Fetch todos los anuncios de compra y venta UNA SOLA VEZ
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

    // Calcula el mejor precio para cada banda
    for (const r of ranges) {
      const buy = getBestPriceForRange(buyAds, r.min, r.max, "BUY");
      const sell = getBestPriceForRange(sellAds, r.min, r.max, "SELL");

      // Agrega la banda si tiene al menos un precio
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

    // Calcula el precio medio con bandas válidas
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
      { error: "USDT/VES failed" },
      { status: 500 }
    );
  }
}