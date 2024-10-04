/*
  Warnings:

  - You are about to drop the column `share_anyone` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `Sharing` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fileId]` on the table `Sharing` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `anyone` to the `Sharing` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Sharing" DROP CONSTRAINT "Sharing_memberId_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "share_anyone";

-- AlterTable
ALTER TABLE "Sharing" DROP COLUMN "memberId",
ADD COLUMN     "anyone" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "SharingOnUser" (
    "memberId" INTEGER NOT NULL,
    "shareId" INTEGER NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharingOnUser_pkey" PRIMARY KEY ("shareId","memberId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sharing_fileId_key" ON "Sharing"("fileId");

-- AddForeignKey
ALTER TABLE "SharingOnUser" ADD CONSTRAINT "SharingOnUser_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("pk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharingOnUser" ADD CONSTRAINT "SharingOnUser_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Sharing"("pk") ON DELETE RESTRICT ON UPDATE CASCADE;
