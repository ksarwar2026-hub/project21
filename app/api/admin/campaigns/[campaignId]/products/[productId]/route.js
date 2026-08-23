import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

async function requireAdmin(request) {
  const { userId } = getAuth(request);
  return authAdmin(userId);
}

export async function PUT(request, { params }) {
  try {
    const isAdmin = await requireAdmin(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { campaignId, productId } = await params;
    const { offerPrice, showOnHomepage = false, showCountdown = true } = await request.json();
    const product = await prisma.product.findUnique({ where: { id: productId } });
    const numericOfferPrice = Number(offerPrice);

    if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

    if (!Number.isFinite(numericOfferPrice) || numericOfferPrice <= 0) {
      return NextResponse.json({ error: "offer price is invalid" }, { status: 400 });
    }

    if (numericOfferPrice > product.price) {
      return NextResponse.json(
        { error: "campaign offer price must be less than or equal to normal selling price" },
        { status: 400 }
      );
    }

    const campaignProduct = await prisma.campaignProduct.update({
      where: {
        campaignId_productId: {
          campaignId,
          productId,
        },
      },
      data: {
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
      message: "Campaign product updated",
      campaignProduct,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const isAdmin = await requireAdmin(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { campaignId, productId } = await params;

    await prisma.campaignProduct.delete({
      where: {
        campaignId_productId: {
          campaignId,
          productId,
        },
      },
    });

    return NextResponse.json({ message: "Product removed from campaign" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
