-- Enforce at most one ADMIN account system-wide. Prisma's schema language has
-- no partial-index syntax, so this constraint is expressed only here, not in
-- schema.prisma. USER rows are unaffected (the index only covers role = 'ADMIN').
CREATE UNIQUE INDEX "User_single_admin_key" ON "User" ("role") WHERE "role" = 'ADMIN';
