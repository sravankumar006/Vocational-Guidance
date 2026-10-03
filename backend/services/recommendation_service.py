"""
Deterministic Vocational Career Recommendation Engine (Phase 3 Brick 14).
Provides truthful, explainable, and reproducible matching between student profiles and verified career records.
Strictly does NOT use LLMs, machine learning predictions, random sampling, or speculative scores.
"""

import re
from typing import Optional, List, Dict, Any, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import (
    User,
    StudentProfile,
    Occupation,
    Course,
    TrainingProvider,
    JobOutcome,
)
from schemas.career import (
    CareerSummary,
    FactorEvaluation,
    CareerRecommendationItem,
    CareerRecommendationsResponse,
)

# ==============================================================================
# 1. CENTRALIZED WEIGHT CONFIGURATION
# ==============================================================================
# The weights represent the relative importance of distinct vocational criteria:
# - Education (25%): Prerequisite qualification level aligned to entry requirements.
# - Interests (25%): Direct alignment with vocational engagement, skills, and sector interest.
# - Location (15%): Geographic accessibility to accredited training centers and regional jobs.
# - Salary (15%): Real empirical wage ranges evaluated against household economic context.
# - Training (10%): Course duration commitment matched against immediate/deep training preferences.
# - Employment (10%): Placement track record and entrepreneurial self-employment suitability.
# Must sum exactly to 1.0 (100%).
RECOMMENDATION_WEIGHTS: Dict[str, float] = {
    "education": 0.25,
    "interests": 0.25,
    "location": 0.15,
    "salary": 0.15,
    "training": 0.10,
    "employment": 0.10,
}


# ==============================================================================
# 2. INPUT NORMALIZATION HELPERS
# ==============================================================================

# Normalizes education into an ordinal progression scale (1 to 6)
EDUCATION_ORDINAL_MAP: Dict[str, int] = {
    "school": 1,
    "below 10th": 1,
    "8th pass": 1,
    "middle school": 1,
    "class 10 passed": 2,
    "class 10th": 2,
    "10th": 2,
    "secondary": 2,
    "matric": 2,
    "intermediate": 3,
    "higher secondary": 3,
    "12th": 3,
    "12th pass": 3,
    "iti": 3,
    "vocational certificate": 3,
    "diploma": 4,
    "polytechnic": 4,
    "undergraduate": 5,
    "bachelor": 5,
    "b.tech": 5,
    "b.e.": 5,
    "b.sc": 5,
    "b.com": 5,
    "b.a": 5,
    "degree": 5,
    "postgraduate": 6,
    "master": 6,
    "m.tech": 6,
    "m.sc": 6,
    "m.com": 6,
    "m.a": 6,
}

# Normalizes NSQF Levels to educational entry prerequisites
NSQF_ORDINAL_MAP: Dict[str, int] = {
    "nsqf level 1": 1,
    "nsqf level 2": 2,
    "nsqf level 3": 2,  # 10th pass / secondary entry
    "nsqf level 4": 3,  # 12th pass / ITI progression
    "nsqf level 5": 4,  # Diploma
    "nsqf level 6": 5,  # Degree
}

