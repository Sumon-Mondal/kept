import { describe, expect, it } from "vitest";
import { extractJson, parseDraft } from "./llm";

describe("model JSON", () => {
  it("reads fenced JSON and ignores a price the prose tries to sneak past the schema", () => {
    const draft = parseDraft(
      extractJson('```json\n{"lines":[{"menuId":"water","qty":1}],"buyerLine":"It is $2.06.","receipt":"You keep $1.50."}\n```'),
    );
    expect(draft.lines).toEqual([{ menuId: "water", qty: 1 }]);
    expect(draft.buyerLine).toContain("$2.06");
  });

  it("rejects an empty payload", () => {
    expect(() => parseDraft(null)).toThrow(/empty/i);
  });
});
