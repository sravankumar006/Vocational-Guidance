"""Add case-record fields to human_escalations table (Phase 9 Brick 31).

Revision ID: 0005_human_escalation_case_record
Revises: 0004_career_intent
Create Date: 2026-10-04 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005_escalation_case'
down_revision: Union[str, None] = '0004_career_intent'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c['name'] for c in insp.get_columns('human_escalations')}

    recreate = 'always' if bind.dialect.name == 'sqlite' else 'auto'
    with op.batch_alter_table('human_escalations', recreate=recreate) as batch_op:
        if 'student_id' not in existing_cols:
            batch_op.add_column(sa.Column('student_id', sa.Integer(), nullable=True))
            batch_op.create_foreign_key(
                'fk_human_escalations_student_id',
                'student_profiles',
                ['student_id'],
                ['id'],
                ondelete='CASCADE',
            )
            batch_op.create_index(op.f('ix_human_escalations_student_id'), ['student_id'], unique=False)

        if 'parent_id' not in existing_cols:
            batch_op.add_column(sa.Column('parent_id', sa.Integer(), nullable=True))
            batch_op.create_foreign_key(
                'fk_human_escalations_parent_id',
                'parent_profiles',
                ['parent_id'],
                ['id'],
                ondelete='SET NULL',
            )
            batch_op.create_index(op.f('ix_human_escalations_parent_id'), ['parent_id'], unique=False)

        if 'career_id' not in existing_cols:
            batch_op.add_column(sa.Column('career_id', sa.Integer(), nullable=True))
            batch_op.create_foreign_key(
                'fk_human_escalations_career_id',
                'occupations',
                ['career_id'],
                ['id'],
                ondelete='SET NULL',
            )
            batch_op.create_index(op.f('ix_human_escalations_career_id'), ['career_id'], unique=False)

        if 'concern' not in existing_cols:
            batch_op.add_column(sa.Column('concern', sa.String(length=100), nullable=True))
            batch_op.create_index(op.f('ix_human_escalations_concern'), ['concern'], unique=False)

        if 'language' not in existing_cols:
            batch_op.add_column(sa.Column('language', sa.String(length=10), server_default='en', nullable=False))

        if 'conversation_summary' not in existing_cols:
            batch_op.add_column(sa.Column('conversation_summary', sa.Text(), nullable=True))

        if 'updated_at' not in existing_cols:
            batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))


def downgrade() -> None:
    op.drop_column('human_escalations', 'updated_at')
    op.drop_column('human_escalations', 'conversation_summary')
    op.drop_column('human_escalations', 'language')
    op.drop_column('human_escalations', 'concern')
    op.drop_column('human_escalations', 'career_id')
    op.drop_column('human_escalations', 'parent_id')
    op.drop_column('human_escalations', 'student_id')
