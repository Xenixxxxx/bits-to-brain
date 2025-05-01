FROM openjdk:17-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        wget \
        ffmpeg \
        ca-certificates && \
    ln -sf /usr/bin/python3 /usr/local/bin/python3 && \
    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Copy app.jar
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# Copy entrypoint
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

VOLUME ["/app/data"]

ENTRYPOINT ["java", "-jar", "app.jar"]
