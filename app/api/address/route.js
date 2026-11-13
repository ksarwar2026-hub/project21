import prisma from "@/lib/prisma";
import { currentUser, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADDRESS_FIELDS = ["name", "email", "street", "city", "state", "zip", "country", "phone"]
const CHECKOUT_AUTH_REQUIRED = {
    code: "AUTH_REQUIRED",
    error: "Please log in to securely complete checkout.",
}

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

function getIndianLocalDigits(phone) {
    if (typeof phone !== "string") {
        throw new Error("Please enter a valid 10-digit Indian mobile number.")
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
        throw new Error("Please enter a valid 10-digit Indian mobile number.")
    }

    return phone
}

function getStoredIndianPhoneIdentity(phone) {
    if (typeof phone !== "string") {
        return null
    }

    const rawPhone = phone.trim()
    const digits = rawPhone.replace(/\D/g, "")

    if (/^[6-9]\d{9}$/.test(digits)) {
        return digits
    }

    if (
        rawPhone.startsWith("+") &&
        digits.length === 12 &&
        digits.startsWith("91") &&
        /^[6-9]\d{9}$/.test(digits.slice(2))
    ) {
        return digits.slice(2)
    }

    return null
}

function isSameIndiaAddress(existingAddress, normalizedAddress, localDigits) {
    const existingCountry = String(existingAddress.country || "").trim().toUpperCase()

    return (
        (existingCountry === "IN" || existingCountry === "INDIA") &&
        existingAddress.name === normalizedAddress.name &&
        existingAddress.email === normalizedAddress.email &&
        existingAddress.street === normalizedAddress.street &&
        existingAddress.city === normalizedAddress.city &&
        existingAddress.state === normalizedAddress.state &&
        existingAddress.zip === normalizedAddress.zip &&
        getStoredIndianPhoneIdentity(existingAddress.phone) === localDigits
    )
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
            return NextResponse.json(CHECKOUT_AUTH_REQUIRED, { status: 401 })
        }

        const { address } = await request.json()
        const normalizedAddress = normalizeAddress(address)

        if (!normalizedAddress) {
            return NextResponse.json({ error: "Please fill all address fields" }, { status: 400 })
        }

        if (normalizedAddress.country !== "IN") {
            return NextResponse.json({ error: "Only India addresses are supported" }, { status: 400 })
        }

        const localPhone = getIndianLocalDigits(normalizedAddress.phone)
        const e164Phone = `+91${localPhone}`

        await ensureUser(userId)

        const existingAddresses = await prisma.address.findMany({
            where: {
                userId,
                name: normalizedAddress.name,
                email: normalizedAddress.email,
                street: normalizedAddress.street,
                city: normalizedAddress.city,
                state: normalizedAddress.state,
                zip: normalizedAddress.zip,
            }
        })
        const existingAddress = existingAddresses.find((candidate) =>
            isSameIndiaAddress(candidate, normalizedAddress, localPhone)
        )

        if (existingAddress) {
            const updatedAddress = existingAddress.phone === e164Phone && existingAddress.country === "IN"
                ? existingAddress
                : await prisma.address.update({
                    where: { id: existingAddress.id },
                    data: { phone: e164Phone, country: "IN" },
                })

            return NextResponse.json({newAddress: updatedAddress, message: 'Delivery address selected' })
        }

        const newAddress = await prisma.address.create({
            data: {
                ...normalizedAddress,
                country: "IN",
                phone: e164Phone,
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
            return NextResponse.json(CHECKOUT_AUTH_REQUIRED, { status: 401 })
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
