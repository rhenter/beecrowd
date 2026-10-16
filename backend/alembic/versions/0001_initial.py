"""Create comments and watched episode state."""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "watched_episodes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("visitor_id", sa.String(length=36), nullable=False),
        sa.Column("show_id", sa.Integer(), nullable=False),
        sa.Column("episode_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("visitor_id", "episode_id", name="uq_watched_visitor_episode"),
    )
    op.create_index("ix_watched_episodes_visitor_id", "watched_episodes", ["visitor_id"])
    op.create_index("ix_watched_episodes_show_id", "watched_episodes", ["show_id"])
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("visitor_id", sa.String(length=36), nullable=False),
        sa.Column("display_name", sa.String(length=40), nullable=False),
        sa.Column("show_id", sa.Integer(), nullable=False),
        sa.Column("episode_id", sa.Integer(), nullable=True),
        sa.Column("body", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_comments_visitor_id", "comments", ["visitor_id"])
    op.create_index("ix_comments_show_id", "comments", ["show_id"])
    op.create_index("ix_comments_episode_id", "comments", ["episode_id"])


def downgrade() -> None:
    op.drop_index("ix_comments_episode_id", table_name="comments")
    op.drop_index("ix_comments_show_id", table_name="comments")
    op.drop_index("ix_comments_visitor_id", table_name="comments")
    op.drop_table("comments")
    op.drop_index("ix_watched_episodes_show_id", table_name="watched_episodes")
    op.drop_index("ix_watched_episodes_visitor_id", table_name="watched_episodes")
    op.drop_table("watched_episodes")
