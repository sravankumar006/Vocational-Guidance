"""Add case-record fields to human_escalations table (Phase 9 Brick 31).

Revision ID: 0005_human_escalation_case_record
Revises: 0004_career_intent
Create Date: 2026-10-04 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005_human_escalation_case_record'
down_revision: Union[str, None] = '0004_career_intent'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c['name'] for c in insp.get_columns('human_escalations')}
    
    if 'student_id' not in existing_cols:
        op.add_column('human_escalations', sa.Column('student_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_human_escalations_student_id', 'human_escalations', 'student_profiles', ['student_id'], ['id'], ondelete='CASCADE')
        op.create_index(op.f('ix_human_escalations_student_id'), 'human_escalations', ['student_id'], unique=False)
        
    if 'parent_id' not in existing_cols:
        op.add_column('human_escalations', sa.Column('parent_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_human_escalations_parent_id', 'human_escalations', 'parent_profiles', ['parent_id'], ['id'], ondelete='SET NULL')
        op.create_index(op.f('ix_human_escalations_parent_id'), 'human_escalations', ['parent_id'], unique=False)

    if 'career_id' not in existing_cols:
        op.add_column('human_escalations', sa.Column('career_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_human_escalations_career_id', 'human_escalations', 'occupations', ['career_id'], ['id'], ondelete='SET NULL')
        op.create_index(op.f('ix_human_escalations_career_id'), 'human_escalations', ['career_id'], unique=False)

    if 'concern' not in existing_cols:
        op.add_column('human_escalations', sa.Column('concern', sa.String(length=100), nullable=True))
        op.create_index(op.f('ix_human_escalations_concern'), 'human_escalations', ['concern'], unique=False)

    if 'language' not in existing_cols:
        op.add_column('human_escalations', sa.Column('language', sa.String(length=10), server_default='en', nullable=False))

    if 'conversation_summary' not in existing_cols:
        op.add_column('human_escalations', sa.Column('conversation_summary', sa.Text(), nullable=True))

    if 'updated_at' not in existing_cols:
        op.add_column('human_escalations', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))


def downgrade() -> None:
    op.drop_column('human_escalations', 'updated_at')
    op.drop_column('human_escalations', 'conversation_summary')
    op.drop_column('human_escalations', 'language')
    op.drop_column('human_escalations', 'concern')
    op.drop_column('human_escalations', 'career_id')
    op.drop_column('human_escalations', 'parent_id')
    op.drop_column('human_escalations', 'student_id')
