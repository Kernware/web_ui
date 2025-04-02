from pathlib import Path
from typing import Callable, Optional
from unsloth import FastLanguageModel

from custom_logger.logger import create_logger
from webbot_datasets.model_prompts import filter_prompt, bot_prompt

def _create_query_function(model, tokenizer, prompt) -> Callable[[str, str], str]:
    def query_function(query: str, history: str) -> str:
        input_tokens = tokenizer(
            [prompt.format(query=query, history=history)],
            add_special_tokens = False,
            return_tensors = "pt"
        ).to("cuda")

        gen_ids = model.generate(
            **input_tokens,
            max_new_tokens = 64,
            use_cache=True,
            temperature = 0.5,
            min_p = 0.1
        )

        output = tokenizer.decode(
            gen_ids[:, input_tokens['input_ids'].shape[1]:][0],
            skip_prompt = True,
            skip_special_tokens = True
        )
        return output.strip()

    return query_function


class BotModel():

    def __init__(self, model, tokenizer, query_func, logger):
        self.model = model
        self.tokenizer = tokenizer
        self.query_func = query_func
        self.logger = logger

    @classmethod
    def initialize(cls, model_path: Path) -> Optional['BotModel']:
        logger = create_logger("BotModel", "BM")

        if not model_path.exists():
            logger.error("BotModelpath does not exist!")
            return None

        try:
            bot_model, bot_tokenizer = FastLanguageModel.from_pretrained(
                model_name=model_path.as_posix(),
                max_seq_length = 1024,
                load_in_4bit = True,
            )
            FastLanguageModel.for_inference(bot_model)
        except Exception as e:
            logger.error(f"Failed to initialize bot model: {e}")
            logger.debug("Full exception traceback:", exc_info=True)
            return None

        try:
            query_func = _create_query_function(bot_model, bot_tokenizer, bot_prompt)
        except Exception as e:
            logger.error(f"Failed to create query_function: {e}")
            logger.debug("Full exception traceback:", exc_info=True)
            return None

        return cls(
            model=bot_model,
            tokenizer=bot_tokenizer,
            query_func=query_func,
            logger=logger
        )

    def chat(self, query: str, history: list) -> str:
        try:
            str_history = ""
            for question, answer in history:
                str_history += f"Frage:{question}\nAntwort:{answer}\n"

            if str_history:
                str_history = (
                    "Bisheriger Chatverlauf:\n"
                    "```\n"
                    f"{str_history.strip()}\n"
                    "```\n"
                )

            return self.query_func(query, str_history)
        except Exception as e:
            self.logger.error(f"Bot Model answer creation Failed: {e}")
            self.logger.debug("Full exception traceback:", exc_info=True)
            return "NOOP"


class FilterModel():

    def __init__(self, model, tokenizer, query_func, logger):
        self.model = model
        self.tokenizer = tokenizer
        self.query_func = query_func
        self.logger = logger

    @classmethod
    def initialize(cls, model_path: Path) -> Optional['FilterModel']:
        logger = create_logger("FilterModel", "FM")

        if not model_path.exists():
            logger.error("FilterModelpath does not exist!")
            return None

        try:
            filter_model, filter_tokenizer = FastLanguageModel.from_pretrained(
                model_name=model_path.as_posix(),
                max_seq_length = 1024,
                load_in_4bit = True,
            )
            FastLanguageModel.for_inference(filter_model)
        except Exception as e:
            logger.error(f"Failed to initialize filter model: {e}")
            logger.debug("Full exception traceback:", exc_info=True)
            return None

        try:
            query_func = _create_query_function(filter_model, filter_tokenizer, filter_prompt)
        except Exception as e:
            logger.error(f"Failed to create query_function: {e}")
            logger.debug("Full exception traceback:", exc_info=True)
            return None

        return cls(
            model=filter_model,
            tokenizer=filter_tokenizer,
            query_func=query_func,
            logger=logger
        )

    def chat(self, query: str, history: list) -> str:
        try:
            answer = self.query_func(query, "\n".join(h[0] for h in history))
            if answer not in ["ja", "nein"]:
                return "nein"
            return answer
        except Exception as e:
            self.logger.error(f"Filter Model answer creation Failed: {e}")
            self.logger.debug("Full exception traceback:", exc_info=True)
            return "nein"
