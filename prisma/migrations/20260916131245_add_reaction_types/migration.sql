/*
  Warnings:

  - Changed the type of `type` on the `Like` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'LOVE', 'HAHA', 'SAD', 'ANGRY');

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "type",
ADD COLUMN     "type" "ReactionType" NOT NULL;

-- DropEnum
DROP TYPE "LikeType";