# Controlled keyword taxonomy mapping for vocational interest alignment
INTEREST_KEYWORD_TAXONOMY: Dict[str, Set[str]] = {
    "technology": {"it", "digital", "data", "computer", "operator", "software", "electronics", "technology"},
    "it & digital": {"it", "digital", "data", "computer", "operator", "software", "back office"},
    "engineering": {"engineering", "mechanical", "electrical", "electronics", "civil", "technician", "cnc", "welder", "fitter"},
    "automotive": {"automotive", "vehicle", "automobile", "motor", "service", "mechanic"},
    "electrical": {"electrical", "electrician", "wireman", "power", "wiring", "energy", "panel"},
    "electronics": {"electronics", "circuit", "appliance", "technician", "hardware"},
    "construction": {"construction", "site", "civil", "plumber", "building", "technician", "pipe"},
    "manufacturing": {"manufacturing", "welder", "cnc", "fitter", "machining", "fabrication", "industrial"},
    "mechanical": {"mechanical", "fitter", "machinist", "lathe", "tool", "maintenance"},
    "healthcare": {"healthcare", "medical", "nursing", "assistant", "health", "hospital", "patient"},
    "beauty & wellness": {"beauty", "wellness", "hair", "salon", "makeup", "cosmetics", "skincare"},
    "apparel": {"apparel", "garment", "sewing", "textile", "tailoring", "machine operator"},
    "renewable energy": {"solar", "energy", "renewable", "photovoltaic", "pv", "green energy"},
    "retail": {"retail", "sales", "store", "customer", "merchandising", "associate", "cashier"},
    "hvac": {"refrigeration", "air conditioning", "ac", "hvac", "cooling"},
    "skilled trades": {"welder", "fitter", "electrician", "plumber", "machinist", "technician", "ac"},
}


def normalize_education_level(edu_str: Optional[str]) -> Optional[int]:
    """Deterministically maps textual education levels to an ordinal level scale (1-6)."""
    if not edu_str or not edu_str.strip():
        return None
    clean = edu_str.strip().lower()
    for key, val in EDUCATION_ORDINAL_MAP.items():
        if key in clean:
            return val
    return 2  # Default to secondary level if ambiguous


def normalize_nsqf_level(nsqf_str: Optional[str]) -> Optional[int]:
    """Maps course NSQF level strings (e.g. 'NSQF Level 3') to ordinal prerequisites."""
    if not nsqf_str or not nsqf_str.strip():
        return None
    clean = nsqf_str.strip().lower()
    return NSQF_ORDINAL_MAP.get(clean, 2)


def tokenize_text(text: Optional[str]) -> Set[str]:
    """Converts a string into a normalized set of lowercase words."""
    if not text:
        return set()
    clean = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    return {w for w in clean.split() if len(w) > 2}


# ==============================================================================
# 3. DETERMINISTIC FACTOR SCORING FUNCTIONS
# ==============================================================================

def score_education(
    student_edu_str: Optional[str],
    career_qual_levels: List[str],
) -> Tuple[Optional[float], str, str]:
    """
    Evaluates education compatibility between student profile and trade entry level.
    Returns: (score, factor_result, summary)
    """
    student_scale = normalize_education_level(student_edu_str)
    if student_scale is None:
        return None, "education_unspecified", "Student education level is not specified in profile"

    if not career_qual_levels:
        return None, "career_requirements_unrecorded", "Career qualification requirements not recorded"

    # Determine minimum entry qualification requirement for the career
    career_scales = [normalize_nsqf_level(q) for q in career_qual_levels if normalize_nsqf_level(q) is not None]
    if not career_scales:
        return None, "career_requirements_unrecorded", "Career qualification requirements not recorded"

    min_required_scale = min(career_scales)
    max_required_scale = max(career_scales)

    if student_scale >= max_required_scale:
        return 1.0, "strong_match", f"Your education ({student_edu_str}) comfortably qualifies for this trade's entry requirements."
    elif student_scale >= min_required_scale:
        return 0.85, "compatible", f"Your education ({student_edu_str}) qualifies for vocational entry in this trade."
    elif student_scale == min_required_scale - 1:
        return 0.60, "bridge_pathway", "May require a short foundational preparation or bridge certificate prior to full entry."
    else:
        return 0.30, "higher_qualification_needed", "Typically requires higher formal education or vocational prerequisites."


