import prisma from "@/lib/prisma";
import { currentUser, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADDRESS_FIELDS = ["name", "email", "street", "city", "state", "zip", "country", "phone"]

function normalizeAddress(address) {
    if (!address || typeof address !== "object" || Array.isArray(address)) {
        return null
    }

    const normalized = ADDRESS_FIELDS.reduce((acc, field) => {
        acc[field] = String(address[field] || "").trim()
        return acc
    }, {})

    return ADDRESS_FIELDS.every((field) => normalized[field]) ? normalized : null
}

async function ensureUser(userId) {
    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || ""
    const name = clerkUser?.fullName || clerkUser?.username || email || "Customer"
    const image = clerkUser?.imageUrl || ""

    return prisma.user.upsert({
        where: { id: userId },
        update: {
            email,
            name,
            image,
        },
        create: {
            id: userId,
            email,
            name,
            image,
            cart: {},
        },
    })
}

// Add new address
export async function POST(request){
    try {
        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const { address } = await request.json()
        const normalizedAddress = normalizeAddress(address)

        if (!normalizedAddress) {
            return NextResponse.json({ error: "Please fill all address fields" }, { status: 400 })
        }

        await ensureUser(userId)

        const newAddress = await prisma.address.create({
            data: {
                ...normalizedAddress,
                userId,
            }
        })

        return NextResponse.json({newAddress, message: 'Address added successfully' })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Get all addresses for a user
export async function GET(request){
    try {
        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const addresses = await prisma.address.findMany({
            where: { userId }
        })

        return NextResponse.json({addresses})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
