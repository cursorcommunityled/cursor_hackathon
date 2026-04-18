import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { project, appSetting } from "@/db/schema/projects";
import { AppError } from "@/lib/api/http";
import type { AppSessionUser } from "@/lib/auth/session";

const DEADLINE_SETTING_KEY = "project_submission_deadline";

export type ProjectRow = typeof project.$inferSelect;

export type CreateProjectInput = {
  name: string;
  description?: string | null;
  githubUrl: string;
  demoUrl?: string | null;
  techStack?: string | null;
  slidesUrl?: string | null;
  videoUrl?: string | null;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export async function getProjectDeadline(): Promise<Date | null> {
  const [row] = await db
    .select({ value: appSetting.value })
    .from(appSetting)
    .where(eq(appSetting.key, DEADLINE_SETTING_KEY))
    .limit(1);

  if (!row?.value) return null;

  const date = new Date(row.value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function setProjectDeadline(deadline: Date | null): Promise<Date | null> {
  if (!deadline) {
    await db.delete(appSetting).where(eq(appSetting.key, DEADLINE_SETTING_KEY));
    return null;
  }

  await db
    .insert(appSetting)
    .values({ key: DEADLINE_SETTING_KEY, value: deadline.toISOString() })
    .onConflictDoUpdate({
      target: appSetting.key,
      set: { value: deadline.toISOString(), updatedAt: new Date() },
    });

  return deadline;
}

async function assertDeadlineNotPassed() {
  const deadline = await getProjectDeadline();
  if (deadline && deadline.getTime() < Date.now()) {
    throw new AppError(
      403,
      "DEADLINE_PASSED",
      "The project submission deadline has passed.",
    );
  }
}

async function getTeamAndAssertApproved(teamId: number) {
  const [teamRow] = await db
    .select({
      id: team.id,
      name: team.name,
      screeningStatus: team.screeningStatus,
    })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  if (!teamRow) {
    throw new AppError(404, "TEAM_NOT_FOUND", "Team not found.");
  }

  if (teamRow.screeningStatus !== "approved") {
    throw new AppError(
      403,
      "TEAM_NOT_APPROVED",
      "Only approved teams can submit projects.",
    );
  }

  return teamRow;
}

function assertTeamLead(actor: AppSessionUser) {
  if (!actor.isTeamLead || !actor.teamId) {
    throw new AppError(
      403,
      "NOT_TEAM_LEAD",
      "Only the team lead can manage the project.",
    );
  }
}

export async function getProjectForTeam(teamId: number): Promise<ProjectRow | null> {
  const [row] = await db
    .select()
    .from(project)
    .where(eq(project.teamId, teamId))
    .limit(1);

  return row ?? null;
}

export async function createProject(
  actor: AppSessionUser,
  input: CreateProjectInput,
): Promise<ProjectRow> {
  assertTeamLead(actor);
  await getTeamAndAssertApproved(actor.teamId!);
  await assertDeadlineNotPassed();

  const existing = await getProjectForTeam(actor.teamId!);
  if (existing) {
    throw new AppError(409, "PROJECT_EXISTS", "This team already has a project.");
  }

  const [row] = await db
    .insert(project)
    .values({
      teamId: actor.teamId!,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      githubUrl: input.githubUrl.trim(),
      demoUrl: input.demoUrl?.trim() || null,
      techStack: input.techStack?.trim() || null,
      slidesUrl: input.slidesUrl?.trim() || null,
      videoUrl: input.videoUrl?.trim() || null,
    })
    .returning();

  return row;
}

export async function updateProject(
  actor: AppSessionUser,
  input: UpdateProjectInput,
): Promise<ProjectRow> {
  assertTeamLead(actor);
  await assertDeadlineNotPassed();

  const existing = await getProjectForTeam(actor.teamId!);
  if (!existing) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "No project found for this team.");
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.githubUrl !== undefined) updates.githubUrl = input.githubUrl.trim();
  if (input.demoUrl !== undefined) updates.demoUrl = input.demoUrl?.trim() || null;
  if (input.techStack !== undefined) updates.techStack = input.techStack?.trim() || null;
  if (input.slidesUrl !== undefined) updates.slidesUrl = input.slidesUrl?.trim() || null;
  if (input.videoUrl !== undefined) updates.videoUrl = input.videoUrl?.trim() || null;

  const [row] = await db
    .update(project)
    .set(updates)
    .where(eq(project.id, existing.id))
    .returning();

  return row;
}

export type ListProjectsForAdminOptions =
  | { all: true; search?: string }
  | { all?: false; limit: number; offset: number; search?: string };

export async function listProjectsForAdmin(options: ListProjectsForAdminOptions) {
  const filters = [];

  if (options.search) {
    const pattern = `%${options.search}%`;
    filters.push(
      or(
        ilike(project.name, pattern),
        ilike(team.name, pattern),
      )!,
    );
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const projectSelect = {
    id: project.id,
    teamId: project.teamId,
    teamName: team.name,
    name: project.name,
    description: project.description,
    githubUrl: project.githubUrl,
    demoUrl: project.demoUrl,
    techStack: project.techStack,
    slidesUrl: project.slidesUrl,
    videoUrl: project.videoUrl,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };

  const orderedQuery = db
    .select(projectSelect)
    .from(project)
    .innerJoin(team, eq(project.teamId, team.id))
    .where(whereClause)
    .orderBy(desc(project.createdAt));

  if (options.all === true) {
    const rows = await orderedQuery;
    const n = rows.length;
    return {
      projects: rows,
      total: n,
      limit: n,
      offset: 0,
    };
  }

  const [rows, countResult] = await Promise.all([
    orderedQuery.limit(options.limit).offset(options.offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(project)
      .innerJoin(team, eq(project.teamId, team.id))
      .where(whereClause),
  ]);

  return {
    projects: rows,
    total: countResult[0]?.count ?? 0,
    limit: options.limit,
    offset: options.offset,
  };
}

export async function deleteProjectForAdmin(projectId: string): Promise<void> {
  const [deleted] = await db
    .delete(project)
    .where(eq(project.id, projectId))
    .returning({ id: project.id });

  if (!deleted) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }
}

export async function getProjectByTeamIdWithTeamName(teamId: number) {
  const [row] = await db
    .select({
      id: project.id,
      teamId: project.teamId,
      teamName: team.name,
      name: project.name,
      description: project.description,
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      techStack: project.techStack,
      slidesUrl: project.slidesUrl,
      videoUrl: project.videoUrl,
      createdAt: project.createdAt,
    })
    .from(project)
    .innerJoin(team, eq(project.teamId, team.id))
    .where(eq(project.teamId, teamId))
    .limit(1);

  return row ?? null;
}
