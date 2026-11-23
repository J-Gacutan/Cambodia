#!/usr/bin/env python3
"""Fetch FES2022 ocean tide heights for L13 via pyTMD (AVISO FTP).

Prefer the disk-streaming FTP script for large transfers (pyTMD buffers each
~150 MB .xz in memory before writing):

  intermediate/screen-build/fetch_l13_fes2022_curl_ftp.sh

That stages extrapolated heights only (pyTMD model key FES2022_extrapolated).

This wrapper still calls pyTMD.datasets.fetch_aviso_fes (ocean + extrapolated).
Guide: https://pytmd.readthedocs.io/en/latest/getting_started/AVISO-Registration.html

Requires AVISO credentials (username is usually the registration email):
  export AVISO_USERNAME='you@example.com'
  export AVISO_PASSWORD='...'
or a ~/.netrc entry for machine ftp-access.aviso.altimetry.fr

Run with the pyTMD 3.12 venv:
  ~/.venvs/pytmd/bin/python intermediate/screen-build/fetch_l13_fes2022_pytmd.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # T3 deliverable folder
L13 = ROOT / "inputs" / "screen-layers" / "L13"
# pyTMD writes fes2022b/... under the directory argument
MODEL_DIR = L13 / "pytmd"


def main() -> int:
    user = os.environ.get("AVISO_USERNAME") or os.environ.get("AVISO_USER") or ""
    password = os.environ.get("AVISO_PASSWORD") or os.environ.get("AVISO_PASS") or ""
    netrc = Path.home() / ".netrc"

    if not user or not password:
        if netrc.exists():
            # let pyTMD / netrc resolve
            pass
        else:
            print(
                "Set AVISO_USERNAME and AVISO_PASSWORD, or create ~/.netrc for "
                "ftp-access.aviso.altimetry.fr\n"
                "Register / request FES heights: "
                "https://pytmd.readthedocs.io/en/latest/getting_started/AVISO-Registration.html",
                file=sys.stderr,
            )
            return 2

    L13.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # Import after env check so missing pyTMD is a clear error on the right Python
    from pyTMD.datasets.fetch_aviso_fes import fetch_aviso_fes

    print(f"Fetching FES2022 → {MODEL_DIR} (ocean + extrapolated; no currents)")
    fetch_aviso_fes(
        model="FES2022",
        directory=MODEL_DIR,
        user=user,
        password=password,
        load=False,
        currents=False,
        extrapolated=True,
        compressed=False,
    )

    prov = L13 / "PROVENANCE.txt"
    prov.write_text(
        "L13 — FES2022 tide heights (AVISO) via pyTMD\n"
        "Guide: https://pytmd.readthedocs.io/en/latest/getting_started/AVISO-Registration.html\n"
        "Fetcher: pyTMD.datasets.fetch_aviso_fes (model=FES2022, extrapolated=True, currents=False)\n"
        "FTP root: ftp-access.aviso.altimetry.fr /auxiliary/tide_model/fes2022b/\n"
        "Staged under: inputs/screen-layers/L13/pytmd/fes2022b/\n"
        "Licence: AVISO Licence Issue 20 — heights/loading all uses; currents not downloaded.\n"
        "Citation: CNES, 2024. FES2022 DOI 10.24400/527896/A01-2024.004\n"
        "Purpose: highest astronomical tide for Note 3b elevation check (ywdp.8.1.2).\n"
    )
    print("Wrote", prov)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
