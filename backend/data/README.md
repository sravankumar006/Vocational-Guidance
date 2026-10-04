# Dataset Directory

This directory manages the raw and processed datasets for the Vocational Guidance Platform.

## Directory Structure
- `data/raw/database.csv`: Immutable source dataset (10,000 records, 25 columns).
- `data/processed/`: Generated reports, mappings, and normalized exports. Never edits `raw/`.

## Source Metadata & Provenance
- **Dataset Identifier**: `SIH26241` (Vocational Outcomes & Parental Concerns Dataset)
- **Rows**: 10,000
- **Columns**: 25
- **Geographic Coverage**: 18 States, 120 Districts across India
- **Trades Covered**: 15 Vocational Trades across 13 Categories
- **Authenticity Status**: Unverified / Hackathon reference dataset (contains empirical metrics on placements, earnings ranges, and parental concern levels).
- **Privacy Compliance**: Zero Aadhaar or personally identifiable student records present.
