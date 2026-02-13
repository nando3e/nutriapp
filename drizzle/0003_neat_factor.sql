-- Factor NEAT (actividad mínima) para gasto = TMB*neatFactor + actividad
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'neat_factor'
  ) THEN
    ALTER TABLE "profiles" ADD COLUMN "neat_factor" real DEFAULT 1.15;
  END IF;
END $$;
