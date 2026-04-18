import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./schema/auth";
import * as relationsSchema from "./schema/relations";
import * as teamsSchema from "./schema/teams";
import * as partnersSchema from "./schema/partners";
import * as screeningSchema from "./schema/screening";
import * as scoringSchema from "./schema/scoring";
import * as projectsSchema from "./schema/projects";
import * as settingsSchema from "./schema/settings";
import * as mentorSchema from "./schema/mentor";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/cursor48";
const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...teamsSchema,
    ...partnersSchema,
    ...screeningSchema,
    ...scoringSchema,
    ...projectsSchema,
    ...settingsSchema,
    ...mentorSchema,
    ...relationsSchema,
  },
});

export type Database = typeof db;
