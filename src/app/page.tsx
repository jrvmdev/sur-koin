"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

type Coin = {
  id: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  sparkline_in_7d: { price: number[] };
};

type VesBand = {
  band: string;
  buy: number;
  sell: number;
};

type VesData = {
  rate: number;
  mid: number;
  bands: VesBand[];
};

export default function Page() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [ves, setVes] = useState<VesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/market").then((r) => r.json()),
      fetch("/api/usdt-ves").then((r) => r.json()),
    ])
      .then(([market, vesData]) => {
        setCoins(Array.isArray(market) ? market : []);
        if (vesData && Array.isArray(vesData.bands)) {
          setVes(vesData);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-500 text-lg animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 bg-black">
      <div className="max-w-7xl mx-auto space-y-16">
        <header className="space-y-8">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">Sur-Koin</h1>
            <p className="text-zinc-500 text-lg">Radar cripto Venezuela</p>
          </div>

          {ves && (
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 p-8 bg-zinc-950">
              <div className="relative z-10">
                <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
                  🇻🇪 USDT / VES
                </div>

                <div className="flex items-baseline gap-3 mb-8">
                  <div className="text-5xl font-bold text-white">
                    {ves.mid.toFixed(2)}
                  </div>
                  <div className="text-lg text-slate-400">Bs · Precio medio</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {ves.bands.map((b) => (
                    <div
                      key={b.band}
                      className="bg-slate-800 bg-opacity-50 backdrop-blur rounded-2xl p-5 border border-slate-700"
                    >
                      <div className="text-xs text-slate-400 font-medium mb-4 text-center">
                        {b.band} USDT
                      </div>

                      <div className="space-y-3">
                        <div className="bg-emerald-900 bg-opacity-20 rounded-xl px-3 py-2 border border-emerald-700 border-opacity-30">
                          <div className="text-xs text-emerald-400 mb-1">Vender USDT</div>
                          <div className="text-lg font-bold text-emerald-300">
                            {b.buy.toFixed(2)} Bs
                          </div>
                        </div>

                        <div className="bg-rose-900 bg-opacity-20 rounded-xl px-3 py-2 border border-rose-700 border-opacity-30">
                          <div className="text-xs text-rose-400 mb-1">Comprar USDT</div>
                          <div className="text-lg font-bold text-rose-300">
                            {b.sell.toFixed(2)} Bs
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-5" />
            </div>
          )}
        </header>

        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
            Top 10 Mercado Global
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {coins.slice(0, 10).map((c) => {
              const up = c.price_change_percentage_24h >= 0;

              return (
                <div
                  key={c.id}
                  className="group relative overflow-hidden bg-slate-800 bg-opacity-70 backdrop-blur border border-slate-700 hover:border-slate-600 rounded-2xl p-4 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-base font-bold text-slate-100">
                      {c.symbol.toUpperCase()}
                    </div>
                    <div
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        up
                          ? "bg-emerald-500 bg-opacity-10 text-emerald-400"
                          : "bg-rose-500 bg-opacity-10 text-rose-400"
                      }`}
                    >
                      {up ? "+" : ""}
                      {c.price_change_percentage_24h.toFixed(1)}%
                    </div>
                  </div>

                  <div className="h-16 mb-3 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={c.sparkline_in_7d.price.map((v) => ({ v }))}>
                        <defs>
                          <linearGradient id={`grad-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor={up ? "#10b981" : "#ef4444"}
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="100%"
                              stopColor={up ? "#10b981" : "#ef4444"}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <Area
                          dataKey="v"
                          stroke={up ? "#10b981" : "#ef4444"}
                          fill={`url(#grad-${c.id})`}
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="text-xl font-bold text-slate-100 mb-1">
                    ${c.current_price.toLocaleString()}
                  </div>

                  <div className="text-xs text-slate-500">
                    MCap ${(c.market_cap / 1e9).toFixed(1)}B
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-transparent opacity-0 group-hover:opacity-5 transition-opacity" />
                </div>
              );
            })}
          </div>
        </section>

        <footer className="pt-8 text-center text-xs text-slate-600">
          Datos en tiempo real · CoinGecko API
        </footer>
      </div>
    </main>
  );
}