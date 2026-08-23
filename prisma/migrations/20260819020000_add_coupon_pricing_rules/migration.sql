-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN "discountType" "CouponDiscountType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN "minimumPurchase" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "maximumDiscount" DOUBLE PRECISION;
