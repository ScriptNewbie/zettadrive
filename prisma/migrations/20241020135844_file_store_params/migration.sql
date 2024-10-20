/*
  Warnings:

  - Added the required column `retrieveString` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeStrategy` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "retrieveString" TEXT NOT NULL,
ADD COLUMN     "storeStrategy" TEXT NOT NULL;
