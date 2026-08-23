import prisma from "@/lib/prisma";

export function getCampaignStatus(campaign, now = new Date()) {
  const startsAt = new Date(campaign.startsAt);
  const endsAt = new Date(campaign.endsAt);

  if (now < startsAt) return "Scheduled";
  if (now >= endsAt) return "Expired";
  return "Active";
}

export function getActiveCampaignProduct(product, now = new Date()) {
  const campaignProducts = Array.isArray(product?.campaignProducts)
    ? product.campaignProducts
    : [];

  const activeCampaignProducts = campaignProducts
    .filter((campaignProduct) => {
      const campaign = campaignProduct.campaign;
      if (!campaign) return false;

      const startsAt = new Date(campaign.startsAt);
      const endsAt = new Date(campaign.endsAt);

      return startsAt <= now && now < endsAt;
    })
    .sort((a, b) => new Date(a.campaign.endsAt) - new Date(b.campaign.endsAt));

  return activeCampaignProducts[0] || null;
}

export function applyEffectiveCampaignPrice(product, now = new Date()) {
  const activeCampaignProduct = getActiveCampaignProduct(product, now);
  const campaignProducts = product?.campaignProducts;
  const baseProduct = { ...product };

  delete baseProduct.campaignProducts;

  if (!activeCampaignProduct) {
    return {
      ...baseProduct,
      effectivePrice: product.price,
      activeCampaign: null,
    };
  }

  return {
    ...baseProduct,
    effectivePrice: activeCampaignProduct.offerPrice,
    activeCampaign: {
      id: activeCampaignProduct.campaign.id,
      name: activeCampaignProduct.campaign.name,
      description: activeCampaignProduct.campaign.description,
      desktopBannerUrl: activeCampaignProduct.campaign.desktopBannerUrl,
      mobileBannerUrl: activeCampaignProduct.campaign.mobileBannerUrl,
      startsAt: activeCampaignProduct.campaign.startsAt,
      endsAt: activeCampaignProduct.campaign.endsAt,
      offerPrice: activeCampaignProduct.offerPrice,
      showOnHomepage: activeCampaignProduct.showOnHomepage,
      showCountdown: activeCampaignProduct.showCountdown,
      conflictCount: Array.isArray(campaignProducts) ? campaignProducts.length : 1,
    },
  };
}

export function applyEffectiveCampaignPrices(products, now = new Date()) {
  return products.map((product) => applyEffectiveCampaignPrice(product, now));
}

export function campaignProductIncludeFor(now = new Date()) {
  return {
    where: {
      campaign: {
        startsAt: {
          lte: now,
        },
        endsAt: {
          gt: now,
        },
      },
    },
    include: {
      campaign: true,
    },
  };
}

export function normalizeCampaignPayload(payload = {}) {
  return {
    name: String(payload.name || "").trim(),
    description: String(payload.description || "").trim(),
    startsAt: new Date(payload.startsAt),
    endsAt: new Date(payload.endsAt),
    products: Array.isArray(payload.products) ? payload.products : [],
  };
}

export async function validateCampaignPayload(payload, { excludeCampaignId } = {}) {
  const campaign = normalizeCampaignPayload(payload);

  if (!campaign.name) {
    return { error: "campaign name is required" };
  }

  if (Number.isNaN(campaign.startsAt.getTime()) || Number.isNaN(campaign.endsAt.getTime())) {
    return { error: "campaign start and end dates are required" };
  }

  if (campaign.endsAt <= campaign.startsAt) {
    return { error: "campaign end must be after campaign start" };
  }

  const seenProductIds = new Set();
  const productIds = [];

  for (const item of campaign.products) {
    const productId = String(item.productId || "").trim();

    if (!productId) {
      return { error: "campaign product is missing a product id" };
    }

    if (seenProductIds.has(productId)) {
      return { error: "a product can only be added once to a campaign" };
    }

    seenProductIds.add(productId);
    productIds.push(productId);
  }

  const products = productIds.length
    ? await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
          mrp: true,
        },
      })
    : [];

  const productsById = new Map(products.map((product) => [product.id, product]));

  for (const item of campaign.products) {
    const productId = String(item.productId || "").trim();
    const product = productsById.get(productId);
    const offerPrice = Number(item.offerPrice);

    if (!product) {
      return { error: "selected product was not found" };
    }

    if (!Number.isFinite(offerPrice) || offerPrice <= 0) {
      return { error: `${product.name} has an invalid offer price` };
    }

    if (offerPrice > product.price) {
      return {
        error: `${product.name} campaign offer price must be less than or equal to its normal selling price`,
      };
    }

    const overlappingCampaignProduct = await findOverlappingCampaignProduct({
      productId,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      excludeCampaignId,
    });

    if (overlappingCampaignProduct) {
      return {
        error: `${product.name} already has an overlapping campaign: ${overlappingCampaignProduct.campaign.name}`,
      };
    }
  }

  return {
    campaign: {
      ...campaign,
      description: campaign.description || null,
      products: campaign.products.map((item) => ({
        productId: String(item.productId || "").trim(),
        offerPrice: Number(item.offerPrice),
        showOnHomepage: Boolean(item.showOnHomepage),
        showCountdown: Boolean(item.showCountdown),
      })),
    },
  };
}

export async function findOverlappingCampaignProduct({
  productId,
  startsAt,
  endsAt,
  excludeCampaignId,
}) {
  return prisma.campaignProduct.findFirst({
    where: {
      productId,
      ...(excludeCampaignId
        ? {
            campaignId: {
              not: excludeCampaignId,
            },
          }
        : {}),
      campaign: {
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
      },
    },
    include: {
      campaign: true,
    },
  });
}
