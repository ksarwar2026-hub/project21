import prisma from "@/lib/prisma";
import { applyEffectiveCampaignPrices, campaignProductIncludeFor } from "@/lib/campaigns";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request){
    try {
        const now = new Date();
        let products = await prisma.product.findMany({
            where: {},
            include: {
                rating: {
                    select: {
                        createdAt: true,
                        rating: true,
                        review: true,
                        user: { select: { name: true, image: true } }
                    }
                },
                store: true,
                campaignProducts: campaignProductIncludeFor(now),
                faqs: {
                    orderBy: { createdAt: "asc" }  // optional but clean
                }
            },
            orderBy: [{ inStock: 'desc' }, { createdAt: 'desc' }]
        })

        // remove products with store isActive false
        products = products.filter(product => product.store.isActive)
        products = applyEffectiveCampaignPrices(products, now)

        return NextResponse.json({ products })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }
}
