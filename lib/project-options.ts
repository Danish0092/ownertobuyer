// Mirrors the enums defined in
// supabase/migrations/20260913140000_developer_projects.sql.
// Reuses PROPERTY_TYPES/SIZE_UNITS/AUTHORITY_STATUSES from
// property-options.ts wherever the underlying enum is shared — see
// that file for those.

export const PROJECT_STATUSES = ["DRAFT", "PUBLISHED", "HIDDEN"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_DEVELOPMENT_STATUSES = [
  "PLANNING",
  "UNDER_CONSTRUCTION",
  "PARTIALLY_COMPLETED",
  "COMPLETED",
  "ON_HOLD",
] as const;
export type ProjectDevelopmentStatus = (typeof PROJECT_DEVELOPMENT_STATUSES)[number];
