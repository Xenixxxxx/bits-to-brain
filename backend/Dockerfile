FROM openjdk:17-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y wget ffmpeg python3 python3-pip && \
    pip3 install yt-dlp && \
    rm -rf /var/lib/apt/lists/*

COPY target/app.jar app.jar
COPY entrypoint.sh entrypoint.sh

RUN chmod +x entrypoint.sh

VOLUME ["/app/data"]

ENTRYPOINT ["./entrypoint.sh"]
