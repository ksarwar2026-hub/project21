// import prisma from "@/lib/prisma";
// import { NextResponse } from "next/server";
// // Get store info & store product

// import Product from "@/app/(public)/product/[productId]/page";

// export async function GET(request) {
//     try {
//         // Get store username from query params
//         const {searchParams} = new URL (request.url)
//         const username = searchParams.get('username').toLowerCase();

//         if(!username){
//             return NextResponse.json({error: "missing username"}, {status: 400})
//         }

//         // Get store info and inStock products with ratings
//         const store = await prisma.store.findUnique({
//             where: {username, isActive: true},
//             include : {Product : {include: {rating: true}}}
//         })

//         if(!store){
//             return NextResponse.json({error: "store not found"}, {status: 400})
//         }
//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({error: error.code || error.message}, {status : 400})
//     }
// }



// -----------------------updated-----------

// import prisma from "@/lib/prisma";
// import { NextResponse } from "next/server";

// // Get store info & store products (public)
// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const rawUsername = searchParams.get("username");

//     if (!rawUsername) {
//       return NextResponse.json(
//         { error: "missing username" },
//         { status: 400 }
//       );
//     }

//     const username = rawUsername.toLowerCase();

//     const store = await prisma.store.findFirst({
//       where: {
//         username,
//         isActive: true,
//       },
//       include: {
//         products: {
//           where: { inStock: true },
//           include: { ratings: true },
//         },
//       },
//     });

//     if (!store) {
//       return NextResponse.json(
//         { error: "store not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ store });

//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: error.message || "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }



//----------------------- updated vr 2.1--------------------


import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get store info & store products
export async function GET(request){
    try {
        // Get store username from query params
        const { searchParams } = new URL(request.url)
        const username = searchParams.get('username').toLowerCase();

        if(!username){
            return NextResponse.json({error: "missing username"}, { status: 400 })
        }

        // Get store info and inStock products with ratings
        const store = await prisma.store.findUnique({
            where: {username, isActive: true},
            include: {Product: {include: {rating: true}}}
        })

        if(!store){
            return NextResponse.json({error: "store not found"}, { status: 400 })
        }

        return NextResponse.json({store})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}