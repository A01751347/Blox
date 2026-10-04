FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium ffmpeg xvfb pulseaudio pulseaudio-utils x11-utils curl ca-certificates \
      fonts-noto fonts-noto-color-emoji libgl1-mesa-dri mesa-vulkan-drivers \
      libva2 libva-drm2 vainfo \
    && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --shell /bin/bash streamer
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
USER streamer
WORKDIR /home/streamer
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
