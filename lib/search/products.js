function normalizeText(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchableFields(product) {
  return [
    product.name,
    product.category,
    product.description,
    product.store?.name,
    product.store?.username,
  ]
    .filter(Boolean)
    .map((field) => normalizeText(field));
}

function getSearchScore(product, query) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 1;
  }

  const queryWords = normalizedQuery.split(" ").filter(Boolean);
  const searchableFields = getSearchableFields(product);

  let score = 0;

  searchableFields.forEach((field) => {
    if (!field) return;

    if (field === normalizedQuery) {
      score += 120;
    }

    if (field.startsWith(normalizedQuery)) {
      score += 80;
    }

    if (field.includes(normalizedQuery)) {
      score += 45;
    }

    queryWords.forEach((word) => {
      if (!word) return;

      if (field.startsWith(word)) {
        score += 18;
      }

      if (field.includes(word)) {
        score += 10;
      }
    });
  });

  return score;
}

export function filterProductsBySearch(products = [], query = "") {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return products;
  }

  return products
    .map((product) => ({
      product,
      score: getSearchScore(product, normalizedQuery) + (product.inStock ? 3 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return new Date(b.product.createdAt) - new Date(a.product.createdAt);
    })
    .map(({ product }) => product);
}

export function getProductSuggestions(products = [], query = "", limit = 6) {
  return filterProductsBySearch(products, query).slice(0, limit);
}
