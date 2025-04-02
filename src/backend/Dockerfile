# base from dev_dockers/Dockerfile.unsloth
FROM python:3.12.9-bookworm

RUN pip install --no-cache-dir torch wheel setuptools
RUN pip install --no-cache-dir unsloth
RUN pip install --no-cache-dir psycopg2

WORKDIR /app

COPY . /app
RUN pip install --no-cache -r /app/requirements.txt

CMD ["python", "/app/src/fastapi_backend_webbot.py"]
