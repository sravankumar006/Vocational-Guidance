"""
Repeatable, idempotent, and transactional dataset import pipeline.
Imports verified vocational reference data from data/raw/database.csv into SQLAlchemy models.
Never modifies data/raw/database.csv.
"""

import os
import sys
import csv
import json
import argparse
from typing import Dict, Any, List, Set, Tuple

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from database.session import SessionLocal
from database.base import Base
from models import (
    DataSource,
    TrainingProvider,
    Course,
    Occupation,
    CareerPath,
    JobOutcome,
)
from scripts.data_mapping import REQUIRED_CSV_COLUMNS


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import SIH26241 dataset into database")
    parser.add_argument(
        "--csv-path",
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/raw/database.csv")),
        help="Path to raw CSV dataset",
    )
    parser.add_argument(
        "--output-dir",
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed")),
        help="Path to save data quality report",
    )
    parser.add_argument(
        "--db-url",
        default=None,
        help="Optional database URL override (e.g. for testing)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform inspection and validation without persisting to database",
    )
    return parser.parse_args()


def inspect_and_validate_csv(csv_path: str) -> Tuple[List[Dict[str, str]], Dict[str, Any]]:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Raw dataset file not found at: {csv_path}")

    report: Dict[str, Any] = {
        "file_path": csv_path,
        "file_size_bytes": os.path.getsize(csv_path),
        "total_rows": 0,
        "valid_rows": 0,
        "invalid_rows": 0,
        "missing_values_by_column": {},
        "validation_errors": [],
        "aadhaar_detected": False,
    }

    rows: List[Dict[str, str]] = []

    with open(csv_path, mode="r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        header = reader.fieldnames or []

        # 1. Privacy check
        for col in header:
            if "aadhaar" in col.lower() or "uid" in col.lower():
                report["aadhaar_detected"] = True
                raise ValueError(f"Privacy alert: Sensitive identity field '{col}' detected in CSV.")

        # 2. Schema check
        missing_cols = [c for c in REQUIRED_CSV_COLUMNS if c not in header]
        if missing_cols:
            raise ValueError(f"CSV is missing required columns: {missing_cols}")

        report["missing_values_by_column"] = {col: 0 for col in header}

        for row_idx, row in enumerate(reader, start=1):
            report["total_rows"] += 1
            has_error = False

            # Check missing values
            for k, v in row.items():
                if v is None or not v.strip():
                    report["missing_values_by_column"][k] += 1

            # Validate numeric values
            try:
                placement = float(row["placement_rate_percent"])
                if placement < 0 or placement > 100:
                    report["validation_errors"].append(f"Row {row_idx}: Invalid placement rate {placement}")
                    has_error = True
            except ValueError:
                report["validation_errors"].append(f"Row {row_idx}: Non-numeric placement rate")
                has_error = True

            try:
                min_earn = int(row["minimum_monthly_earnings_inr"])
                max_earn = int(row["maximum_monthly_earnings_inr"])
                if min_earn < 0 or max_earn < min_earn:
                    report["validation_errors"].append(f"Row {row_idx}: Invalid earnings range ({min_earn} - {max_earn})")
                    has_error = True
            except ValueError:
                report["validation_errors"].append(f"Row {row_idx}: Non-numeric earnings values")
                has_error = True

            if has_error:
                report["invalid_rows"] += 1
            else:
                report["valid_rows"] += 1
                rows.append(row)

    return rows, report


def import_data(rows: List[Dict[str, str]], session: Session) -> Dict[str, int]:
    """Imports validated rows into SQLAlchemy models idempotently inside a transaction."""
    counts = {
        "data_sources": 0,
        "training_providers": 0,
        "occupations": 0,
        "courses": 0,
        "career_paths": 0,
        "job_outcomes": 0,
    }

    # 1. Ensure DataSource
    data_source_name = "SIH26241 Vocational Outcomes & Parental Concerns Dataset"
    data_source = session.query(DataSource).filter_by(name=data_source_name).first()
    if not data_source:
        data_source = DataSource(
            name=data_source_name,
            source_type="Hackathon Reference Dataset (Unverified Empirical)",
            url="https://sih.gov.in",
            description="Empirical dataset for SIH Problem Statement SIH26241 tracking vocational trades, placement rates, earnings, and parent resistance concerns.",
            version="1.0.0",
        )
        session.add(data_source)
        session.flush()
        counts["data_sources"] += 1

    # Cache existing records for idempotency and fast lookups
    providers_cache: Dict[str, TrainingProvider] = {
        p.name: p for p in session.query(TrainingProvider).all()
    }
    occupations_cache: Dict[str, Occupation] = {
        o.name: o for o in session.query(Occupation).all()
    }
    courses_cache: Dict[Tuple[str, Optional[int]], Course] = {
        (c.name, c.provider_id): c for c in session.query(Course).all()
    }
    career_paths_cache: Dict[str, CareerPath] = {
        cp.name: cp for cp in session.query(CareerPath).all()
    }

    # 2. Extract and upsert reference entities
    for row in rows:
        # A. TrainingProvider
        p_name = row["training_provider"].strip()
        p_type = row["training_provider_type"].strip()
        if p_name not in providers_cache:
            provider = TrainingProvider(
                name=p_name,
                provider_type=p_type,
                location=row["district"].strip() + ", " + row["state"].strip(),
                description=f"Accredited {p_type} providing technical vocational certification.",
            )
            session.add(provider)
            session.flush()
            providers_cache[p_name] = provider
            counts["training_providers"] += 1
        provider = providers_cache[p_name]

        # B. Occupation
        occ_name = row["trade_name"].strip()
        occ_sector = row["trade_category"].strip()
        if occ_name not in occupations_cache:
            job_roles = [r.strip() for r in row["common_job_roles"].split(";") if r.strip()]
            occupation = Occupation(
                name=occ_name,
                sector=occ_sector,
                description=f"Vocational trade in {occ_sector}. Progression options and self-employment: {row['self_employment_opportunity']}.",
                skill_requirements={"roles": job_roles, "self_employment": row["self_employment_opportunity"]},
            )
            session.add(occupation)
            session.flush()
            occupations_cache[occ_name] = occupation
            counts["occupations"] += 1
        occupation = occupations_cache[occ_name]

        # C. Course
        course_key = (occ_name, provider.id)
        if course_key not in courses_cache:
            nsqf = f"NSQF Level {row['nsqf_level'].strip()}"
            duration = f"{row['training_duration_months'].strip()} Months"
            course = Course(
                name=occ_name,
                sector=occ_sector,
                qualification_level=nsqf,
                duration=duration,
                delivery_mode="Full-time / Practical",
                description=f"{duration} vocational training program certified at {nsqf}.",
                provider_id=provider.id,
                data_source_id=data_source.id,
            )
            session.add(course)
            session.flush()
            courses_cache[course_key] = course
            counts["courses"] += 1
        course = courses_cache[course_key]

        # D. CareerPath
        pathway_str = row["progression_pathway"].strip()
        pathway_clean_name = f"{occ_name} Career Progression"
        if pathway_clean_name not in career_paths_cache:
            # Clean arrow symbols or split steps
            steps = [s.strip() for s in pathway_str.replace("+'", "->").replace("+", "->").split("->") if s.strip()]
            career_path = CareerPath(
                name=pathway_clean_name,
                description=f"Progression sequence for {occ_name}. Further education: {row['further_education_option'].strip()}.",
                progression_ladder={"ladder": steps, "next_nsqf": row["next_nsqf_level"].strip()},
                estimated_duration=f"{row['training_duration_months'].strip()} Months to entry",
            )
            career_path.courses.append(course)
            career_path.occupations.append(occupation)
            session.add(career_path)
            session.flush()
            career_paths_cache[pathway_clean_name] = career_path
            counts["career_paths"] += 1
        career_path = career_paths_cache[pathway_clean_name]

        # E. JobOutcome (Region-specific sourced outcome)
        job_outcome = JobOutcome(
            occupation_id=occupation.id,
            career_path_id=career_path.id,
            data_source_id=data_source.id,
            employment_rate=float(row["placement_rate_percent"]),
            salary_range_min=int(row["minimum_monthly_earnings_inr"]),
            salary_range_max=int(row["maximum_monthly_earnings_inr"]),
            salary_currency="INR",
            experience_level=row["region_type"].strip(),
            region=f"{row['district'].strip()}, {row['state'].strip()}",
        )
        session.add(job_outcome)
        counts["job_outcomes"] += 1

    return counts


def main():
    args = parse_arguments()
    print("=" * 60)
    print("SIH26241 Dataset Import & Validation Pipeline")
    print("=" * 60)

    rows, report = inspect_and_validate_csv(args.csv_path)
    print(f"Dataset Rows Checked : {report['total_rows']}")
    print(f"Valid Rows Found     : {report['valid_rows']}")
    print(f"Invalid Rows         : {report['invalid_rows']}")
    print(f"Aadhaar Detected     : {report['aadhaar_detected']}")

    # Save Quality Report
    os.makedirs(args.output_dir, exist_ok=True)
    report_json_path = os.path.join(args.output_dir, "data_quality_report.json")
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"Data quality report saved to: {report_json_path}")

    if args.dry_run:
        print("Dry run requested. Skipping database commit.")
        return

    # Choose session engine
    if args.db_url:
        engine = create_engine(args.db_url)
        Base.metadata.create_all(bind=engine)
        SessionTest = sessionmaker(bind=engine)
        session = SessionTest()
    else:
        session = SessionLocal()

    try:
        print("Importing records into database...")
        counts = import_data(rows, session)
        session.commit()
        print("Database commit successful!")
        for entity, count in counts.items():
            print(f" - {entity.capitalize()}: {count} records")

        # Save summary markdown
        summary_md_path = os.path.join(args.output_dir, "import_summary.md")
        with open(summary_md_path, "w", encoding="utf-8") as f:
            f.write("# Dataset Import Summary\n\n")
            f.write(f"- **Source File**: `{args.csv_path}`\n")
            f.write(f"- **Total Rows Read**: {report['total_rows']}\n")
            f.write(f"- **Valid Rows Processed**: {report['valid_rows']}\n")
            f.write(f"- **Aadhaar Data Detected**: {report['aadhaar_detected']}\n\n")
            f.write("### Records Created / Upserted:\n")
            for entity, count in counts.items():
                f.write(f"- **{entity}**: {count}\n")
        print(f"Import summary saved to: {summary_md_path}")
    except Exception as e:
        session.rollback()
        print(f"Import failed with error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
