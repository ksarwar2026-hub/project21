import prisma from "@/lib/prisma";
import { filterProductsBySearch } from "@/lib/search/products";

function toSerializable(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function getPublicProducts({ search, limit } = {}) {
  const products = await prisma.product.findMany({
    where: {
      store: {
        is: {
          isActive: true,
        },
      },
    },
    include: {
      rating: true,
      store: true,
    },
    orderBy: [{ inStock: "desc" }, { createdAt: "desc" }],
  });

  const serializedProducts = toSerializable(products);
  const rankedProducts = search
    ? filterProductsBySearch(serializedProducts, search)
    : serializedProducts;

  if (!limit) {
    return rankedProducts;
  }

  return rankedProducts.slice(0, limit);
}

export async function getPublicProductById(productId) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      store: {
        is: {
          isActive: true,
        },
      },
    },
    include: {
      rating: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
      faqs: {
        orderBy: {
          createdAt: "asc",
        },
      },
      store: true,
    },
  });

  return product ? toSerializable(product) : null;
}

export async function getPublicStoreByUsername(username) {
  const store = await prisma.store.findFirst({
    where: {
      username,
      isActive: true,
    },
    include: {
      Product: {
        include: {
          rating: true,
          store: true,
        },
        orderBy: [{ inStock: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  return store ? toSerializable(store) : null;
}

export async function getSitemapEntries() {
  const [products, stores] = await Promise.all([
    prisma.product.findMany({
      where: {
        store: {
          is: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        updatedAt: true,
      },
    }),
    prisma.store.findMany({
      where: {
        isActive: true,
      },
      select: {
        username: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    products: toSerializable(products),
    stores: toSerializable(stores),
  };
}
