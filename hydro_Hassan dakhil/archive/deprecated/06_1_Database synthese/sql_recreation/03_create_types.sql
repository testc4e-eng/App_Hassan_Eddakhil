-- Enum types
DO $$
BEGIN
    CREATE TYPE "public"."time_step" AS ENUM ('instantaneous', 'hourly', 'daily', 'monthly', 'annual');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;
