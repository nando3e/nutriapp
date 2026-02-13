-- Congelar ingerido/gastado por día para que peso/NEAT futuros no afecten al pasado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'days' AND column_name = 'snapshot_kcal_in'
  ) THEN
    ALTER TABLE "days" ADD COLUMN "snapshot_kcal_in" integer;
    ALTER TABLE "days" ADD COLUMN "snapshot_kcal_out" integer;
  END IF;
END $$;
