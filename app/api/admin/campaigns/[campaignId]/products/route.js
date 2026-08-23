import prisma from "@/lib/prisma";
import { findOverlappingCampaignProduct } from "@/lib/campaigns";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

async function requireAdmin(request) {
  const { userId } = getAuth(request);
  return authAdmin(userId);
}

export async function POST(request, { params }) {
  try {
    const isAdmin = await requireAdmin(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { campaignId } = await params;
    const { productId, offerPrice, showOnHomepage = false, showCountdown = true } = await request.json();
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });
    if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

    const numericOfferPrice = Number(offerPrice);

    if (!Number.isFinite(numericOfferPrice) || numericOfferPrice <= 0) {
      return NextResponse.json({ error: "offer price is invalid" }, { status: 400 });
    }

    if (numericOfferPrice > product.price) {
      return NextResponse.json(
        { error: "campaign offer price must be less than or equal to normal selling price" },
        { status: 400 }
      );
    }

    const overlap = await findOverlappingCampaignProduct({
      productId,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      excludeCampaignId: campaignId,
    });

    if (overlap) {
      return NextResponse.json(
        { error: `${product.name} already has an overlapping campaign: ${overlap.campaign.name}` },
        { status: 400 }
      );
    }

    const campaignProduct = await prisma.campaignProduct.create({
      data: {
        campaignId,
        productId,
        offerPrice: numericOfferPrice,
        showOnHomepage: Boolean(showOnHomepage),
        showCountdown: Boolean(showCountdown),
      },
      include: {
        product: true,
        campaign: true,
      },
    });

    return NextResponse.json({
      message: "Product added to campaign",
      campaignProduct,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
