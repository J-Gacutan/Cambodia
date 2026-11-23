#!/usr/bin/env bash
# Fetch Goldberg mangrove loss-driver GeoTIFFs for Cambodia (L4 / ORNL DAAC 1768).
# Requires Earthdata login in ~/.netrc:
#   machine urs.earthdata.nasa.gov
#   login <earthdata_username>
#   password <earthdata_password>
# URS OAuth needs a cookie jar and --location-trusted (plain curl -n loops on 282-byte redirects).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/inputs/screen-layers/L4"
mkdir -p "$OUT"
COOKIE="${URS_COOKIES:-$HOME/.urs_cookies}"
: > "$COOKIE"
chmod 600 "$COOKIE"
BASE="https://data.ornldaac.earthdata.nasa.gov/protected/cms/CMS_Global_Mangrove_Loss/data"
for f in loss_driver_class_KHM.tif land_cover_change_class_KHM.tif loss_epoch_KHM.tif; do
  echo "GET $f"
  curl -n --location-trusted -c "$COOKIE" -b "$COOKIE" -fL --retry 3 -o "$OUT/$f" "$BASE/$f"
  curl -fsSL -o "$OUT/$f.sha256" \
    "https://data.ornldaac.earthdata.nasa.gov/public/cms/CMS_Global_Mangrove_Loss/data/$f.sha256" || true
  if [[ -f "$OUT/$f.sha256" ]]; then
    exp=$(tr -d ' \n\r' <"$OUT/$f.sha256")
    act=$(shasum -a 256 "$OUT/$f" | awk '{print $1}')
    echo "sha256 expect=$exp actual=$act"
    [[ "$exp" == "$act" ]] || { echo "checksum mismatch $f"; exit 1; }
  fi
  ls -lh "$OUT/$f"
done
echo "L4 KHM granules staged in $OUT"
