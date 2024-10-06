/*
  Warnings:

  - You are about to drop the `Sharing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SharingOnUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Sharing" DROP CONSTRAINT "Sharing_fileId_fkey";

-- DropForeignKey
ALTER TABLE "SharingOnUser" DROP CONSTRAINT "SharingOnUser_memberId_fkey";

-- DropForeignKey
ALTER TABLE "SharingOnUser" DROP CONSTRAINT "SharingOnUser_shareId_fkey";

-- DropTable
DROP TABLE "Sharing";

-- DropTable
DROP TABLE "SharingOnUser";
