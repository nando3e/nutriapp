-- Comida rápida / manual: permitir registro sin alimento predefinido (nombre + kcal/proteína)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_logs' AND column_name = 'custom_name'
  ) THEN
    ALTER TABLE "food_logs" ADD COLUMN "custom_name" varchar(255);
    ALTER TABLE "food_logs" ADD COLUMN "custom_kcal" real;
    ALTER TABLE "food_logs" ADD COLUMN "custom_protein" real;
    ALTER TABLE "food_logs" ADD COLUMN "custom_fat" real;
    ALTER TABLE "food_logs" ADD COLUMN "custom_carbs" real;
    ALTER TABLE "food_logs" ALTER COLUMN "food_id" DROP NOT NULL;
  END IF;
END $$;
