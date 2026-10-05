"""Add lifecycle status, verification, and escalation details

Revision ID: 0006_lifecycle_and_escalation
Revises: 0005_human_escalation_case_record
Create Date: 2026-10-05 18:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006_lifecycle_and_escalation'
down_revision: Union[str, None] = '0005_escalation_case'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    def add_col_if_missing(table_name: str, col_name: str, column_def: sa.Column):
        existing_cols = {c['name'] for c in insp.get_columns(table_name)}
        if col_name not in existing_cols:
            op.add_column(table_name, column_def)

    # 1. data_sources
    add_col_if_missing('data_sources', 'status', sa.Column('status', sa.String(length=50), server_default='demo', nullable=False))
    add_col_if_missing('data_sources', 'verified_at', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    add_col_if_missing('data_sources', 'verified_by', sa.Column('verified_by', sa.Integer(), nullable=True))

    # 2. training_providers
    add_col_if_missing('training_providers', 'status', sa.Column('status', sa.String(length=50), server_default='demo', nullable=False))
    add_col_if_missing('training_providers', 'verified_at', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    add_col_if_missing('training_providers', 'verified_by', sa.Column('verified_by', sa.Integer(), nullable=True))
    add_col_if_missing('training_providers', 'data_source_id', sa.Column('data_source_id', sa.Integer(), nullable=True))

    # 3. courses
    add_col_if_missing('courses', 'status', sa.Column('status', sa.String(length=50), server_default='demo', nullable=False))
    add_col_if_missing('courses', 'verified_at', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    add_col_if_missing('courses', 'verified_by', sa.Column('verified_by', sa.Integer(), nullable=True))

    # 4. occupations
    add_col_if_missing('occupations', 'status', sa.Column('status', sa.String(length=50), server_default='demo', nullable=False))
    add_col_if_missing('occupations', 'verified_at', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    add_col_if_missing('occupations', 'verified_by', sa.Column('verified_by', sa.Integer(), nullable=True))
    add_col_if_missing('occupations', 'data_source_id', sa.Column('data_source_id', sa.Integer(), nullable=True))

    # 5. career_paths
    add_col_if_missing('career_paths', 'status', sa.Column('status', sa.String(length=50), server_default='demo', nullable=False))
    add_col_if_missing('career_paths', 'verified_at', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    add_col_if_missing('career_paths', 'verified_by', sa.Column('verified_by', sa.Integer(), nullable=True))
    add_col_if_missing('career_paths', 'data_source_id', sa.Column('data_source_id', sa.Integer(), nullable=True))

    # 6. job_outcomes
    add_col_if_missing('job_outcomes', 'status', sa.Column('status', sa.String(length=50), server_default='demo', nullable=False))
    add_col_if_missing('job_outcomes', 'verified_at', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    add_col_if_missing('job_outcomes', 'verified_by', sa.Column('verified_by', sa.Integer(), nullable=True))

    # 7. human_escalations
    add_col_if_missing('human_escalations', 'started_at', sa.Column('started_at', sa.DateTime(timezone=True), nullable=True))
    add_col_if_missing('human_escalations', 'resolved_by_user_id', sa.Column('resolved_by_user_id', sa.Integer(), nullable=True))
    add_col_if_missing('human_escalations', 'resolution_notes', sa.Column('resolution_notes', sa.Text(), nullable=True))


def downgrade() -> None:
    # human_escalations
    op.drop_column('human_escalations', 'resolution_notes')
    op.drop_column('human_escalations', 'resolved_by_user_id')
    op.drop_column('human_escalations', 'started_at')

    # job_outcomes
    op.drop_column('job_outcomes', 'verified_by')
    op.drop_column('job_outcomes', 'verified_at')
    op.drop_column('job_outcomes', 'status')

    # career_paths
    op.drop_column('career_paths', 'data_source_id')
    op.drop_column('career_paths', 'verified_by')
    op.drop_column('career_paths', 'verified_at')
    op.drop_column('career_paths', 'status')

    # occupations
    op.drop_column('occupations', 'data_source_id')
    op.drop_column('occupations', 'verified_by')
    op.drop_column('occupations', 'verified_at')
    op.drop_column('occupations', 'status')

    # courses
    op.drop_column('courses', 'verified_by')
    op.drop_column('courses', 'verified_at')
    op.drop_column('courses', 'status')

    # training_providers
    op.drop_column('training_providers', 'data_source_id')
    op.drop_column('training_providers', 'verified_by')
    op.drop_column('training_providers', 'verified_at')
    op.drop_column('training_providers', 'status')

    # data_sources
    op.drop_column('data_sources', 'verified_by')
    op.drop_column('data_sources', 'verified_at')
    op.drop_column('data_sources', 'status')
