import { describe, expect, it } from "vitest";
import { lockDialogScroll } from "./modal";

describe("nested modal scroll ownership", () => {
  it("keeps a parent locked after a child closes and restores the exact prior value", () => {
    const doc = { body: { style: { overflow: "clip" } } } as Document;
    const closeParent = lockDialogScroll(doc);
    const closeChild = lockDialogScroll(doc);
    expect(doc.body.style.overflow).toBe("hidden");
    closeChild();
    expect(doc.body.style.overflow).toBe("hidden");
    closeChild(); // duplicate cleanup cannot release another owner
    expect(doc.body.style.overflow).toBe("hidden");
    closeParent();
    expect(doc.body.style.overflow).toBe("clip");
  });
  it("releases correctly when parents unmount before children", () => {
    const doc = { body: { style: { overflow: "" } } } as Document;
    const first = lockDialogScroll(doc);
    const second = lockDialogScroll(doc);
    first(); expect(doc.body.style.overflow).toBe("hidden");
    second(); expect(doc.body.style.overflow).toBe("");
    const next = lockDialogScroll(doc); next();
    expect(doc.body.style.overflow).toBe("");
  });
});
