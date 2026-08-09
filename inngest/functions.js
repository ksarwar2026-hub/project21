import { inngest } from "./client";
import prisma from "@/lib/prisma";

// helper
const getName = (data) =>
  `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null;

const getEmail = (data) =>
  data.email_addresses?.[0]?.email_address ?? null;

// ✅ CREATE / UPSERT USER
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-create", triggers: [{ event: "clerk/user.created" }] },
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
  { id: "sync-user-update", triggers: [{ event: "clerk/user.updated" }] },
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
  { id: "sync-user-delete", triggers: [{ event: "clerk/user.deleted" }] },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.deleteMany({
      where: { id: data.id },
    });
  }
);


// Inngest Function to delete coupon on expiry
export const deleteCouponOnExpiry = inngest.createFunction(
    { id: 'delete-coupon-on-expiry', triggers: [{ event: 'app/coupon.expired' }] },
    async ({ event, step }) => {
        const { data } = event
        const expiryDate = new Date(data.expires_at)
        await step.sleepUntil('wait-for-expiry', expiryDate)

        await step.run('delete-coupon-from-database', async () => {
            await prisma.coupon.delete({
                where: { code: data.code }
            })
        })
    }
)