def score_interests(
    student_interests: List[str],
    student_skills: List[str],
    occ_name: str,
    occ_sector: Optional[str],
    occ_roles: List[str],
) -> Tuple[Optional[float], str, str]:
    """
    Compares explicit student interests and skills against career sector and job roles.
    Returns: (score, factor_result, summary)
    """
    if not student_interests and not student_skills:
        return None, "interests_unspecified", "No vocational interests or skills specified in student profile"

    # Build student keyword token set
    student_tokens: Set[str] = set()
    for item in student_interests + student_skills:
        item_clean = item.lower().strip()
        student_tokens.add(item_clean)
        student_tokens.update(tokenize_text(item_clean))
        if item_clean in INTEREST_KEYWORD_TAXONOMY:
            student_tokens.update(INTEREST_KEYWORD_TAXONOMY[item_clean])

    # Build career keyword token set
    career_tokens = tokenize_text(occ_name)
    if occ_sector:
        occ_sec_clean = occ_sector.lower().strip()
        career_tokens.add(occ_sec_clean)
        career_tokens.update(tokenize_text(occ_sec_clean))
        if occ_sec_clean in INTEREST_KEYWORD_TAXONOMY:
            career_tokens.update(INTEREST_KEYWORD_TAXONOMY[occ_sec_clean])

    for role in occ_roles:
        career_tokens.update(tokenize_text(role))

    # Calculate token overlap
    intersection = student_tokens.intersection(career_tokens)
    overlap_count = len(intersection)

    # Check for direct sector match
    direct_sector_match = False
    if occ_sector:
        occ_sec_lower = occ_sector.lower().strip()
        direct_sector_match = any(
            occ_sec_lower == i.lower().strip() or occ_sec_lower in i.lower()
            for i in student_interests
        )

    if direct_sector_match or overlap_count >= 3:
        matched_tags = list(intersection)[:3]
        return 1.0, "strong_match", f"Direct alignment with your interests in {occ_sector or occ_name} ({', '.join(matched_tags)})."
    elif overlap_count >= 2:
        return 0.85, "good_match", f"Good alignment with your vocational skills and preferences in {occ_sector or occ_name}."
    elif overlap_count >= 1:
        return 0.50, "moderate_overlap", f"Partial overlap with your selected vocational interests ({list(intersection)[0]})."
    else:
        return 0.15, "low_overlap", f"Limited direct overlap with your currently selected profile interest tags."


def score_location(
    student_location: Optional[str],
    work_prefs: List[str],
    provider_locations: List[str],
    outcome_regions: List[str],
) -> Tuple[Optional[float], str, str]:
    """
    Evaluates geographic accessibility based on student home location and work preferences.
    Returns: (score, factor_result, summary)
    """
    clean_prefs = [p.lower() for p in work_prefs]
    open_to_relocation = any("anywhere in india" in p or "open to relocation" in p or "remote" in p for p in clean_prefs)

    if not student_location and not work_prefs:
        return None, "location_unspecified", "Location preferences not set in student profile"

    if open_to_relocation:
        return 0.95, "strong_match", "Open to relocation across state and national vocational hubs."

    # Extract state from student location (e.g. 'Visakhapatnam, Andhra Pradesh')
    student_state = ""
    student_district = ""
    if student_location:
        parts = [p.strip() for p in student_location.split(",") if p.strip()]
        if len(parts) >= 2:
            student_district = parts[0].lower()
            student_state = parts[-1].lower()
        elif len(parts) == 1:
            student_state = parts[0].lower()

    if not student_state:
        return None, "location_unspecified", "Home state or district not identifiable from profile"

    # Check for direct district match in outcome regions
    district_matched = any(student_district and student_district in r.lower() for r in outcome_regions)
    if district_matched:
        return 1.0, "strong_match", f"Direct training access and recorded placements in your home district."

    # Check for state match in provider locations or outcome regions
    provider_state_matched = any(student_state in pl.lower() for pl in provider_locations)
    outcome_state_matched = any(student_state in r.lower() for r in outcome_regions)

    if provider_state_matched or outcome_state_matched:
        return 0.90, "state_match", f"Available within your home state with accredited centers and job placements."
    else:
        return 0.35, "relocation_required", "Accredited training centers for this specific trade are situated outside your home state."


