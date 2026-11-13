import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/sim";
const base = { WBC: 7, RBC: 5, HGB: 14, HCT: 42, PLT: 250, MCV: 90, NEUT: 60, LYMPH: 30 };
describe("CBC classification", () => {
  it("normal values are normal", () => expect(evaluate(base).severity).toBe("normal"));
  it("HGB below 7 is critical", () => expect(evaluate({ ...base, HGB: 6.5 }).severity).toBe("critical"));
  it("PLT 120 is abnormal not critical", () => expect(evaluate({ ...base, PLT: 120 }).severity).toBe("abnormal"));
  it("PLT below 50 is critical", () => expect(evaluate({ ...base, PLT: 30 }).severity).toBe("critical"));
});
