-- CreateTable
CREATE TABLE "FileSharers" (
    "fileId" INTEGER NOT NULL,
    "sharerId" INTEGER NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileSharers_pkey" PRIMARY KEY ("fileId","sharerId")
);

-- CreateTable
CREATE TABLE "PublicFile" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicFile_fileId_key" ON "PublicFile"("fileId");

-- AddForeignKey
ALTER TABLE "FileSharers" ADD CONSTRAINT "FileSharers_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("pk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileSharers" ADD CONSTRAINT "FileSharers_sharerId_fkey" FOREIGN KEY ("sharerId") REFERENCES "User"("pk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicFile" ADD CONSTRAINT "PublicFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("pk") ON DELETE SET NULL ON UPDATE CASCADE;
