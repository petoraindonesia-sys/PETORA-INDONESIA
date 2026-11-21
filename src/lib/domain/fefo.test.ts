import { describe, it, expect } from "vitest";
import { allocateFefo } from "./fefo";

describe("fefo (BR-007)", () => {
  const batches = [
    { batchId: "B-late", available: 10, expiresAt: "2027-01-01" },
    { batchId: "B-soon", available: 5, expiresAt: "2026-12-01" },
    { batchId: "B-none", available: 10, expiresAt: null },
  ];

  it("mengambil batch paling cepat kedaluwarsa lebih dulu", () => {
    expect(allocateFefo(5, batches)).toEqual([{ batchId: "B-soon", taken: 5 }]);
  });

  it("melewati batch habis ke batch berikutnya", () => {
    expect(allocateFefo(7, batches)).toEqual([
      { batchId: "B-soon", taken: 5 },
      { batchId: "B-late", taken: 2 },
    ]);
  });

  it("batch tanpa kedaluwarsa dipakai paling akhir", () => {
    expect(allocateFefo(25, batches)).toEqual([
      { batchId: "B-soon", taken: 5 },
      { batchId: "B-late", taken: 10 },
      { batchId: "B-none", taken: 10 },
    ]);
  });

  it("menolak bila stok tidak cukup (BR-006)", () => {
    expect(() => allocateFefo(26, batches)).toThrow("Stok tidak cukup");
  });

  it("permintaan 0 tidak mengambil apa pun", () => {
    expect(allocateFefo(0, batches)).toEqual([]);
  });
});
