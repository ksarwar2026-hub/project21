// import {inngest} from './client'
// import prisma from '@/lib/prisma'

// //Inngest function to save user data to a database
// export const syncUserCreation = inngest.createFunction(
//     {id : 'sync-user-create'},
//     {event : 'clerk/user.created'},
//     async ({event}) => {
//         const {data} = event
//         await prisma.user.create({
//             data : {
//                 id : data.id,
//                 email: data.email_addresses[0].email_addresses,
//                 name: `${data.first_name} ${data.last_name}`,
//                 image : data.image_url,
//             }
//         })
//     }
// )

// // Inngest Function to update user data in database
// export const syncUserUpdation = inngest.createFunction(
//     {id: 'sync-user-update'},
//     {event : 'clerk/user.updated'},
//     async ({event}) => {
//         const {data} = event
//         await prisma.user.update({
//             where: {id: data.id,},
//             data : {
//                 email: data.email_addresses[0].email_addresses,
//                 name: `${data.first_name} ${data.last_name}`,
//                 image : data.image_url,
//             }
//         })
//     }
// )

// //Inngest Function to delete user from database
// export const syncUserDeletion = inngest.createFunction(
//      {id: 'sync-user-delete'},
//     {event : 'clerk/user.deleted'},
//     async ({event}) => {
//         const {data} = event
//         await prisma.user.delete({
//             where: {id: data.id,}
//         })
//     }
// )

//-----------------------------updated code


import { inngest } from "./client";
import prisma from "@/lib/prisma";

// helper
const getName = (data) =>
  `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null;

const getEmail = (data) =>
  data.email_addresses?.[0]?.email_address ?? null;

// ✅ CREATE / UPSERT USER
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-create" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: getEmail(data),
        name: getName(data),
        image: data.image_url ?? null,
      },
      create: {
        id: data.id,
        email: getEmail(data),
        name: getName(data),
        image: data.image_url ?? null,
        cart: [],
      },
    });
  }
);

// ✅ UPDATE USER (SAFE)
export const syncUserUpdation = inngest.createFunction(
  { id: "sync-user-update" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: getEmail(data),
        name: getName(data),
        image: data.image_url ?? null,
      },
      create: {
        id: data.id,
        email: getEmail(data),
        name: getName(data),
        image: data.image_url ?? null,
        cart: [],
      },
    });
  }
);

// ✅ DELETE USER
export const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-delete" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.deleteMany({
      where: { id: data.id },
    });
  }
);
