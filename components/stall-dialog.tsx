"use client";

import { useEffect, useState } from "react";
import { centsToInput, parseDollarInput } from "@/lib/money";
import { useStall } from "@/components/stall-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StallDialog() {
  const { stall, menu, setStall, setPrices, resetStall } = useStall();
  const [open, setOpen] = useState(false);
  const [sellerName, setSellerName] = useState(stall.sellerName);
  const [stallName, setStallName] = useState(stall.stallName);
  const [campus, setCampus] = useState(stall.campus);
  const [city, setCity] = useState(stall.city);
  const [goal, setGoal] = useState(centsToInput(stall.goalCents));
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSellerName(stall.sellerName);
    setStallName(stall.stallName);
    setCampus(stall.campus);
    setCity(stall.city);
    setGoal(centsToInput(stall.goalCents));
    setPriceInputs(Object.fromEntries(menu.map((item) => [item.id, centsToInput(item.priceCents)])));
    setError(null);
  }, [open, stall, menu]);

  function save() {
    const goalCents = parseDollarInput(goal);
    if (goalCents == null || goalCents > 100_000_00) {
      setError("Enter a keep goal like 80.00.");
      return;
    }
    const prices: Record<string, number> = {};
    for (const item of menu) {
      const cents = parseDollarInput(priceInputs[item.id] ?? "");
      if (cents == null || cents < 50) {
        setError(`Set a price of at least $0.50 for ${item.name}.`);
        return;
      }
      prices[item.id] = cents;
    }
    setStall({
      sellerName: sellerName.trim() || stall.sellerName,
      stallName: stallName.trim() || stall.stallName,
      campus: campus.trim() || stall.campus,
      city: city.trim() || stall.city,
      goalCents,
    });
    setPrices(prices);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="h-10" />}>Edit stall</DialogTrigger>
      <DialogContent className="sm:!max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">The stall</DialogTitle>
          <DialogDescription>
            Rename it for the demo. Menu prices stay locked at checkout so a note cannot quietly change them.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Your name" value={sellerName} onChange={setSellerName} />
          <Field label="Stall name" value={stallName} onChange={setStallName} />
          <Field label="Campus" value={campus} onChange={setCampus} />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="Today's keep goal" value={goal} onChange={setGoal} />
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Menu</p>
          {menu.map((item) => (
            <label key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{item.name}</span>
              <Input
                className="h-9 w-28 text-right"
                inputMode="decimal"
                aria-label={`${item.name} price`}
                value={priceInputs[item.id] ?? ""}
                onChange={(event) =>
                  setPriceInputs((current) => ({ ...current, [item.id]: event.target.value }))
                }
              />
            </label>
          ))}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              resetStall();
              setOpen(false);
            }}
          >
            Reset sample
          </Button>
          <Button onClick={save} className="h-10">
            Save stall
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-10" />
    </div>
  );
}
