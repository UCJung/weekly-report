-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_partId_fkey";

-- AlterTable
ALTER TABLE "members" DROP COLUMN "partId";