def score_salary(
    household_income: Optional[str],
    career_sal_min: Optional[int],
    career_sal_max: Optional[int],
) -> Tuple[Optional[float], str, str]:
    """
    Compares career wage ranges against student household economic expectations.
    Returns: (score, factor_result, summary)
    """
    if not career_sal_max or career_sal_max <= 0:
        return None, "salary_data_unavailable", "Verified wage data not available for this trade"

    # If student income range is missing or prefer not to say, treat as unknown
    if not household_income or "prefer not to say" in household_income.lower():
        return None, "salary_preference_unspecified", "Salary preference not specified in student profile"

    clean_inc = household_income.lower()
    target_salary = 12000
    if "below" in clean_inc:
        target_salary = 10000
    elif "1–3" in clean_inc or "1-3" in clean_inc:
        target_salary = 15000
    elif "3–5" in clean_inc or "3-5" in clean_inc:
        target_salary = 20000
    elif "5–10" in clean_inc or "5-10" in clean_inc or "10" in clean_inc:
        target_salary = 25000

    if career_sal_max >= target_salary:
        return 1.0, "strong_match", f"Empirical wages (up to ₹{career_sal_max:,}/mo) align well with your household target."
    elif career_sal_max >= target_salary * 0.8:
        return 0.75, "moderate_match", f"Starting wages (₹{career_sal_min:,}–₹{career_sal_max:,}/mo) offer realistic growth."
    else:
        return 0.45, "entry_level_earnings", f"Initial vocational wages (max ₹{career_sal_max:,}/mo) may be below higher targets."


def score_training(
    career_intent: Optional[str],
    durations: List[str],
) -> Tuple[Optional[float], str, str]:
    """
    Matches course commitment duration against student training intent.
    Returns: (score, factor_result, summary)
    """
    if not durations:
        return None, "duration_unrecorded", "Training duration not recorded in syllabus"

    if not career_intent:
        return 0.85, "neutral", "Standard vocational training duration (3–6 Months)."

    intent_lower = career_intent.lower()
    has_short = any("2" in d or "3" in d for d in durations)
    has_medium = any("4" in d or "5" in d or "6" in d for d in durations)

    if "job soon" in intent_lower:
        if has_short:
            return 1.0, "strong_match", "Fast-track training duration (≤ 3 Months) supports rapid workforce entry."
        else:
            return 0.50, "longer_duration", f"Training duration ({durations[0]}) is slightly longer than fast-track."
    elif "vocational training" in intent_lower:
        if has_medium or has_short:
            return 1.0, "strong_match", f"Accredited curriculum ({durations[0]}) balances theory and hands-on workshop training."
        else:
            return 0.75, "good_match", f"Structured program duration: {durations[0]}."
    elif "continue studying" in intent_lower:
        return 0.80, "pathway_available", "Includes progression ladder supporting vertical educational mobility."
    else:
        return 0.85, "compatible", f"Standard vocational program commitment: {durations[0]}."


def score_employment(
    career_intent: Optional[str],
    career_prefs: List[str],
    self_employment: Optional[str],
    placement_rate: Optional[float],
) -> Tuple[Optional[float], str, str]:
    """
    Evaluates employment preferences (placement security, entrepreneurship, trade style).
    Returns: (score, factor_result, summary)
    """
    clean_prefs = [p.lower() for p in career_prefs]
    wants_entrepreneurship = any("business" in p or "entrepreneur" in p or "skilled trade" in p for p in clean_prefs)

    if placement_rate is None and not self_employment:
        return None, "placement_data_unrecorded", "Employment rate data pending verification"

    rate_score = 0.70
    rate_desc = "Standard employment rate"
    if placement_rate is not None:
        if placement_rate >= 75.0:
            rate_score = 0.95
            rate_desc = f"Strong placement record ({placement_rate}% average across recorded batches)"
        elif placement_rate >= 68.0:
            rate_score = 0.80
            rate_desc = f"Consistent placement track record ({placement_rate}%)"
        else:
            rate_score = 0.60
            rate_desc = f"Historical placement rate ({placement_rate}%)"

    # Self-employment bonus if requested
    if wants_entrepreneurship and self_employment and self_employment.lower() == "high":
        return 1.0, "strong_match", f"High self-employment and contractor opportunities, plus {rate_desc}."

    return rate_score, "compatible", rate_desc


