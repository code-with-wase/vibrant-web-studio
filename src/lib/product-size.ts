const sizeIndependentCategory =
  /\b(watches?|clocks?|wallets?|accessor(?:y|ies)|sunglasses|eyewear|perfumes?|fragrances?|bags?|jewell?ery|jewelry|rings?|bracelets?|chains?|caps?|hats?|ties?)\b/i;
const sizeBasedCategory =
  /\b(apparel|clothing|wear|shirts?|tees?|t[\s-]?shirts?|tshirts?|jeans?|trousers?|pants?|shorts?|jackets?|coats?|hoodies?|sweaters?|sweatshirts?|dresses?|skirts?|suits?|blazers?|uniforms?|kurtas?|salwar|leggings?|innerwear|underwear|socks?|shoes?|footwear|sneakers?|boots?)\b/i;

export function isSizeRequiredForCategory(categoryName: string | undefined): boolean {
  if (!categoryName?.trim() || sizeIndependentCategory.test(categoryName)) return false;
  return sizeBasedCategory.test(categoryName);
}

export function sizeOptionsForCategory(categoryName: string | undefined): string[] {
  if (/\b(jeans?|trousers?|pants?|shorts?)\b/i.test(categoryName ?? "")) {
    return Array.from({ length: 19 }, (_, index) => String(26 + index * 2));
  }
  if (/\b(shoes?|footwear|sneakers?|boots?)\b/i.test(categoryName ?? "")) {
    return Array.from({ length: 13 }, (_, index) => String(35 + index));
  }
  return ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
}

export function parseProductSizes(value: string): string[] {
  return [...new Set(value.split(",").map((size) => size.trim()).filter(Boolean))];
}
