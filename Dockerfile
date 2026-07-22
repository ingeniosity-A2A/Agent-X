FROM python:3.12-slim
WORKDIR /app
COPY src/ src/
COPY requirements.txt .
RUN mkdir -p data/corpus cache
ENV PORT=10000
EXPOSE 10000
CMD ["python3", "-m", "src.api_server"]