# ==============================================================================
# 4. FINAL WEIGHTED CALCULATION & EXPLAINABILITY
# ==============================================================================

def calculate_compatibility(
    user: User,
    profile: StudentProfile,
    occ: Occupation,
    courses: List[Course],
    job_outcomes: List[JobOutcome],
) -> Dict[str, Any]:
    """
    Calculates deterministic compatibility score and structured factor evidence.
    """
    # Pre-extract career metadata
    career_quals = list(set([c.qualification_level for c in courses if c.qualification_level]))
    durations = list(set([c.duration for c in courses if c.duration]))
    provider_locs = list(set([c.provider.location for c in courses if c.provider and c.provider.location]))
    outcome_regions = list(set([j.region for j in job_outcomes if j.region]))

    # Wages and placement from outcomes
    sal_min = None
    sal_max = None
    if job_outcomes:
        sal_mins = [j.salary_range_min for j in job_outcomes if j.salary_range_min is not None]
        sal_maxs = [j.salary_range_max for j in job_outcomes if j.salary_range_max is not None]
        if sal_mins:
            sal_min = min(sal_mins)
        if sal_maxs:
            sal_max = max(sal_maxs)

    placement_rate = None
    if job_outcomes:
        rates = [j.employment_rate for j in job_outcomes if j.employment_rate is not None]
        if rates:
            placement_rate = round(sum(rates) / len(rates), 1)

    occ_roles = []
    self_emp = None
    if isinstance(occ.skill_requirements, dict):
        occ_roles = occ.skill_requirements.get("roles", [])
        self_emp = occ.skill_requirements.get("self_employment")

    interests = profile.interests if isinstance(profile.interests, list) else []
    skills = profile.skills if isinstance(profile.skills, list) else []
    work_prefs = profile.work_location_preferences if isinstance(profile.work_location_preferences, list) else []
    career_prefs = profile.career_preferences if isinstance(profile.career_preferences, list) else []

    # Score each factor independently
    edu_score, edu_res, edu_summary = score_education(profile.education_level, career_quals)
    int_score, int_res, int_summary = score_interests(interests, skills, occ.name, occ.sector, occ_roles)
    loc_score, loc_res, loc_summary = score_location(profile.location, work_prefs, provider_locs, outcome_regions)
    sal_score, sal_res, sal_summary = score_salary(profile.household_income_range, sal_min, sal_max)
    trn_score, trn_res, trn_summary = score_training(profile.career_intent, durations)
    emp_score, emp_res, emp_summary = score_employment(profile.career_intent, career_prefs, self_emp, placement_rate)

    raw_scores = {
        "education": (edu_score, edu_res, edu_summary),
        "interests": (int_score, int_res, int_summary),
        "location": (loc_score, loc_res, loc_summary),
        "salary": (sal_score, sal_res, sal_summary),
        "training": (trn_score, trn_res, trn_summary),
        "employment": (emp_score, emp_res, emp_summary),
    }

    # Aggregate weighted score across KNOWN factors
    known_weight_sum = 0.0
    weighted_score_sum = 0.0

    matched_factors: List[FactorEvaluation] = []
    mismatched_factors: List[FactorEvaluation] = []
    unknown_factors: List[FactorEvaluation] = []

    for factor_name, (score_val, result_tag, summary_txt) in raw_scores.items():
        weight = RECOMMENDATION_WEIGHTS[factor_name]
        eval_item = FactorEvaluation(
            factor=factor_name,
            result=result_tag,
            summary=summary_txt,
            score=round(score_val, 2) if score_val is not None else None,
        )

        if score_val is None:
            unknown_factors.append(eval_item)
        else:
            known_weight_sum += weight
            weighted_score_sum += score_val * weight

            if score_val >= 0.70:
                matched_factors.append(eval_item)
            else:
                mismatched_factors.append(eval_item)

    if known_weight_sum > 0:
        final_percentage = (weighted_score_sum / known_weight_sum) * 100.0
    else:
        final_percentage = 50.0  # Neutral baseline if zero profile data provided

    final_score = int(round(final_percentage))
    final_score = max(0, min(100, final_score))

    # Build summary object for response
    top_regions: List[str] = []
    for r in outcome_regions[:3]:
        if ", " in r:
            top_regions.append(r.split(", ")[-1])
        else:
            top_regions.append(r)

    summary = CareerSummary(
        id=occ.id,
        name=occ.name,
        sector=occ.sector,
        description=occ.description or f"Verified technical trade in {occ.sector or 'vocational'} sector.",
        common_roles=occ_roles,
        self_employment=self_emp,
        salary_min=sal_min,
        salary_max=sal_max,
        salary_currency="INR",
        average_placement_rate=placement_rate,
        qualification_levels=career_quals,
        training_durations=durations,
        courses_count=len(courses),
        providers_count=len(set([c.provider_id for c in courses if c.provider_id])),
        top_regions=top_regions[:3],
        source="Ministry of Skill Development & Entrepreneurship (MSDE) / NSDC",
    )

    return {
        "career": summary,
        "compatibility_score": final_score,
        "matched_factors": matched_factors,
        "mismatched_factors": mismatched_factors,
        "unknown_factors": unknown_factors,
        "interest_score": int_score if int_score is not None else 0.0,
        "education_score": edu_score if edu_score is not None else 0.0,
    }


