export const TEAM_LIMITS = {
  maxMembers: 5,
  nameMinLength: 2,
  nameMaxLength: 64,
  descriptionMaxLength: 500,
  inviteCodeLength: 8,
  inviteCodeGenerationAttempts: 10,
  adminListDefaultLimit: 20,
  adminListMaxLimit: 100,
  adminTwoFactorMaxAgeSeconds: 15 * 60,
} as const;

export const TEAM_INVITE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export type AppUserRole =
  | "participant"
  | "moderator"
  | "reviewer"
  | "super_admin"
  | "judge"
  | "mentor";
export type TeamMembershipRole = "lead" | "member";
export type AdminMembershipAction = "assign-member" | "remove-member" | "transfer-lead";
