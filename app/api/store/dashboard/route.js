// import prisma from "@/lib/prisma";
// import authSeller from "@/middlewares/authSeller";
// import { getAuth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";


// // Get Dashboard Data fo rSeller ( total orders, total earnings, total products)
// export async function GET(request){
//     try {
//         const {userId} = getAuth(request)
//         const storeId = await authSeller(userId)

//         // Get all orders for seller 
//         const orders = await prisma.order.findMany({where: {storeId}})

//         // Get all products with ratings for seller
//         const products = await prisma.product.findMany({where:{storeId}})

//         const ratings = await prisma.rating.findMany({
//             where : {productId : {in: products.map(product => product.id)}},
//             include : {user: true, product: true}
//         })

//         const dashboardDara = {
//             ratings,
//             totalOrders: orders.length,
//             totalEarnings : Math.round(orders.reduce((acc, order)=> acc + order.total, 0)),
//             totalProducts : products.length
//         }

//         return NextResponse.json({dashboardDara})
//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({error: error.code || error.message}, {status: 400})

//     }
// }

//--------------------updated--------------

// import prisma from "@/lib/prisma";
// import authSeller from "@/middlewares/authSeller";
// import { getAuth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// // Seller Dashboard Data
// export async function GET(request) {
//   try {
//     const { userId } = getAuth(request);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const storeId = await authSeller(userId);
//     if (!storeId) {
//       return NextResponse.json({ error: "not authorized" }, { status: 401 });
//     }

//     const orders = await prisma.order.findMany({
//       where: { storeId },
//       select: { total: true },
//     });

//     const products = await prisma.product.findMany({
//       where: { storeId },
//       select: { id: true },
//     });

//     const ratings = await prisma.rating.findMany({
//       where: {
//         productId: { in: products.map(p => p.id) },
//       },
//       include: {
//         user: true,
//         product: true,
//       },
//     });

//     const dashboardData = {
//       ratings,
//       totalOrders: orders.length,
//       totalEarnings: Math.round(
//         orders.reduce((acc, order) => acc + order.total, 0)
//       ),
//       totalProducts: products.length,
//     };

//     return NextResponse.json({ dashboardData });

//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: error.message || "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }




//---------------------updated vr 2.1-----------------------------------


import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// Get Dashboard Data for Seller ( total orders, total earnings, total products )
export async function GET(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        // Get all orders for seller
        const orders = await prisma.order.findMany({where: {storeId}})

         // Get all products with ratings for seller
         const products = await prisma.product.findMany({where: {storeId}})

         const ratings = await prisma.rating.findMany({
            where: {productId: {in: products.map(product => product.id)}},
            include: {user: true, product: true}
         })

         const dashboardData = {
            ratings,
            totalOrders: orders.length,
            totalEarnings: Math.round(orders.reduce((acc, order)=>  acc + order.total, 0)),
            totalProducts: products.length
         }

         return NextResponse.json({ dashboardData });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}