/*
  Warnings:

  - A unique constraint covering the columns `[subject]` on the table `Credential` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Credential_subject_key" ON "Credential"("subject");
