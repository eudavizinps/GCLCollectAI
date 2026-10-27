FROM python:3.13-slim
WORKDIR /code
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/app backend/app
COPY scripts scripts
ENV PYTHONUNBUFFERED=1
CMD ["python", "scripts/docker_entrypoint.py"]
