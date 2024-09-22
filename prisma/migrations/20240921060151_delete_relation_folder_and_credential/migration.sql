/*
  Warnings:

  - You are about to drop the column `credentialId` on the `Folder` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_credentialId_fkey";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "credentialId";
