-- DropIndex
DROP INDEX "PendingRegistration_email_key";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "PendingRegistration" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "PendingRegistration_email_role_key" ON "PendingRegistration"("email", "role");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_role_key" ON "User"("email", "role");
