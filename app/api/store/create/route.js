// import imagekit from "@/config/imageKit";
// import prisma from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { err } from "inngest/types";
// import { NextResponse } from "next/server";

// // create the store
// export async function POST(request){
//     try{
//         const {userId} = getAuth(request)
//         // Get the data from form
//         const formData = await request.formData()

//         const name = formData.get("name")
//         const username = formData.get("username")
//         const description = formData.get("description")
//         const email = formData.get("email")
//         const contact = formData.get("contact")
//         const address = formData.get("address")
//         const image = formData.get("image")

//         if(!name || !username || !description || !email || !contact || !address || !image){
//             return NextResponse.json({error: "missing store info"}, {status : 400})
//         }

//         // check is user have already refistered a store
//         const store = await prisma.store.findFirst({
//             where : {userId : userId}
//         })

//         //if store is already registered then send status of store
//         if (store) {
//             return NextResponse.json({status : store.status})
//         }

//         // check is username is already taken
//         const isUserNameTaken = await prisma.store.findFirst({
//             where : {username: username.toLowerCase() }
//         })

//         if (isUserNameTaken) {
//             return NextResponse.json({error : "username already taken"}, {status : 400})
//         }

//         //image upload to imagekit
//         const buffer = Buffer.from(await image.arrayBuffer());
//         const response = await imagekit.upload({
//             file : buffer,
//             fileName : image.name,
//             folder : "logos"
//         })

//         const optimizedImage = imagekit.url({
//             path : response.filePath,
//             transformation : [
//                 {quality : 'auto'},
//                 { format: 'webp'},
//                 {width : '512'}
//             ]
//         })

//         const newStore = await prisma.store.create({
//             data : {
//                 userId,
//                 name,
//                 description,
//                 username : username.toLowerCase(),
//                 email,
//                 contact,
//                 address,
//                 logo : optimizedImage
//             }
//         })

//         // link store to user
//         await prisma.user.update({
//             where: {Id : userId},
//             date : {store : {contact: {id: newStore.id}}}
//         })
        
//         return NextResponse.json({message: "applied, waiting for approval"})
        
//     }catch (error){
//         console.error(error);
//         return NextResponse.json({error : error.code || error.message}, {status: 400})

//     }
// }

// // check is user have already registered a store if yes then send status of store

// export async function GET(request) {
//     try {
//         const {userId} = getAuth(request)

//          // check is user have already refistered a store
//         const store = await prisma.store.findFirst({
//             where : {userId : userId}
//         })

//         //if store is already registered then send status of store
//         if (store) {
//             return NextResponse.json({status : store.status})
//         }

//         return NextResponse.json({status: "not registered"})
//     } catch (error) {
//          console.error(error);
//         return NextResponse.json({error : error.code || error.message}, {status: 400})
//     }
// }


//----------------------updated ---------------------------

// import imagekit from "@/config/imageKit";
// import prisma from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// /* =========================
//    CREATE STORE (POST)
// ========================= */
// export async function POST(request) {
//   try {
//     const { userId } = getAuth(request);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const formData = await request.formData();

//     const name = formData.get("name");
//     const username = formData.get("username");
//     const description = formData.get("description");
//     const email = formData.get("email");
//     const contact = formData.get("contact");
//     const address = formData.get("address");
//     const image = formData.get("image");

//     if (
//       !name ||
//       !username ||
//       !description ||
//       !email ||
//       !contact ||
//       !address ||
//       !image
//     ) {
//       return NextResponse.json(
//         { error: "missing store info" },
//         { status: 400 }
//       );
//     }

//     // check if store already exists
//     const existingStore = await prisma.store.findFirst({
//       where: { userId },
//     });

//     if (existingStore) {
//       return NextResponse.json({ status: existingStore.status });
//     }

//     // check username uniqueness
//     const isUserNameTaken = await prisma.store.findFirst({
//       where: { username: username.toLowerCase() },
//     });

//     if (isUserNameTaken) {
//       return NextResponse.json(
//         { error: "username already taken" },
//         { status: 400 }
//       );
//     }

//     // upload image to ImageKit
//     const buffer = Buffer.from(await image.arrayBuffer());

//     const uploadResponse = await imagekit.upload({
//       file: buffer,
//       fileName: image.name,
//       folder: "/logos",
//     });

//     // optimized image URL
//     const optimizedImage = `${uploadResponse.url}?tr=w-512,f-webp,q-auto`;

//     const newStore = await prisma.store.create({
//       data: {
//         userId,
//         name,
//         description,
//         username: username.toLowerCase(),
//         email,
//         contact,
//         address,
//         logo: optimizedImage,
//         status: "pending", // recommended default
//       },
//     });

//     // link store to user
//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         storeId: newStore.id,
//       },
//     });

//     return NextResponse.json({
//       message: "applied, waiting for approval",
//       status: "pending",
//     });

//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: error.message || "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }

// /* =========================
//    GET STORE STATUS (GET)
//    (Frontend display ke liye)
// ========================= */
// export async function GET(request) {
//   try {
//     const { userId } = getAuth(request);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const store = await prisma.store.findFirst({
//       where: { userId },
//       select: {
//         status: true,
//         name: true,
//         username: true,
//         logo: true,
//       },
//     });

//     if (!store) {
//       return NextResponse.json({ status: "not registered" });
//     }

//     return NextResponse.json({
//       status: store.status,
//       store,
//     });

//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: error.message || "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }



//--------------------------------updated Vr 2.1--------------------------



import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// create the store
export async function POST(request){
    try {
        const {userId} = getAuth(request)
        // Get the data from the form
        const formData = await request.formData()

        const name = formData.get("name")
        const username = formData.get("username").trim()
        const description = formData.get("description")
        const email = formData.get("email")
        const contact = formData.get("contact")
        const address = formData.get("address")
        const image = formData.get("image")

        if(!name || !username || !description || !email || !contact || !address || !image){
            return NextResponse.json({error: "missing store info"}, {status: 400})
        }

        // check is user have already registered a store
        const store = await prisma.store.findFirst({
            where: { userId: userId}
        })

        // if store is already registered then send status of store
        if(store){
            return NextResponse.json({status: store.status})
        }

        // check is username is already taken
        const isUsernameTaken = await prisma.store.findFirst({
            where: { username: username.toLowerCase() }
        })

        if(isUsernameTaken){
            return NextResponse.json({error: "username already taken"}, {status: 400})
        }

        // image upload to imagekit
        const buffer = Buffer.from(await image.arrayBuffer());
        const response = await imagekit.upload({
            file: buffer,
            fileName: image.name,
            folder: "logos"
        })

        const optimizedImage = imagekit.url({
            path: response.filePath,
            transformation: [
                {quality: 'auto'},
                { format: 'webp' },
                { width: '512' }
            ]
        })

        const newStore = await prisma.store.create({
            data: {
                userId,
                name,
                description,
                username: username.toLowerCase(),
                email,
                contact,
                address,
                logo: optimizedImage
            }
        })

        //  link store to user
        await prisma.user.update({
            where: { id: userId },
            data: {store: {connect: {id: newStore.id}}}
        })

        return NextResponse.json({message: "applied, waiting for approval"})

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, { status: 400 })
    }
}

// check is user have already registered a store if yes then send status of store

export async function GET(request) {
    try {
        const {userId} = getAuth(request)

        // check is user have already registered a store
        const store = await prisma.store.findFirst({
            where: { userId: userId}
        })

        // if store is already registered then send status of store
        if(store){
            return NextResponse.json({status: store.status})
        }

        return NextResponse.json({status: "not registered"})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, { status: 400 })
    }
}