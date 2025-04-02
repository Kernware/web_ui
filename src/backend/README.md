# Python Backend

Build and start via docker compose:
```
docker compose -p webbot -f src/backend/docker-compose.yml build python_backend postgres_webbot
docker compose -p webbot -f src/backend/docker-compose.yml up python_backend postgres_webbot -d
```



```
docker build -t backend-python_backend .
```

```
docker run \
    --gpus all \
    --network host \
    -v /mnt/storage/Data/DevelopDockers/UnslothDockerSpace:/app/shared_storage \
    -t backend-python_backend
```

```
docker compose -p webbot -f src/backend/docker-compose.yml up python_backend postgres_webbot
```
