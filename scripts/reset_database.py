#!/usr/bin/env python3
"""Wipe all Blueprint AI application data from Postgres (fresh start).

Does NOT delete Supabase Auth users — only the app tables (users, projects,
runs, outputs, logs, documents, analytics). Users are re-created on next API
call via upsert.

Usage (from repo root):
  cd backend && source .venv/bin/activate
  python ../scripts/reset_database.py

Requires DATABASE_URL in backend/.env (or the environment).
"""

from __future__ import annotations

import sys
from pathlib import Path

# Load backend settings
_backend = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(_backend))

from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import get_engine

# Child tables first; CASCADE from users covers the rest if we truncate users last.
TABLES = (
    "analytics",
    "execution_logs",
    "agent_outputs",
    "generated_documents",
    "agent_runs",
    "feature_requests",
    "projects",
    "users",
)


def main() -> None:
    settings = get_settings()
    engine = get_engine()
    print(f"Connecting to database (env={settings.app_env})…")
    with engine.begin() as conn:
        for table in TABLES:
            conn.execute(text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE'))
            print(f"  truncated {table}")
    print("Done — database is empty. Generate a new blueprint to repopulate.")


if __name__ == "__main__":
    main()
