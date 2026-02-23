-- Añadir columna categoria a foods (para ordenar/agrupar: carbohidratos, proteinas, grasas, etc.)
ALTER TABLE "foods" ADD COLUMN IF NOT EXISTS "category" varchar(64);
