# Character roster ordering

Owner approved fix and live release after Sites221. Shared presentation helper orders Crown first, Royal Guard by numeric guard number, Officials by English display name (accent/case insensitive), then affiliate and household groups in their original within-group order. Equal Guard numbers use display name. Missing/invalid Guard numbers follow numbered guards. Input array and canon data are untouched. Visibility filtering remains unchanged.

Applied to character selection and lounge roster. TypeScript/domain checks passed; targeted executable assertion covered Crown, Guard1/9/88, alphabetical officials, household and input immutability. Packaging builds final source. Rollback Sites221.
