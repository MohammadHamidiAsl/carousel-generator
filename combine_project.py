#!/usr/bin/env python3
"""
combine_project.py  ── Collate a React / Next.js / Tailwind project
into one Markdown file for easy sharing or code-review.
"""

from __future__ import annotations
import argparse
import os
import pathlib

# ─── Configure what to skip and which extensions to include ──────────
SKIP_DIRS  = {".git", "node_modules", ".next", "dist", "build",
              ".turbo", ".idea", ".vscode", ".vercel"}
SKIP_FILES = {".DS_Store"}
EXT_TO_LANG = {
    ".js": "javascript", ".jsx": "jsx", ".ts": "typescript",
    ".tsx": "tsx", ".css": "css", ".scss": "scss",
    ".json": "json", ".html": "html",
    ".md": "markdown", ".yml": "yaml", ".yaml": "yaml",
    ".sh": "bash", ".env": "", ".txt": ""
}
# ─────────────────────────────────────────────────────────────────────

def iter_code_files(root: pathlib.Path):
    """
    Walk the directory top-down, prune SKIP_DIRS, and yield files
    whose suffix is in EXT_TO_LANG.
    """
    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        # prune unwanted subdirectories in-place
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for fname in filenames:
            if fname in SKIP_FILES:
                continue
            suffix = pathlib.Path(fname).suffix
            if suffix in EXT_TO_LANG:
                yield pathlib.Path(dirpath) / fname

def dump_to_markdown(root: pathlib.Path, output: pathlib.Path):
    with output.open("w", encoding="utf-8") as md:
        md.write(f"# Code dump of `{root.name}`\n\n")
        for file in sorted(iter_code_files(root)):
            rel = file.relative_to(root)
            lang = EXT_TO_LANG[file.suffix]
            md.write(f"### {rel}\n\n```{lang}\n")
            md.write(file.read_text(encoding="utf-8", errors="ignore"))
            md.write("\n```\n\n")
    print(f"✅  Wrote {output}")

def main():
    parser = argparse.ArgumentParser(
        description="Combine a React / Next.js / Tailwind project into one Markdown file."
    )
    parser.add_argument(
        "project_root",
        type=pathlib.Path,
        help="Path to the project directory"
    )
    parser.add_argument(
        "output",
        nargs="?",
        default="project_dump.md",
        type=pathlib.Path,
        help="Output Markdown file"
    )
    args = parser.parse_args()

    if not args.project_root.is_dir():
        parser.error("project_root must be an existing directory")

    dump_to_markdown(args.project_root.resolve(), args.output.resolve())

if __name__ == "__main__":
    main()
