/*
  Warnings:

  - The primary key for the `PublicFile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `PublicFile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PublicFile" DROP CONSTRAINT "PublicFile_pkey",
ADD COLUMN     "pk" SERIAL NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "PublicFile_pkey" PRIMARY KEY ("pk");
DROP SEQUENCE "PublicFile_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "PublicFile_id_key" ON "PublicFile"("id");
