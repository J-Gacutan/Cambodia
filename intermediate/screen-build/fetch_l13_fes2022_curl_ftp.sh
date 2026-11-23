#!/usr/bin/env bash
# Stream FES2022 extrapolated ocean-tide heights from AVISO FTP to disk.
# Prefer this over pyTMD's BytesIO path (buffers each ~150 MB .xz before writing).
# Credentials: AVISO_USERNAME / AVISO_PASSWORD (password never written to the repo).
# Layout matches pyTMD model FES2022_extrapolated under L13/pytmd/.
#
# Each file is retried until local size matches remote SIZE (FTP idle drops are common).
# Run under caffeinate when unattended: caffeinate -i bash this_script.sh
set -uo pipefail

: "${AVISO_USERNAME:?set AVISO_USERNAME}"
: "${AVISO_PASSWORD:?set AVISO_PASSWORD}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$ROOT/inputs/screen-layers/L13/pytmd/fes2022b/ocean_tide_extrapolated"
HOST="ftp-access.aviso.altimetry.fr"
REMOTE="/auxiliary/tide_model/fes2022b/ocean_tide_extrapolated"
PARALLEL="${PARALLEL:-1}"

mkdir -p "$DEST"
cd "$DEST"

FILES=(
  2n2_fes2022.nc.xz eps2_fes2022.nc.xz j1_fes2022.nc.xz k1_fes2022.nc.xz
  k2_fes2022.nc.xz l2_fes2022.nc.xz lambda2_fes2022.nc.xz m2_fes2022.nc.xz
  m3_fes2022.nc.xz m4_fes2022.nc.xz m6_fes2022.nc.xz m8_fes2022.nc.xz
  mf_fes2022.nc.xz mks2_fes2022.nc.xz mm_fes2022.nc.xz mn4_fes2022.nc.xz
  ms4_fes2022.nc.xz msf_fes2022.nc.xz msqm_fes2022.nc.xz mtm_fes2022.nc.xz
  mu2_fes2022.nc.xz n2_fes2022.nc.xz n4_fes2022.nc.xz nu2_fes2022.nc.xz
  o1_fes2022.nc.xz p1_fes2022.nc.xz q1_fes2022.nc.xz r2_fes2022.nc.xz
  s1_fes2022.nc.xz s2_fes2022.nc.xz s4_fes2022.nc.xz sa_fes2022.nc.xz
  ssa_fes2022.nc.xz t2_fes2022.nc.xz mask_fes2022B.nc.xz
)

remote_size() {
  local f="$1"
  curl -sS --ftp-pasv --list-only -u "${AVISO_USERNAME}:${AVISO_PASSWORD}" \
    "ftp://${HOST}${REMOTE}/" 2>/dev/null | awk -v f="$f" '$NF==f {print $5; exit}'
  # fallback SIZE via curl -I style not available; use python ftplib
}

remote_size_py() {
  local f="$1"
  AVISO_FILE="$f" ~/.venvs/pytmd/bin/python - <<'PY'
import os
from ftplib import FTP
ftp = FTP("ftp-access.aviso.altimetry.fr", timeout=60)
ftp.login(user=os.environ["AVISO_USERNAME"], passwd=os.environ["AVISO_PASSWORD"])
ftp.cwd("/auxiliary/tide_model/fes2022b/ocean_tide_extrapolated")
ftp.voidcmd("TYPE I")
print(ftp.size(os.environ["AVISO_FILE"]))
ftp.quit()
PY
}

fetch_one() {
  local f="$1"
  local nc="${f%.xz}"
  if [[ -f "$nc" ]]; then
    echo "$(date -u +%H:%M:%S) skip $nc"
    return 0
  fi

  local want
  want="$(remote_size_py "$f" 2>/dev/null || echo 0)"
  if [[ -z "$want" || "$want" == "0" || "$want" == "None" ]]; then
    echo "$(date -u +%H:%M:%S) WARN no remote size for $f; downloading without size check"
    want=0
  else
    echo "$(date -u +%H:%M:%S) GET $f (remote ${want} bytes)"
  fi

  local attempt=0
  while true; do
    attempt=$((attempt + 1))
    local have=0
    [[ -f "${f}.partial" ]] && have=$(stat -f%z "${f}.partial" 2>/dev/null || echo 0)
    if (( want > 0 && have >= want )); then
      break
    fi
    echo "$(date -u +%H:%M:%S) attempt $attempt $f have=${have}"
    curl -sS --ftp-pasv --retry 3 --retry-delay 10 --retry-all-errors \
      -C - -u "${AVISO_USERNAME}:${AVISO_PASSWORD}" \
      "ftp://${HOST}${REMOTE}/${f}" -o "${f}.partial" \
      --connect-timeout 60 --max-time 0 \
      --keepalive-time 30 || true
    sleep 2
    have=$(stat -f%z "${f}.partial" 2>/dev/null || echo 0)
    if (( want > 0 && have >= want )); then
      break
    fi
    if (( attempt >= 80 )); then
      echo "$(date -u +%H:%M:%S) FAIL $f after $attempt attempts (have=${have} want=${want})"
      return 1
    fi
    sleep 15
  done

  mv -f "${f}.partial" "$f"
  if ! xz -dkf "$f"; then
    echo "$(date -u +%H:%M:%S) FAIL decompress $f"
    return 1
  fi
  rm -f "$f"
  echo "$(date -u +%H:%M:%S) OK $nc ($(ls -lh "$nc" | awk '{print $5}'))"
}

fail=0
i=0
n=${#FILES[@]}
while (( i < n )); do
  batch=0
  while (( batch < PARALLEL && i < n )); do
    fetch_one "${FILES[$i]}" &
    i=$((i + 1))
    batch=$((batch + 1))
  done
  wait || fail=1
done

cat > "$ROOT/inputs/screen-layers/L13/PROVENANCE.txt" <<EOF
L13 — FES2022 extrapolated tide heights (AVISO)
Fetcher: intermediate/screen-build/fetch_l13_fes2022_curl_ftp.sh
  (disk-streaming FTP with resume loop; extrapolated heights only — no currents)
pyTMD model key: FES2022_extrapolated
Staged: inputs/screen-layers/L13/pytmd/fes2022b/ocean_tide_extrapolated/*.nc
FTP: ftp-access.aviso.altimetry.fr${REMOTE}/
Licence: AVISO Licence Issue 20 — heights/loading all uses; currents not downloaded
Citation: CNES, 2024. FES2022 DOI 10.24400/527896/A01-2024.004
Purpose: highest astronomical tide for Note 3b elevation check (ywdp.8.1.2)
EOF

nc_count=$(ls -1 "$DEST"/*.nc 2>/dev/null | wc -l | tr -d ' ')
echo "Done. nc_count=${nc_count} fail=${fail}"
exit "$fail"
