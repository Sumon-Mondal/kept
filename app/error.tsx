"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-lg space-y-3 py-10">
      <h1 className="font-heading text-4xl">The till hit a snag.</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        The sale on screen may still be in this browser. Try the page again. Demo captures do not leave this device.
      </p>
      <Button onClick={reset} className="h-10">
        Try again
      </Button>
    </div>
  );
}
