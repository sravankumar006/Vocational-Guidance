"""Add progressive profile fields to student_profiles table (Phase 3 Brick 11).

Revision ID: 0003_student_progressive_profile
Revises: 0002_auth_and_family_context
Create Date: 2026-10-03 10:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003_student_progressive_profile'
down_revision: Union[str, None] = '0002_auth_and_family_context'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add progressive profile collection columns to student_profiles table
    # Safe & idempotent for both SQLite (dev) and PostgreSQL (prod)
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c['name'] for c in insp.get_columns('student_profiles')}

    cols_to_add = [
        ('age', sa.Column('age', sa.Integer(), nullable=True)),
        ('institution', sa.Column('institution', sa.String(length=255), nullable=True)),
        ('academic_strengths', sa.Column('academic_strengths', sa.JSON(), nullable=True)),
        ('household_income_range', sa.Column('household_income_range', sa.String(length=50), nullable=True)),
        ('work_location_preferences', sa.Column('work_location_preferences', sa.JSON(), nullable=True)),
        ('career_preferences', sa.Column('career_preferences', sa.JSON(), nullable=True)),
    ]
    for col_name, col_def in cols_to_add:
        if col_name not in existing_cols:
            op.add_column('student_profiles', col_def)


def downgrade() -> None:
    op.drop_column('student_profiles', 'career_preferences')
    op.drop_column('student_profiles', 'work_location_preferences')
    op.drop_column('student_profiles', 'household_income_range')
    op.drop_column('student_profiles', 'academic_strengths')
    op.drop_column('student_profiles', 'institution')
    op.drop_column('student_profiles', 'age')
