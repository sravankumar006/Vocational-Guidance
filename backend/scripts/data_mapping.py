"""
Dataset to Database Model Schema Mapping Definitions.
Maps columns from data/raw/database.csv (SIH26241) to SQLAlchemy database models.
"""

COLUMN_TO_MODEL_MAPPING = {
    # DataSource metadata
    "record_id": {
        "target_model": "JobOutcome",
        "field": "source_reference_id",
        "description": "Unique empirical record identifier from SIH26241 dataset",
    },
    # Occupation Model
    "trade_name": {
        "target_model": "Occupation",
        "field": "name",
        "transformation": "strip",
    },
    "trade_category": {
        "target_model": "Occupation",
        "field": "sector",
        "transformation": "strip",
    },
    "common_job_roles": {
        "target_model": "Occupation",
        "field": "skill_requirements",
        "transformation": "split_semicolon_list",
    },
    # TrainingProvider Model
    "training_provider": {
        "target_model": "TrainingProvider",
        "field": "name",
        "transformation": "strip",
    },
    "training_provider_type": {
        "target_model": "TrainingProvider",
        "field": "provider_type",
        "transformation": "strip",
    },
    # Course Model
    "nsqf_level": {
        "target_model": "Course",
        "field": "qualification_level",
        "transformation": lambda v: f"NSQF Level {v}" if v else None,
    },
    "training_duration_months": {
        "target_model": "Course",
        "field": "duration",
        "transformation": lambda v: f"{v} Months" if v else None,
    },
    # CareerPath Model
    "progression_pathway": {
        "target_model": "CareerPath",
        "field": "progression_ladder",
        "transformation": "split_arrow_steps",
    },
    "further_education_option": {
        "target_model": "CareerPath",
        "field": "description",
        "transformation": "strip",
    },
    # JobOutcome Model
    "placement_rate_percent": {
        "target_model": "JobOutcome",
        "field": "employment_rate",
        "transformation": "float",
    },
    "minimum_monthly_earnings_inr": {
        "target_model": "JobOutcome",
        "field": "salary_range_min",
        "transformation": "int",
    },
    "maximum_monthly_earnings_inr": {
        "target_model": "JobOutcome",
        "field": "salary_range_max",
        "transformation": "int",
    },
    "state": {
        "target_model": "JobOutcome",
        "field": "region_state",
        "transformation": "strip",
    },
    "district": {
        "target_model": "JobOutcome",
        "field": "region_district",
        "transformation": "strip",
    },
}

REQUIRED_CSV_COLUMNS = [
    "record_id",
    "state",
    "district",
    "region_type",
    "trade_name",
    "trade_category",
    "training_provider",
    "training_provider_type",
    "nsqf_level",
    "training_duration_months",
    "enrolled_count",
    "completed_count",
    "placement_rate_percent",
    "average_monthly_earnings_inr",
    "minimum_monthly_earnings_inr",
    "maximum_monthly_earnings_inr",
    "common_job_roles",
    "self_employment_opportunity",
    "next_nsqf_level",
    "progression_pathway",
    "further_education_option",
    "common_parent_concern",
    "safety_concern_level",
    "social_perception_concern_level",
    "job_security_concern_level",
]
