import { describe, expect, it } from "vitest";
import { PRESETS } from "./presets";
import { assessRisk } from "./risk";
import { DEFAULT_MENU } from "./menu";
import { linesFromNote } from "./parse";

describe("assessRisk", () => {
  it("keeps the step-show table at medium, not a hold", () => {
    const note = PRESETS.find((preset) => preset.id === "step")!.note;
    const lines = linesFromNote(note, DEFAULT_MENU);
    const risk = assessRisk(note, lines);
    expect(risk.level).toBe("medium");
    expect(risk.flags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining(["off_platform", "third_party", "urgency"]),
    );
    expect(risk.flags.some((flag) => flag.code === "screenshot")).toBe(false);
  });

  it("holds the screenshot rush", () => {
    const note = PRESETS.find((preset) => preset.id === "screenshot")!.note;
    const lines = linesFromNote(note, DEFAULT_MENU);
    const risk = assessRisk(note, lines);
    expect(risk.level).toBe("high");
    expect(lines[0].qty).toBe(6);
    expect(risk.flags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining(["screenshot", "off_platform", "bulk"]),
    );
  });

  it("leaves a plain water alone", () => {
    const note = PRESETS.find((preset) => preset.id === "water")!.note;
    const lines = linesFromNote(note, DEFAULT_MENU);
    expect(assessRisk(note, lines).level).toBe("low");
  });
});
