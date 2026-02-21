// import imagekit from "@/config/imageKit";
// import authSeller from "@/middlewares/authSeller";
// import prisma from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// // Add a new product 
// export async function POST(request) {
//   try {
//     const { userId } = getAuth(request);
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const storeId = await authSeller(userId);
//     if (!storeId) {
//       return NextResponse.json({ error: "not authorized" }, { status: 401 });
//     }

//     const formData = await request.formData();
//     const name = formData.get("name");
//     const description = formData.get("description");
//     const mrp = Number(formData.get("mrp"));
//     const price = Number(formData.get("price"));
//     const category = formData.get("category");
//     const images = formData.getAll("images");

//     if (!name || !description || !mrp || !price || !category || images.length < 1) {
//       return NextResponse.json({ error: "missing product details" }, { status: 400 });
//     }

//     const imagesUrl = await Promise.all(
//       images.map(async (image) => {
//         const buffer = Buffer.from(await image.arrayBuffer());

//         const response = await imagekit.upload({
//           file: buffer,
//           fileName: image.name,
//           folder: "/products",
//         });

//         return `${response.url}?tr=w-1024,f-webp,q-auto`;
//       })
//     );

//     await prisma.product.create({
//       data: {
//         name,
//         description,
//         mrp,
//         price,
//         category,
//         images: imagesUrl,
//         storeId,
//       },
//     });

//     return NextResponse.json({ message: "Product added successfully" });

//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: error.message || "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }

// //Get all products for a seller
// export async function GET(request) {
//   try {
//     const { userId } = getAuth(request);
//     const storeId = await authSeller(userId);
//     if (!storeId) {
//       return NextResponse.json({ error: "not authorized" }, { status: 401 });
//     }
//     const products = await prisma.product.findMany({where :{ storeId }})
//     return NextResponse.json({products})

    
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: error.message || "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }



// //----------------------- updated vr 2.1--------------------

// import imagekit from "@/configs/imageKit"
// import prisma from "@/lib/prisma"
// import authSeller from "@/middlewares/authSeller"
// import {getAuth} from "@clerk/nextjs/server"
// import { NextResponse } from "next/server";

// // Add a new product
// export async function POST(request){
//     try {
//         const { userId } = getAuth(request)
//         const storeId = await authSeller(userId)

//         if(!storeId){
//             return NextResponse.json({error: 'not authorized'}, { status: 401 } )
//         }
//         // Get the data from the form
//         const formData = await request.formData()
//         const name = formData.get("name")
//         const description = formData.get("description")
//         const mrp =  Number(formData.get("mrp"))
//         const price = Number(formData.get("price"))
//         const category = formData.get("category")
//         const images = formData.getAll("images")

//         if(!name || !description || !mrp || !price || !category || images.length < 1){
//             return NextResponse.json({error: 'missing product details'}, { status: 400 } )
//         }

//         // Uploading Images to ImageKit
//         const imagesUrl = await Promise.all(images.map(async (image) => {
//             const buffer = Buffer.from(await image.arrayBuffer());
//             const response = await imagekit.upload({
//                 file: buffer,
//                 fileName: image.name,
//                 folder: "products",
//             })
//             const url = imagekit.url({
//                 path: response.filePath,
//                 transformation: [
//                     { quality: 'auto' },
//                     { format: 'webp' },
//                     { width: '1024' }
//                 ]
//             })
//             return url
//         }))

//         await prisma.product.create({
//              data: {
//                 name,
//                 description,
//                 mrp,
//                 price,
//                 category,
//                 images: imagesUrl,
//                 storeId
//              }
//         })

//          return NextResponse.json({message: "Product added successfully"})

//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({ error: error.code || error.message }, { status: 400 })
//     }
// }

// // Get all products for a seller
// export async function GET(request){
//     try {
//         const { userId } = getAuth(request)
//         const storeId = await authSeller(userId)

//         if(!storeId){
//             return NextResponse.json({error: 'not authorized'}, { status: 401 } )
//         }
//         const products = await prisma.product.findMany({ where: { storeId }})

//         return NextResponse.json({products})
//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({ error: error.code || error.message }, { status: 400 })
//     }
// }


//--------------------------FAQs updated -----------------------------

import imagekit from "@/configs/imageKit"
import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server";

// Add a new product
export async function POST(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: 'not authorized'}, { status: 401 })
        }

        // Get form data
        const formData = await request.formData()

        const name = formData.get("name")
        const description = formData.get("description")
        const mrp = Number(formData.get("mrp"))
        const price = Number(formData.get("price"))
        const category = formData.get("category")
        const images = formData.getAll("images")

        // ✅ GET FAQ DATA
        const faqsRaw = formData.get("faqs")
        const faqs = faqsRaw ? JSON.parse(faqsRaw) : []

        if(!name || !description || !mrp || !price || !category || images.length < 1){
            return NextResponse.json({error: 'missing product details'}, { status: 400 })
        }

        // Upload images to ImageKit
        const imagesUrl = await Promise.all(
            images.map(async (image) => {
                const buffer = Buffer.from(await image.arrayBuffer())
                const response = await imagekit.upload({
                    file: buffer,
                    fileName: image.name,
                    folder: "products",
                })

                const url = imagekit.url({
                    path: response.filePath,
                    transformation: [
                        { quality: 'auto' },
                        { format: 'webp' },
                        { width: '1024' }
                    ]
                })

                return url
            })
        )

        // ✅ CREATE PRODUCT WITH NESTED FAQ
        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId,
                faqs: {
                    create: faqs
                        .filter(f => f.question && f.answer) // avoid empty rows
                        .map(faq => ({
                            question: faq.question,
                            answer: faq.answer
                        }))
                }
            }
        })

        return NextResponse.json({ message: "Product added successfully" })

    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        )
    }
}

// Get all products for a seller
export async function GET(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: 'not authorized'}, { status: 401 })
        }

        const products = await prisma.product.findMany({
            where: { storeId },
            include: {
                faqs: true   // ✅ include FAQs for seller dashboard
            }
        })

        return NextResponse.json({ products })

    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        )
    }
}