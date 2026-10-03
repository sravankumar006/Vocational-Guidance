"""Add career_intent to student_profiles table (Phase 3 Brick 12).

Revision ID: 0004_career_intent
Revises: 0003_student_progressive_profile
Create Date: 2026-10-03 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004_career_intent'
down_revision: Union[str, None] = '0003_student_progressive_profile'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c['name'] for c in insp.get_columns('student_profiles')}
    if 'career_intent' not in existing_cols:
        op.add_column('student_profiles', sa.Column('career_intent', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('student_profiles', 'career_intent')
