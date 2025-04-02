import psycopg2
from os import environ

def get_psycopg2_connection():
    return psycopg2.connect(
        host=environ["POSTGRES_WEBBOT_HOST"],
        port=environ["POSTGRES_WEBBOT_PORT"],
        database=environ["POSTGRES_WEBBOT_DB"],
        user=environ["POSTGRES_WEBBOT_USER"],
        password=environ["POSTGRES_WEBBOT_PASSWORD"],
    )
