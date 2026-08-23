import prisma from "@/lib/prisma";
import {
  applyEffectiveCampaignPrices,
  applyEffectiveCampaignPrice,
  campaignProductIncludeFor,
} from "@/lib/campaigns";
import { filterProductsBySearch } from "@/lib/search/products";

function toSerializable(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function getPublicProducts({ search, limit } = {}) {
  const now = new Date();
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
      campaignProducts: campaignProductIncludeFor(now),
    },
    orderBy: [{ inStock: "desc" }, { createdAt: "desc" }],
  });

  const serializedProducts = toSerializable(applyEffectiveCampaignPrices(products, now));
  const rankedProducts = search
    ? filterProductsBySearch(serializedProducts, search)
    : serializedProducts;

  if (!limit) {
    return rankedProducts;
  }

  return rankedProducts.slice(0, limit);
}

export async function getPublicProductById(productId) {
  const now = new Date();
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
      campaignProducts: campaignProductIncludeFor(now),
    },
  });

  return product ? toSerializable(applyEffectiveCampaignPrice(product, now)) : null;
}

export async function getPublicStoreByUsername(username) {
  const now = new Date();
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
          campaignProducts: campaignProductIncludeFor(now),
        },
        orderBy: [{ inStock: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!store) return null;

  return toSerializable({
    ...store,
    Product: applyEffectiveCampaignPrices(store.Product, now),
  });
}

export async function getHomepageLimitedTimeOffers({ limit = 8 } = {}) {
  const now = new Date();
  const campaignProducts = await prisma.campaignProduct.findMany({
    where: {
      showOnHomepage: true,
      campaign: {
        startsAt: {
          lte: now,
        },
        endsAt: {
          gt: now,
        },
      },
      product: {
        store: {
          is: {
            isActive: true,
          },
        },
      },
    },
    include: {
      campaign: true,
      product: {
        include: {
          rating: true,
          store: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return toSerializable(
    campaignProducts
      .sort((a, b) => new Date(a.campaign.endsAt) - new Date(b.campaign.endsAt))
      .slice(0, limit)
      .map((campaignProduct) =>
        applyEffectiveCampaignPrice(
          {
            ...campaignProduct.product,
            campaignProducts: [campaignProduct],
          },
          now
        )
      )
  );
}

export async function getHomepageCampaignBanners({ limit = 3 } = {}) {
  const now = new Date();
  const campaigns = await prisma.campaign.findMany({
    where: {
      startsAt: {
        lte: now,
      },
      endsAt: {
        gt: now,
      },
      desktopBannerUrl: {
        not: null,
      },
      mobileBannerUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      desktopBannerUrl: true,
      mobileBannerUrl: true,
      endsAt: true,
    },
    orderBy: [{ endsAt: "asc" }],
    take: limit,
  });

  return toSerializable(campaigns);
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
