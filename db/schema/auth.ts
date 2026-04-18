import { randomUUID } from "crypto";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "participant",
  "moderator",
  "reviewer",
  "super_admin",
  "judge",
  "mentor",
]);

export const staffRoleEnum = pgEnum("staff_role", ["judge", "mentor"]);

export const teamStatusEnum = pgEnum("team_status", ["active", "archived"]);

export const screeningStatusEnum = pgEnum("screening_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

export const team = pgTable(
  "team",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    description: text("description"),
    status: teamStatusEnum("status").notNull().default("active"),
    joinCode: text("join_code").notNull(),
    memberCount: integer("member_count").notNull().default(0),
    maxMembers: integer("max_members").notNull().default(5),
    createdByUserId: text("created_by_user_id").references((): AnyPgColumn => user.id, {
      onDelete: "set null",
    }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    screeningStatus: screeningStatusEnum("screening_status").notNull().default("draft"),
    screeningVideoUrl: text("screening_video_url"),
    screeningVideoStoragePath: text("screening_video_storage_path"),
    screeningSubmittedAt: timestamp("screening_submitted_at", { withTimezone: true }),
    screeningRejectedAt: timestamp("screening_rejected_at", { withTimezone: true }),
    screeningRejectedReason: text("screening_rejected_reason"),
    screeningApprovedAt: timestamp("screening_approved_at", { withTimezone: true }),
    screeningApprovedByUserId: text("screening_approved_by_user_id").references((): AnyPgColumn => user.id, {
      onDelete: "set null",
    }),
    /** When set, public ranking compares judgeCount to this instead of the global judge total. */
    judgeCountOverride: integer("judge_count_override"),
    /** Subtracted from the team's gross total (sum of criterion averages) for final placement. */
    lateSubmissionPenaltyPoints: integer("late_submission_penalty_points").notNull().default(0),
    /** When set, public ranking uses this value (0–100) instead of aggregated judge scores. */
    finalScoreOverride: real("final_score_override"),
  },
  (table) => [
    uniqueIndex("team_join_code_unique").on(table.joinCode),
    index("team_status_idx").on(table.status),
    index("team_created_by_user_id_idx").on(table.createdByUserId),
    index("team_screening_status_idx").on(table.screeningStatus),
    check(
      "team_member_count_range_check",
      sql`${table.memberCount} >= 0 and ${table.memberCount} <= ${table.maxMembers}`,
    ),
    check(
      "team_max_members_limit_check",
      sql`${table.maxMembers} > 0 and ${table.maxMembers} <= 5`,
    ),
    check(
      "team_judge_count_override_check",
      sql`${table.judgeCountOverride} is null or (${table.judgeCountOverride} >= 1 and ${table.judgeCountOverride} <= 100)`,
    ),
    check(
      "team_late_penalty_range_check",
      sql`${table.lateSubmissionPenaltyPoints} >= 0 and ${table.lateSubmissionPenaltyPoints} <= 100`,
    ),
    check(
      "team_final_score_override_range_check",
      sql`${table.finalScoreOverride} is null or (${table.finalScoreOverride} >= 0 and ${table.finalScoreOverride} <= 100)`,
    ),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    firstName: text("first_name"),
    lastName: text("last_name"),
    role: userRoleEnum("role").notNull().default("participant"),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    teamId: integer("team_id").references((): AnyPgColumn => team.id, {
      onDelete: "set null",
    }),
    isTeamLead: boolean("is_team_lead").notNull().default(false),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  },
  (table) => [
    index("user_team_id_idx").on(table.teamId),
    index("user_role_idx").on(table.role),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("two_factor_user_id_unique").on(table.userId),
    index("two_factor_secret_idx").on(table.secret),
  ],
);

export const staffInvite = pgTable(
  "staff_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    email: text("email").notNull(),
    role: staffRoleEnum("role").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdByUserId: text("created_by_user_id").references((): AnyPgColumn => user.id, {
      onDelete: "set null",
    }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("staff_invite_token_unique").on(table.token),
    index("staff_invite_email_idx").on(table.email),
    index("staff_invite_expires_at_idx").on(table.expiresAt),
  ],
);

export const staffMember = pgTable(
  "staff_member",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    phone: text("phone"),
    position: text("position"),
    telegramUsername: text("telegram_username"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);
