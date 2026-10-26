import { describe, expect, it } from "vitest";
import {
  isSizeRequiredForCategory,
  parseProductSizes,
  sizeOptionsForCategory,
} from "@/lib/product-size";

describe("product category sizes", () => {
  it.each(["Shirts", "T-Shirts", "Jeans", "Trousers", "Other Apparel"])(
    "requires a selected size for %s",
    (category) => {
      expect(isSizeRequiredForCategory(category)).toBe(true);
    },
  );

  it.each(["Watches", "Accessories", "Perfumes", "Other products", undefined])(
    "allows an optional size for %s",
    (category) => {
      expect(isSizeRequiredForCategory(category)).toBe(false);
    },
  );

  it("offers numeric sizes for jeans and trousers", () => {
    expect(sizeOptionsForCategory("Jeans")).toContain("28");
    expect(sizeOptionsForCategory("Trousers")).toContain("44");
  });

  it("round-trips the existing comma-separated product size field", () => {
    expect(parseProductSizes("S, M, L, M")).toEqual(["S", "M", "L"]);
    expect(parseProductSizes("One Size")).toEqual(["One Size"]);
  });
});
