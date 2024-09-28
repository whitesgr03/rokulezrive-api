/*
  Warnings:

  - You are about to drop the `_SharingToUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id]` on the table `Sharing` will be added. If there are existing duplicate values, this will fail.
  - Made the column `ownerId` on table `Folder` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `fileId` to the `Sharing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `memberId` to the `Sharing` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "_SharingToUser" DROP CONSTRAINT "_SharingToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_SharingToUser" DROP CONSTRAINT "_SharingToUser_B_fkey";

-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "ownerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Sharing" ADD COLUMN     "fileId" INTEGER NOT NULL,
ADD COLUMN     "memberId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_SharingToUser";

-- CreateIndex
CREATE UNIQUE INDEX "Sharing_id_key" ON "Sharing"("id");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("pk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sharing" ADD CONSTRAINT "Sharing_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("pk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sharing" ADD CONSTRAINT "Sharing_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("pk") ON DELETE RESTRICT ON UPDATE CASCADE;
