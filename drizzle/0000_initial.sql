-- NutriApp initial schema
CREATE TYPE "user_role" AS ENUM ('user', 'superadmin');
CREATE TYPE "unit_type" AS ENUM ('grams', 'units');
CREATE TYPE "moment" AS ENUM ('start', 'end');

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'user',
  "email_verified_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "token" varchar(255) NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255),
  "sex" varchar(20),
  "birth_date" date,
  "height_cm" real,
  "target_weight_kg" real,
  "target_date" date,
  "calorie_goal" integer DEFAULT 1700,
  "protein_goal" integer DEFAULT 180,
  "fat_goal" integer,
  "carb_goal" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "foods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "kcal_per_100g" real NOT NULL,
  "protein_per_100g" real NOT NULL DEFAULT 0,
  "fat_per_100g" real NOT NULL DEFAULT 0,
  "carbs_per_100g" real NOT NULL DEFAULT 0,
  "unit_type" "unit_type" NOT NULL DEFAULT 'grams',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "met" real NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "days" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "closed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "date")
);

CREATE TABLE IF NOT EXISTS "food_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "day_date" date NOT NULL,
  "food_id" uuid NOT NULL REFERENCES "foods"("id") ON DELETE CASCADE,
  "quantity_grams" real,
  "quantity_units" real,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "day_date" date NOT NULL,
  "activity_id" uuid REFERENCES "activities"("id") ON DELETE SET NULL,
  "duration_minutes" real,
  "manual_kcal" real,
  "wahoo_correction" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "weight_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "weight_kg" real NOT NULL,
  "waist_cm" real,
  "moment" "moment" NOT NULL DEFAULT 'start',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "food_logs_user_day" ON "food_logs" ("user_id", "day_date");
CREATE INDEX IF NOT EXISTS "activity_logs_user_day" ON "activity_logs" ("user_id", "day_date");
CREATE INDEX IF NOT EXISTS "weight_logs_user_date" ON "weight_logs" ("user_id", "date");
