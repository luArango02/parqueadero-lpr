-- CreateEnum
CREATE TYPE "OrigenLectura" AS ENUM ('SIMULADOR', 'OCR', 'MANUAL');

-- AlterTable
ALTER TABLE "detecciones" ADD COLUMN     "origen" "OrigenLectura" NOT NULL DEFAULT 'SIMULADOR';
