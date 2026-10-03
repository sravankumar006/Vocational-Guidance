"""Add auth fields, user sessions, and parent-student associations

Revision ID: 0002_auth_and_family_context
Revises: 0001_initial_schema
Create Date: 2026-10-02 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002_auth_and_family_context'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add authentication fields to users table (preserving existing records)
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False))

    # 2. Create parent_student_associations table (family relational link)
    op.create_table(
        'parent_student_associations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('parent_profile_id', sa.Integer(), nullable=False),
        sa.Column('student_profile_id', sa.Integer(), nullable=False),
        sa.Column('relationship_type', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['parent_profile_id'], ['parent_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_profile_id'], ['student_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('parent_profile_id', 'student_profile_id', name='uq_parent_student')
    )
    op.create_index(
        op.f('ix_parent_student_associations_id'),
        'parent_student_associations',
        ['id'],
        unique=False
    )
    op.create_index(
        op.f('ix_parent_student_associations_parent_profile_id'),
        'parent_student_associations',
        ['parent_profile_id'],
        unique=False
    )
    op.create_index(
        op.f('ix_parent_student_associations_student_profile_id'),
        'parent_student_associations',
        ['student_profile_id'],
        unique=False
    )

    # 3. Create user_sessions table (refresh tokens & session revocation)
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_sessions_id'), 'user_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_user_sessions_user_id'), 'user_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_sessions_token_hash'), 'user_sessions', ['token_hash'], unique=True)
    op.create_index(op.f('ix_user_sessions_expires_at'), 'user_sessions', ['expires_at'], unique=False)


def downgrade() -> None:
    # 3. Drop user_sessions table
    op.drop_index(op.f('ix_user_sessions_expires_at'), table_name='user_sessions')
    op.drop_index(op.f('ix_user_sessions_token_hash'), table_name='user_sessions')
    op.drop_index(op.f('ix_user_sessions_user_id'), table_name='user_sessions')
    op.drop_index(op.f('ix_user_sessions_id'), table_name='user_sessions')
    op.drop_table('user_sessions')

    # 2. Drop parent_student_associations table
    op.drop_index(op.f('ix_parent_student_associations_student_profile_id'), table_name='parent_student_associations')
    op.drop_index(op.f('ix_parent_student_associations_parent_profile_id'), table_name='parent_student_associations')
    op.drop_index(op.f('ix_parent_student_associations_id'), table_name='parent_student_associations')
    op.drop_table('parent_student_associations')

    # 1. Drop authentication columns from users table
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'password_hash')
