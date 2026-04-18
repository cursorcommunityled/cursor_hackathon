import type { AppUserRole } from "@/lib/teams/constants";

const STAFF_PORTAL_ROLES: AppUserRole[] = ["judge", "mentor"];
const BYPASS_SCREENING_ROLES: AppUserRole[] = [
  "super_admin",
  "moderator",
  "reviewer",
];

export function isParticipantRole(role: string | null | undefined): role is "participant" {
  return role === "participant" || role == null || role === "";
}

/** Participant-only hackathon onboarding (/onboarding) applies only to this role. */
export function requiresParticipantOnboarding(role: string | null | undefined): boolean {
  return isParticipantRole(role);
}

export function isStaffPortalRole(role: string | null | undefined): boolean {
  return STAFF_PORTAL_ROLES.includes(role as AppUserRole);
}

/** Access participant /dashboard without team + approved screening. */
export function canBypassParticipantScreening(role: string | null | undefined): boolean {
  return BYPASS_SCREENING_ROLES.includes(role as AppUserRole);
}
