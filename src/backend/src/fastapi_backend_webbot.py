import unsloth

import os
import json
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import postgres
from custom_logger.logger import create_logger

from unsloth_models.models import BotModel, FilterModel

logger = create_logger("MainLog", "ML")

DB_ENABLED: bool = True

bot_model = BotModel.initialize(model_path=Path(os.environ['BOT_MODEL_PATH']))
if bot_model is None:
    logger.error("Could not initialize bot model!")
    sys.exit(1)

filter_model = FilterModel.initialize(model_path=Path(os.environ['FILTER_MODEL_PATH']))
if filter_model is None:
    logger.error("Could not initialize filter model!")
    sys.exit(1)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # add external IP
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
    expose_headers=["*"],
)

RATELIMIT_MINUTE = 60
TIME_WINDOW = 60
request_total_logs: list[datetime] = []


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Middleware to apply rate limiting to all endpoints"""

    if request.method != "GET":
        raise HTTPException(status_code=402, detail="Authorization missing")

    try:
        # token is not used atm
        if 'token' not in request.query_params:
            raise HTTPException(status_code=401, detail="Authorization missing")
        token = request.query_params['token']
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail},
        )

    # check total requests to backend
    time_now = datetime.now()
    request_total_logs.append(time_now)

    # replace inplace to easier get count
    request_total_logs[:] = [
        ts for ts in request_total_logs 
        if time_now - ts <= timedelta(seconds=TIME_WINDOW)
    ]

    if len(request_total_logs) > RATELIMIT_MINUTE:
        raise HTTPException(
            status_code=403,
            detail=f"Rate limit exceeded."
        )

    return await call_next(request)


@app.get("/chat")
def chat(query: str, history: str, token: str):
    assert filter_model is not None
    assert bot_model is not None

    chat_history = json.loads(history) if history else []
    chat_history = [tuple(h) for h in chat_history]

    answer = filter_model.chat(query, chat_history)
    if answer == "nein":
        selection = [
            "Damit kann ich dir leider nicht weiterhelfen, bitte beachte das ich sehr streng finegetuned wurde.",
            "Hmm, da bin ich mir nicht sicher vielleicht kann dir unser Support via service@kernware.at weiterhelfen :)",
            "Da weiß ich leider auch nicht weiter, eventuell weiß Kurt dazu mehr."
        ]
        answer = random.choice(selection)
    else:
        # foward only kernware related questions to bot_model
        answer = bot_model.chat(query, chat_history)

    if DB_ENABLED:
        postgres.store_query(query, answer, token)
    return {"response": answer}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=10103)
