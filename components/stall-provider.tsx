"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_STALL, menuFromPrices, type MenuItem, type Stall } from "@/lib/menu";
import { buildSampleEvening } from "@/lib/samples";
import { loadPersisted, savePersisted } from "@/lib/storage";
import type { SaleRecord } from "@/lib/types";

type StallContextValue = {
  ready: boolean;
  stall: Stall;
  menu: MenuItem[];
  sales: SaleRecord[];
  setStall: (stall: Stall) => void;
  setPrices: (prices: Record<string, number>) => void;
  resetStall: () => void;
  addSale: (sale: SaleRecord) => void;
  updateSale: (id: string, updater: (sale: SaleRecord) => SaleRecord) => void;
  loadSamples: () => void;
  clearSamples: () => void;
  clearSales: () => void;
};

const StallContext = createContext<StallContextValue | null>(null);

export function StallProvider({ children }: { children: React.ReactNode }) {
  const [stall, setStall] = useState<Stall>(DEFAULT_STALL);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadPersisted();
    if (saved) {
      setStall(saved.stall);
      setPrices(saved.prices ?? {});
      setSales(saved.sales ?? []);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    savePersisted({ version: 1, stall, prices, sales });
  }, [ready, stall, prices, sales]);

  const menu = useMemo(() => menuFromPrices(prices), [prices]);

  const value = useMemo<StallContextValue>(
    () => ({
      ready,
      stall,
      menu,
      sales,
      setStall,
      setPrices,
      resetStall: () => {
        setStall(DEFAULT_STALL);
        setPrices({});
      },
      addSale: (sale) => setSales((current) => [sale, ...current.filter((item) => item.id !== sale.id)]),
      updateSale: (id, updater) =>
        setSales((current) => current.map((sale) => (sale.id === id ? updater(sale) : sale))),
      loadSamples: () =>
        setSales((current) => [...buildSampleEvening(stall), ...current.filter((sale) => !sale.sample)]),
      clearSamples: () => setSales((current) => current.filter((sale) => !sale.sample)),
      clearSales: () => setSales([]),
    }),
    [ready, stall, menu, sales],
  );

  return <StallContext.Provider value={value}>{children}</StallContext.Provider>;
}

export function useStall(): StallContextValue {
  const value = useContext(StallContext);
  if (!value) throw new Error("useStall must be used inside StallProvider");
  return value;
}
