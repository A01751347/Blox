#!/usr/bin/env bash
set -uo pipefail

STAGE_URL="${STAGE_URL:-http://bloxdance:3000/}"
FPS="${FPS:-60}"
VIDEO_BITRATE="${VIDEO_BITRATE:-6000k}"
ENCODER="${ENCODER:-libx264}"
WIDTH=1080
HEIGHT=1920
RESTART_DELAY="${RESTART_DELAY:-5}"
export DISPLAY=:99

if [ -z "${RTMP_URL:-}" ]; then
  echo "RTMP_URL no está definido: el streamer grabará a /tmp/dry-run.flv para pruebas"
  OUTPUT="/tmp/dry-run.flv"
else
  OUTPUT="${RTMP_URL}"
fi

pids=()

cleanup() {
  for pid in "${pids[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  pids=()
}
trap 'cleanup; exit 0' TERM INT

encoder_args() {
  case "$ENCODER" in
    h264_nvenc)
      echo "-c:v h264_nvenc -preset p4 -tune ll -rc cbr -b:v ${VIDEO_BITRATE} -maxrate ${VIDEO_BITRATE} -bufsize 12M -g $((FPS * 2)) -pix_fmt yuv420p" ;;
    h264_vaapi)
      echo "-vaapi_device /dev/dri/renderD128 -vf format=nv12,hwupload -c:v h264_vaapi -b:v ${VIDEO_BITRATE} -maxrate ${VIDEO_BITRATE} -g $((FPS * 2))" ;;
    *)
      echo "-c:v libx264 -preset veryfast -tune zerolatency -b:v ${VIDEO_BITRATE} -maxrate ${VIDEO_BITRATE} -bufsize 12M -g $((FPS * 2)) -pix_fmt yuv420p" ;;
  esac
}

wait_for_stage() {
  until curl -fsS "${STAGE_URL%/}/api/health" >/dev/null 2>&1; do
    echo "esperando al stage en ${STAGE_URL} ..."
    sleep 3
  done
}

start_display_and_audio() {
  Xvfb "$DISPLAY" -screen 0 "${WIDTH}x${HEIGHT}x24" -nolisten tcp &
  pids+=($!)
  pulseaudio --start --exit-idle-time=-1 --disallow-exit
  pactl load-module module-null-sink sink_name=stage sink_properties=device.description=stage >/dev/null
  pactl set-default-sink stage
  until xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; do sleep 0.3; done
}

start_browser() {
  chromium --no-sandbox --kiosk --user-data-dir=/tmp/chromium-profile \
    --window-size="${WIDTH},${HEIGHT}" --window-position=0,0 \
    --autoplay-policy=no-user-gesture-required --ignore-gpu-blocklist \
    --enable-gpu-rasterization --use-gl=angle --use-angle=gl-egl \
    --disable-infobars --disable-session-crashed-bubble --noerrdialogs \
    --disable-background-timer-throttling --disable-renderer-backgrounding \
    "${STAGE_URL}" &
  pids+=($!)
}

start_ffmpeg() {
  # shellcheck disable=SC2046
  ffmpeg -hide_banner -loglevel warning \
    -f x11grab -draw_mouse 0 -framerate "$FPS" -video_size "${WIDTH}x${HEIGHT}" -i "${DISPLAY}.0" \
    -f pulse -i stage.monitor \
    $(encoder_args) \
    -c:a aac -b:a 160k -ar 44100 -ac 2 \
    -f flv "$OUTPUT" &
  pids+=($!)
}

while true; do
  wait_for_stage
  start_display_and_audio
  start_browser
  sleep 8
  start_ffmpeg
  wait -n "${pids[@]}"
  echo "un proceso terminó; reiniciando el pipeline en ${RESTART_DELAY}s"
  cleanup
  pulseaudio --kill 2>/dev/null || true
  sleep "$RESTART_DELAY"
done
