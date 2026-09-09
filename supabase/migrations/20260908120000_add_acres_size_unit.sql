-- ============================================================
-- Add ACRES to size_unit
--
-- The PostProperty wizard design's unit dropdown includes "Acres"
-- (common for agricultural land), which the original enum
-- (MARLA/KANAL/SQ_FT/SQ_YD/SQ_M) didn't have. Additive only.
-- ============================================================

alter type public.size_unit add value if not exists 'ACRES';
