#!/usr/bin/env python3
"""
compile_d11_cambodia_letter_docx.py — Build the Cambodia MoE roadmap letter DOCX on CI's template.

Reuses the markdown walk of D6's compile_d6_speaker_request_docx.py, which in turn uses
the Template class of compile_d6_concept_note_docx.py (CI's own paragraphs and table
deep-copied as prototypes), so the letter matches the KKP and DENR speaker request.

Usage:
    python3 compile_d11_cambodia_letter_docx.py [source.md] [output.docx] [--template path]

Defaults: source is ci-letter-moe-cambodia-blue-carbon-roadmap.md beside this script;
output goes to ../outputs/ with the same stem; the template is CI's draft in D6's inputs/.
"""

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
D6_INTERMEDIATE = HERE.parents[1] / "D6 - Pre-COP31 Negotiator Webinar" / "intermediate"
sys.path.insert(0, str(D6_INTERMEDIATE))
from compile_d6_speaker_request_docx import DEFAULT_TEMPLATE, convert  # noqa: E402

DEFAULT_SRC = HERE / "ci-letter-moe-cambodia-blue-carbon-roadmap.md"


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    template = DEFAULT_TEMPLATE
    if "--template" in argv:
        template = Path(argv[argv.index("--template") + 1])
        args = [a for a in args if a != str(template)]
    src = Path(args[0]) if args else DEFAULT_SRC
    out = Path(args[1]) if len(args) > 1 else HERE.parent / "outputs" / (src.stem + ".docx")
    out.parent.mkdir(parents=True, exist_ok=True)
    convert(src, out, template)


if __name__ == "__main__":
    main(sys.argv)
