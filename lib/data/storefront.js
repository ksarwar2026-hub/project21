import prisma from "@/lib/prisma";
import { filterProductsBySearch } from "@/lib/search/products";

function toSerializable(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function getPublicProducts({ search, limit } = {}) {
  const products = await prisma.product.findMany({
    where: {
      inStock: true,
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
    orderBy: {
      createdAt: "desc",
    },
    ...(limit ? { take: limit } : {}),
  });

  const serializedProducts = toSerializable(products);

  if (!search) {
    return serializedProducts;
  }

  return filterProductsBySearch(serializedProducts, search);
}

export async function getPublicProductById(productId) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      inStock: true,
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
        where: {
          inStock: true,
        },
        include: {
          rating: true,
          store: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return store ? toSerializable(store) : null;
}

export async function getSitemapEntries() {
  const [products, stores] = await Promise.all([
    prisma.product.findMany({
      where: {
        inStock: true,
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
