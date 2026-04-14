import asyncio
import os

from mangum import Mangum

from app.main import app

api_base_path = os.getenv("API_BASE_PATH") or "/"
_adapter = Mangum(app, lifespan="off", api_gateway_base_path=api_base_path)


def handler(event, context):
	try:
		asyncio.get_event_loop()
	except RuntimeError:
		asyncio.set_event_loop(asyncio.new_event_loop())
	return _adapter(event, context)
