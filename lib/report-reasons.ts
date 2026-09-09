// Mirrors the report_reason enum in supabase/migrations/20260905124436_initial_schema.sql.

export const REPORT_REASONS = [
  { value: "FAKE_PROPERTY", label: "Fake property" },
  { value: "MISLEADING_INFORMATION", label: "Misleading information" },
  { value: "WRONG_PRICE", label: "Wrong price" },
  { value: "DUPLICATE", label: "Duplicate listing" },
  { value: "SOLD_RENTED", label: "Already sold / rented" },
  { value: "SPAM", label: "Spam" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "FRAUD_CONCERN", label: "Fraud concern" },
  { value: "OTHER", label: "Other" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];