# ==============================================================================
# 5. RECOMMENDATION SERVICE INTERFACE (TOP 3 RANKING)
# ==============================================================================

def generate_recommendations(
    user: User,
    profile: StudentProfile,
    db: Session,
    limit: int = 3,
) -> CareerRecommendationsResponse:
    """
    Determines and ranks the Top 3 career recommendations using strictly deterministic logic.
    Deterministic Tie-Breaking Hierarchy:
    1. Higher compatibility score
    2. Higher count of matched factors
    3. Stronger interest score
    4. Stronger education score
    5. Career trade name (alphabetical ascending)
    """
    occupations = db.query(Occupation).all()
    if not occupations:
        return CareerRecommendationsResponse(
            recommendations=[],
            weights_used=RECOMMENDATION_WEIGHTS,
            algorithm="deterministic_compatibility_v1",
        )

    evaluated_candidates: List[Dict[str, Any]] = []

    for occ in occupations:
        # Preload courses and outcomes for this trade
        courses = db.query(Course).filter(Course.name == occ.name).all()
        outcomes = db.query(JobOutcome).filter(JobOutcome.occupation_id == occ.id).all()

        eval_result = calculate_compatibility(
            user=user,
            profile=profile,
            occ=occ,
            courses=courses,
            job_outcomes=outcomes,
        )
        evaluated_candidates.append(eval_result)

    # Deterministic Sort
    evaluated_candidates.sort(
        key=lambda x: (
            -x["compatibility_score"],
            -len(x["matched_factors"]),
            -x["interest_score"],
            -x["education_score"],
            x["career"].name,
        )
    )

    # Return exactly top 3 candidates
    top_candidates = evaluated_candidates[:limit]

    items = [
        CareerRecommendationItem(
            career=c["career"],
            compatibility_score=c["compatibility_score"],
            matched_factors=c["matched_factors"],
            mismatched_factors=c["mismatched_factors"],
            unknown_factors=c["unknown_factors"],
        )
        for c in top_candidates
    ]

    return CareerRecommendationsResponse(
        recommendations=items,
        weights_used=RECOMMENDATION_WEIGHTS,
        algorithm="deterministic_compatibility_v1",
    )
