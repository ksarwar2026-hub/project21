CREATE TABLE "CheckoutIdempotency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckoutIdempotency_key_key" ON "CheckoutIdempotency"("key");
CREATE INDEX "CheckoutIdempotency_userId_createdAt_idx" ON "CheckoutIdempotency"("userId", "createdAt");

ALTER TABLE "CheckoutIdempotency"
ADD CONSTRAINT "CheckoutIdempotency_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
