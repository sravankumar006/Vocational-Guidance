"""create initial 14 models and associations

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-02 16:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 0. Ensure pgvector extension
    try:
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    except Exception:
        pass

    # 1. data_sources
    op.create_table(
        'data_sources',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('source_type', sa.String(length=100), nullable=True),
        sa.Column('url', sa.String(length=500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('version', sa.String(length=50), nullable=True),
        sa.Column('retrieved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_data_sources_id'), 'data_sources', ['id'], unique=False)
    op.create_index(op.f('ix_data_sources_name'), 'data_sources', ['name'], unique=False)

    # 2. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=32), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='student'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_phone'), 'users', ['phone'], unique=True)

    # 3. training_providers
    op.create_table(
        'training_providers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('provider_type', sa.String(length=100), nullable=True),
        sa.Column('contact_info', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_training_providers_id'), 'training_providers', ['id'], unique=False)
    op.create_index(op.f('ix_training_providers_name'), 'training_providers', ['name'], unique=False)
    op.create_index(op.f('ix_training_providers_location'), 'training_providers', ['location'], unique=False)

    # 4. occupations
    op.create_table(
        'occupations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('sector', sa.String(length=150), nullable=True),
        sa.Column('skill_requirements', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_occupations_id'), 'occupations', ['id'], unique=False)
    op.create_index(op.f('ix_occupations_name'), 'occupations', ['name'], unique=False)
    op.create_index(op.f('ix_occupations_sector'), 'occupations', ['sector'], unique=False)

    # 5. career_paths
    op.create_table(
        'career_paths',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('progression_ladder', sa.JSON(), nullable=True),
        sa.Column('estimated_duration', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_career_paths_id'), 'career_paths', ['id'], unique=False)
    op.create_index(op.f('ix_career_paths_name'), 'career_paths', ['name'], unique=False)

    # 6. student_profiles
    op.create_table(
        'student_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('education_level', sa.String(length=100), nullable=True),
        sa.Column('education_stream', sa.String(length=100), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('interests', sa.JSON(), nullable=True),
        sa.Column('skills', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_student_profiles_id'), 'student_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_student_profiles_user_id'), 'student_profiles', ['user_id'], unique=True)

    # 7. parent_profiles
    op.create_table(
        'parent_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('relationship_to_student', sa.String(length=50), nullable=True),
        sa.Column('occupation', sa.String(length=150), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_parent_profiles_id'), 'parent_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_parent_profiles_user_id'), 'parent_profiles', ['user_id'], unique=True)

    # 8. courses
    op.create_table(
        'courses',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duration', sa.String(length=100), nullable=True),
        sa.Column('qualification_level', sa.String(length=100), nullable=True),
        sa.Column('sector', sa.String(length=150), nullable=True),
        sa.Column('delivery_mode', sa.String(length=100), nullable=True),
        sa.Column('provider_id', sa.Integer(), nullable=True),
        sa.Column('data_source_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['data_source_id'], ['data_sources.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['provider_id'], ['training_providers.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_courses_id'), 'courses', ['id'], unique=False)
    op.create_index(op.f('ix_courses_name'), 'courses', ['name'], unique=False)
    op.create_index(op.f('ix_courses_provider_id'), 'courses', ['provider_id'], unique=False)
    op.create_index(op.f('ix_courses_sector'), 'courses', ['sector'], unique=False)

    # 9. Association: career_path_courses
    op.create_table(
        'career_path_courses',
        sa.Column('career_path_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('sequence_order', sa.Integer(), server_default='1', nullable=False),
        sa.ForeignKeyConstraint(['career_path_id'], ['career_paths.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('career_path_id', 'course_id')
    )

    # 10. Association: career_path_occupations
    op.create_table(
        'career_path_occupations',
        sa.Column('career_path_id', sa.Integer(), nullable=False),
        sa.Column('occupation_id', sa.Integer(), nullable=False),
        sa.Column('role_level', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['career_path_id'], ['career_paths.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['occupation_id'], ['occupations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('career_path_id', 'occupation_id')
    )

    # 11. job_outcomes
    op.create_table(
        'job_outcomes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('occupation_id', sa.Integer(), nullable=True),
        sa.Column('career_path_id', sa.Integer(), nullable=True),
        sa.Column('data_source_id', sa.Integer(), nullable=True),
        sa.Column('employment_rate', sa.Float(), nullable=True),
        sa.Column('salary_range_min', sa.Integer(), nullable=True),
        sa.Column('salary_range_max', sa.Integer(), nullable=True),
        sa.Column('salary_currency', sa.String(length=10), server_default='INR', nullable=False),
        sa.Column('experience_level', sa.String(length=50), nullable=True),
        sa.Column('region', sa.String(length=150), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['career_path_id'], ['career_paths.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['data_source_id'], ['data_sources.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['occupation_id'], ['occupations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_job_outcomes_id'), 'job_outcomes', ['id'], unique=False)
    op.create_index(op.f('ix_job_outcomes_occupation_id'), 'job_outcomes', ['occupation_id'], unique=False)
    op.create_index(op.f('ix_job_outcomes_career_path_id'), 'job_outcomes', ['career_path_id'], unique=False)
    op.create_index(op.f('ix_job_outcomes_region'), 'job_outcomes', ['region'], unique=False)

    # 12. counselling_sessions
    op.create_table(
        'counselling_sessions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('student_profile_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['student_profile_id'], ['student_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_counselling_sessions_id'), 'counselling_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_counselling_sessions_student_profile_id'), 'counselling_sessions', ['student_profile_id'], unique=False)
    op.create_index(op.f('ix_counselling_sessions_status'), 'counselling_sessions', ['status'], unique=False)

    # 13. counselling_messages
    op.create_table(
        'counselling_messages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('sender_type', sa.String(length=50), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['counselling_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_counselling_messages_id'), 'counselling_messages', ['id'], unique=False)
    op.create_index(op.f('ix_counselling_messages_session_id'), 'counselling_messages', ['session_id'], unique=False)
    op.create_index(op.f('ix_counselling_messages_created_at'), 'counselling_messages', ['created_at'], unique=False)

    # 14. parent_concerns
    op.create_table(
        'parent_concerns',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('parent_profile_id', sa.Integer(), nullable=False),
        sa.Column('student_profile_id', sa.Integer(), nullable=True),
        sa.Column('counselling_session_id', sa.Integer(), nullable=True),
        sa.Column('concern_type', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=50), server_default='medium', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='open', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['counselling_session_id'], ['counselling_sessions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['parent_profile_id'], ['parent_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_profile_id'], ['student_profiles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_parent_concerns_id'), 'parent_concerns', ['id'], unique=False)
    op.create_index(op.f('ix_parent_concerns_parent_profile_id'), 'parent_concerns', ['parent_profile_id'], unique=False)
    op.create_index(op.f('ix_parent_concerns_concern_type'), 'parent_concerns', ['concern_type'], unique=False)
    op.create_index(op.f('ix_parent_concerns_status'), 'parent_concerns', ['status'], unique=False)

    # 15. human_escalations
    op.create_table(
        'human_escalations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('counselling_session_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=50), server_default='medium', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='pending', nullable=False),
        sa.Column('assigned_to_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['counselling_session_id'], ['counselling_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_human_escalations_id'), 'human_escalations', ['id'], unique=False)
    op.create_index(op.f('ix_human_escalations_counselling_session_id'), 'human_escalations', ['counselling_session_id'], unique=False)
    op.create_index(op.f('ix_human_escalations_status'), 'human_escalations', ['status'], unique=False)

    # 16. sentiment_events
    op.create_table(
        'sentiment_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('counselling_session_id', sa.Integer(), nullable=False),
        sa.Column('counselling_message_id', sa.Integer(), nullable=True),
        sa.Column('sentiment', sa.String(length=50), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['counselling_message_id'], ['counselling_messages.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['counselling_session_id'], ['counselling_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sentiment_events_id'), 'sentiment_events', ['id'], unique=False)
    op.create_index(op.f('ix_sentiment_events_counselling_session_id'), 'sentiment_events', ['counselling_session_id'], unique=False)


def downgrade() -> None:
    op.drop_table('sentiment_events')
    op.drop_table('human_escalations')
    op.drop_table('parent_concerns')
    op.drop_table('counselling_messages')
    op.drop_table('counselling_sessions')
    op.drop_table('job_outcomes')
    op.drop_table('career_path_occupations')
    op.drop_table('career_path_courses')
    op.drop_table('courses')
    op.drop_table('parent_profiles')
    op.drop_table('student_profiles')
    op.drop_table('career_paths')
    op.drop_table('occupations')
    op.drop_table('training_providers')
    op.drop_table('users')
    op.drop_table('data_sources')
