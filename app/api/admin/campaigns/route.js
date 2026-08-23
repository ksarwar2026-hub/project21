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
    products: JSON.parse(formData.get("products") || "[]"),
  };

  return {
    payload,
    desktopBanner: formData.get("desktopBanner"),
    mobileBanner: formData.get("mobileBanner"),
  };
}

export async function GET(request) {
  try {
    const isAdmin = await requireAdmin(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const statusFilter = request.nextUrl.searchParams.get("status")?.toLowerCase();
    const [campaigns, products] = await Promise.all([
      prisma.campaign.findMany({
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  mrp: true,
                  images: true,
                  category: true,
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
        orderBy: [{ startsAt: "desc" }],
      }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          mrp: true,
          images: true,
          category: true,
          store: {
            select: {
              name: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    const now = new Date();
    const serializedCampaigns = campaigns.map((campaign) => serializeCampaign(campaign, now));

    return NextResponse.json({
      campaigns: ["active", "scheduled", "expired"].includes(statusFilter)
        ? serializedCampaigns.filter((campaign) => campaign.status.toLowerCase() === statusFilter)
        : serializedCampaigns,
      products,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await requireAdmin(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { payload, desktopBanner, mobileBanner } = await parseCampaignRequest(request);
    const result = await validateCampaignPayload(payload);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const [uploadedDesktopBanner, uploadedMobileBanner] = await Promise.all([
      uploadCampaignBanner(desktopBanner, "campaign-banners/desktop"),
      uploadCampaignBanner(mobileBanner, "campaign-banners/mobile"),
    ]);

    const campaign = await prisma.campaign.create({
      data: {
        name: result.campaign.name,
        description: result.campaign.description,
        desktopBannerUrl: uploadedDesktopBanner?.url || null,
        desktopBannerFileId: uploadedDesktopBanner?.fileId || null,
        mobileBannerUrl: uploadedMobileBanner?.url || null,
        mobileBannerFileId: uploadedMobileBanner?.fileId || null,
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
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Campaign created successfully",
      campaign: serializeCampaign(campaign),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
