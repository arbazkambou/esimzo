-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "info" TEXT,
    "image" TEXT,
    "certified" BOOLEAN NOT NULL DEFAULT false,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "plan_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "usd_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prices" JSONB NOT NULL DEFAULT '{}',
    "price_info" TEXT,
    "capacity" INTEGER NOT NULL,
    "capacity_info" TEXT,
    "period" INTEGER NOT NULL,
    "validity_info" TEXT,
    "speed_limit" INTEGER,
    "reduced_speed" INTEGER,
    "possible_throttling" BOOLEAN NOT NULL DEFAULT false,
    "is_low_latency" BOOLEAN NOT NULL DEFAULT false,
    "has_5g" BOOLEAN NOT NULL DEFAULT false,
    "tethering" BOOLEAN NOT NULL DEFAULT false,
    "can_top_up" BOOLEAN NOT NULL DEFAULT false,
    "phone_number" BOOLEAN NOT NULL DEFAULT false,
    "subscription" BOOLEAN NOT NULL DEFAULT false,
    "subscription_period" INTEGER,
    "pay_as_you_go" BOOLEAN NOT NULL DEFAULT false,
    "new_user_only" BOOLEAN NOT NULL DEFAULT false,
    "is_consecutive" BOOLEAN NOT NULL DEFAULT false,
    "e_kyc" BOOLEAN,
    "telephony" JSONB,
    "coverages" JSONB NOT NULL DEFAULT '[]',
    "internet_breakouts" JSONB NOT NULL DEFAULT '[]',
    "additional_info" TEXT,
    "provider_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
