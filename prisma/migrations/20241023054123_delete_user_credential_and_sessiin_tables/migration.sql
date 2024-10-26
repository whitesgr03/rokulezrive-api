/*
  Warnings:

  - You are about to drop the `Credential` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[ownerId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sharerId]` on the table `FileSharers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ownerId]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Credential" DROP CONSTRAINT "Credential_userId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "FileSharers" DROP CONSTRAINT "FileSharers_sharerId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_ownerId_fkey";

-- DropTable
DROP TABLE "Credential";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "User";

-- CreateIndex
CREATE UNIQUE INDEX "File_ownerId_key" ON "File"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "FileSharers_sharerId_key" ON "FileSharers"("sharerId");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_ownerId_key" ON "Folder"("ownerId");
