import { describe, expect, it } from "vitest";
import { DEFAULT_MENU } from "./menu";
import { linesFromModel, linesFromNote, parseNote } from "./parse";

describe("parseNote", () => {
  it("reads the step-show table", () => {
    const hits = parseNote(
      "Two jerk plates, extra plantain, and a bottled water. Her roommate might pay for the water separately.",
      DEFAULT_MENU,
    );
    expect(hits).toEqual([
      { menuId: "jerk", qty: 2 },
      { menuId: "plantain", qty: 1 },
      { menuId: "water", qty: 1 },
    ]);
    const lines = linesFromNote(
      "Two jerk plates, extra plantain, and a bottled water.",
      DEFAULT_MENU,
    );
    const total = lines.reduce((sum, line) => sum + line.qty * line.unitPriceCents, 0);
    expect(total).toBe(2850);
  });

  it("reads a single water and a six-tee rush", () => {
    expect(parseNote("Just a bottled water.", DEFAULT_MENU)).toEqual([{ menuId: "water", qty: 1 }]);
    expect(parseNote("He wants 6 org tees tonight.", DEFAULT_MENU)).toEqual([{ menuId: "tee", qty: 6 }]);
  });

  it("does not double count a longer alias", () => {
    const hits = parseNote("An edge control tin and one org tee.", DEFAULT_MENU);
    expect(hits.map((hit) => hit.menuId).sort()).toEqual(["edge", "tee"]);
  });

  it("prices a custom line only when nothing on the menu matches", () => {
    const lines = linesFromNote("A custom banner for $40.", DEFAULT_MENU);
    expect(lines).toHaveLength(1);
    expect(lines[0].menuId).toBeUndefined();
    expect(lines[0].unitPriceCents).toBe(4000);
    expect(lines[0].name.toLowerCase()).toContain("banner");
  });

  it("refuses to let the model reprice a menu item", () => {
    const result = linesFromModel(
      [
        { menuId: "jerk", qty: 2, unitPriceCents: 100 },
        { name: "Banner", qty: 1, unitPriceCents: 2500 },
      ],
      DEFAULT_MENU,
    );
    const jerk = result.lines.find((line) => line.menuId === "jerk");
    expect(jerk?.unitPriceCents).toBe(1200);
    expect(jerk?.qty).toBe(2);
    expect(result.rejected.some((reason) => reason.includes("jerk"))).toBe(true);
    expect(result.lines.find((line) => line.name === "Banner")?.unitPriceCents).toBe(2500);
  });
});
