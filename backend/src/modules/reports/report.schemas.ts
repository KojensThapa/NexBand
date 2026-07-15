import { z } from "zod";

export const reportIdSchema = z.object({ id: z.string().uuid("Invalid report id.") }).strict();
