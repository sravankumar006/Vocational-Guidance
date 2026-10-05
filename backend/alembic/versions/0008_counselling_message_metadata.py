"""Add confidence and human-review metadata to counselling messages.

Revision ID: 0008_counselling_message_metadata
Revises: 0007_postgresql_enum_types
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0008_message_metadata"
down_revision: Union[str, None] = "0007_postgresql_enum_types"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_columns = {
        column["name"] for column in sa.inspect(bind).get_columns("counselling_messages")
    }

    if "confidence" not in existing_columns:
        op.add_column("counselling_messages", sa.Column("confidence", sa.Float(), nullable=True))
    if "requires_human" not in existing_columns:
        op.add_column(
            "counselling_messages",
            sa.Column("requires_human", sa.Boolean(), server_default=sa.text("false"), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("counselling_messages", "requires_human")
    op.drop_column("counselling_messages", "confidence")