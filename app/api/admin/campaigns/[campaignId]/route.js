import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import {
  getCampaignStatus,
  validateCampaignPayload,
} from "@/lib/campaigns";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function serializeCampaign(campaign, now = new Date()) {
  return {
    ...campaign,
    status: getCampaignStatus(campaign, now),
    productCount: campaign.products?.length || 0,
  };
}

async function requireAdmin(request) {
  const { userId } = getAuth(request);
  return authAdmin(userId);
}

async function uploadCampaignBanner(file, folder) {
  if (!file || typeof file.arrayBuffer !== "function") return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const response = await imagekit.upload({
    file: buffer,
    fileName: file.name,
    folder,
  });

  return {
    url: imagekit.url({
      path: response.filePath,
      transformation: [{ quality: "auto" }, { format: "webp" }, { width: "1920" }],
    }),
    fileId: response.fileId,
  };
}

async function parseCampaignRequest(request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return {
      payload: await request.json(),
      desktopBanner: null,
      mobileBanner: null,
    };
  }

  const formData = await request.formData();
  const payload = {
    name: formData.get("name"),
    description: formData.get("description"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    desktopBannerUrl: formData.get("desktopBannerUrl"),
    mobileBannerUrl: formData.get("mobileBannerUrl"),
    desktopBannerFileId: formData.get("desktopBannerFileId"),
    mobileBannerFileId: formData.get("mobileBannerFileId"),
    products: JSON.parse(formData.get("products") || "[]"),
  };

  return {
    payload,
    desktopBanner: formData.get("desktopBanner"),
    mobileBanner: formData.get("mobileBanner"),
  };
}

export async function GET(request, { params }) {
  try {
    const isAdmin = await requireAdmin(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { campaignId } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                store: {
                  select: {
                    name: true,
                    isActive: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign: serializeCampaign(campaign) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  try {
    const isAdmin = await requireAdmin(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { campaignId } = await params;
    const { payload, desktopBanner, mobileBanner } = await parseCampaignRequest(request);
    const result = await validateCampaignPayload(payload, { excludeCampaignId: campaignId });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const [uploadedDesktopBanner, uploadedMobileBanner] = await Promise.all([
      uploadCampaignBanner(desktopBanner, "campaign-banners/desktop"),
      uploadCampaignBanner(mobileBanner, "campaign-banners/mobile"),
    ]);

    const campaign = await prisma.$transaction(async (tx) => {
      await tx.campaignProduct.deleteMany({
        where: {
          campaignId,
        },
      });

      return tx.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          name: result.campaign.name,
          description: result.campaign.description,
          desktopBannerUrl: uploadedDesktopBanner?.url || payload.desktopBannerUrl || null,
          desktopBannerFileId:
            uploadedDesktopBanner?.fileId || payload.desktopBannerFileId || null,
          mobileBannerUrl: uploadedMobileBanner?.url || payload.mobileBannerUrl || null,
          mobileBannerFileId: uploadedMobileBanner?.fileId || payload.mobileBannerFileId || null,
          startsAt: result.campaign.startsAt,
          endsAt: result.campaign.endsAt,
          products: {
            create: result.campaign.products.map((product) => ({
              productId: product.productId,
              offerPrice: product.offerPrice,
              showOnHomepage: product.showOnHomepage,
              showCountdown: product.showCountdown,
            })),
          },
        },
        include: {
          products: {
            include: {
              product: {
                include: {
                  store: {
                    select: {
                      name: true,
                      isActive: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json({
      message: "Campaign updated successfully",
      campaign: serializeCampaign(campaign),
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

    const { campaignId } = await params;

    await prisma.campaign.delete({
      where: {
        id: campaignId,
      },
    });

    return NextResponse.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
