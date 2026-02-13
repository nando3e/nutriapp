-- Añadir momento de comida a food_logs (varchar para no depender del enum de Drizzle)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_logs' AND column_name = 'meal'
  ) THEN
    ALTER TABLE "food_logs" ADD COLUMN "meal" varchar(20) DEFAULT 'comida';
  END IF;
END $$;
