from psycopg2.extras import NamedTupleCursor
from .connection import get_psycopg2_connection as get_conn


def store_query(query: str, answer: str, token: str):
    with get_conn() as conn, conn.cursor(cursor_factory=NamedTupleCursor) as curs:
        curs.execute(
            "INSERT INTO webbot.history (query, answer, token) VALUES (%s, %s, %s)",
            (query, answer, token),
        )
        conn.commit()
