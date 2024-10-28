/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "File_ownerId_key";

-- DropIndex
DROP INDEX "Folder_ownerId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ALTER COLUMN "email" SET NOT NULL;
