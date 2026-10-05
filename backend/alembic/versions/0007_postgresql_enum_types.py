"""Create PostgreSQL enum types used by the SQLAlchemy models.

Revision ID: 0007_postgresql_enum_types
Revises: 0006_lifecycle_and_escalation
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0007_postgresql_enum_types"
down_revision: Union[str, None] = "0006_lifecycle_and_escalation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ENUM_COLUMNS = (
    ("users", "role", "user_role_enum", ("STUDENT", "PARENT", "ADMIN", "COUNSELLOR"), "STUDENT"),
    (
        "counselling_sessions",
        "status",
        "session_status_enum",
        ("ACTIVE", "COMPLETED", "PAUSED", "ESCALATED"),
        "ACTIVE",
    ),
    (
        "counselling_messages",
        "sender_type",
        "message_sender_enum",
        ("STUDENT", "PARENT", "AI", "COUNSELLOR", "SYSTEM"),
        None,
    ),
    (
        "parent_concerns",
        "severity",
        "concern_severity_enum",
        ("LOW", "MEDIUM", "HIGH"),
        "MEDIUM",
    ),
    (
        "parent_concerns",
        "status",
        "concern_status_enum",
        ("OPEN", "ADDRESSED", "RESOLVED"),
        "OPEN",
    ),
    (
        "human_escalations",
        "priority",
        "escalation_priority_enum",
        ("LOW", "MEDIUM", "HIGH", "URGENT"),
        "MEDIUM",
    ),
    (
        "human_escalations",
        "status",
        "escalation_status_enum",
        ("PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "DISMISSED"),
        "PENDING",
    ),
    (
        "sentiment_events",
        "sentiment",
        "sentiment_type_enum",
        ("POSITIVE", "NEUTRAL", "CONCERNED", "NEGATIVE"),
        None,
    ),
)


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    for table_name, column_name, type_name, values, default in ENUM_COLUMNS:
        enum_type = postgresql.ENUM(*values, name=type_name, create_type=False)
        enum_type.create(bind, checkfirst=True)

        op.execute(
            sa.text(
                f"UPDATE {table_name} "
                f"SET {column_name} = upper(replace({column_name}, 'in_progress', 'IN_PROGRESS')) "
                f"WHERE {column_name} IS NOT NULL"
            )
        )
        op.alter_column(table_name, column_name, server_default=None)
        op.alter_column(
            table_name,
            column_name,
            type_=enum_type,
            postgresql_using=f"{column_name}::text::{type_name}",
        )
        if default is not None:
            op.alter_column(
                table_name,
                column_name,
                server_default=sa.text(f"'{default}'::{type_name}"),
            )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    for table_name, column_name, type_name, _values, default in reversed(ENUM_COLUMNS):
        op.alter_column(table_name, column_name, server_default=None)
        op.alter_column(
            table_name,
            column_name,
            type_=sa.String(length=50),
            postgresql_using=f"{column_name}::text",
        )
        if default is not None:
            op.alter_column(table_name, column_name, server_default=sa.text(f"'{default.lower()}'"))

    for _table_name, _column_name, type_name, _values, _default in reversed(ENUM_COLUMNS):
        op.execute(sa.text(f"DROP TYPE IF EXISTS {type_name}"))