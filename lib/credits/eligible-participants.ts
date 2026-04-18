import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";

/** Participants on a team that passed screening (accepted for the hackathon). */
export async function getEligibleParticipantUserIds(): Promise<string[]> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .innerJoin(team, eq(user.teamId, team.id))
    .where(
      and(eq(user.role, "participant"), eq(team.screeningStatus, "approved")),
    );
  return rows.map((r) => r.id);
}

export async function isUserEligibleForCredits(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .innerJoin(team, eq(user.teamId, team.id))
    .where(
      and(
        eq(user.id, userId),
        eq(user.role, "participant"),
        eq(team.screeningStatus, "approved"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
