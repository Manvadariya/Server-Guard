FROM python:3.9-slim

WORKDIR /app

COPY . /app

RUN pip install fastapi uvicorn aiohttp python-socketio

CMD ["python", "main.py"]
