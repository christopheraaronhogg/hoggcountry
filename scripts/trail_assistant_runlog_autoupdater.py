#!/usr/bin/env python3
"""Trail Assistant runlog autopdater helper.

Purpose:
- Append timestamped, structured runlog entries in a consistent format.
- Auto-create daily date sections when missing.
- Reduce manual markdown editing drift in daily execution loops.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

CT = ZoneInfo("America/Chicago")
DEFAULT_RUNLOG = Path("docs/business/trail-assistant-runlog.md")


def parse_timestamp(value: str | None) -> datetime:
    if not value:
        return datetime.now(CT)

    raw = value.strip()
    raw = raw.replace(" CST", "-06:00").replace(" CDT", "-05:00")

    # ISO-8601 first.
    try:
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=CT)
        return dt
    except ValueError:
        pass

    for pattern in (
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %I:%M %p",
    ):
        try:
            return datetime.strptime(raw, pattern).replace(tzinfo=CT)
        except ValueError:
            continue

    raise ValueError(
        f"Could not parse timestamp: '{value}'. Use ISO-8601 or 'YYYY-MM-DD HH:MM'."
    )


def normalize_list(values: list[str]) -> list[str]:
    return [value.strip() for value in values if value and value.strip()]


def locate_day_block(lines: list[str], day: str) -> tuple[int, int] | None:
    target = f"## {day}"

    for i, line in enumerate(lines):
        if line.strip() != target:
            continue

        end = len(lines)
        for j in range(i + 1, len(lines)):
            if lines[j].startswith("## "):
                end = j
                break

        return i, end

    return None


def build_entry_lines(
    *,
    timestamp: datetime,
    task: str,
    changes: list[str],
    validations: list[str],
    safety_impact: str | None,
    next_step: str,
    blocker_status: str,
) -> list[str]:
    stamp = timestamp.astimezone(CT).strftime("%Y-%m-%d %H:%M %Z")

    lines = [
        f"- **{stamp}**",
        f"  - **Task worked:** {task}",
        "  - **What changed:**",
    ]

    lines.extend(f"    - {change}" for change in changes)

    if validations:
        lines.append("  - **Validation:**")
        lines.extend(f"    - {validation}" for validation in validations)

    if safety_impact:
        lines.append(f"  - **Safety impact:** {safety_impact}")

    lines.append(f"  - **Next step:** {next_step}")
    lines.append(f"  - **Blocker status:** {blocker_status}")

    return lines


def insert_entry(runlog_text: str, day: str, entry_lines: list[str]) -> str:
    lines = runlog_text.splitlines()

    block = locate_day_block(lines, day)

    if block is None:
        if lines and lines[-1].strip() != "":
            lines.append("")
        lines.append(f"## {day}")
        lines.append("")
        lines.extend(entry_lines)
        lines.append("")
        return "\n".join(lines) + "\n"

    _, end = block
    new_lines = lines[:end]

    if new_lines and new_lines[-1].strip() != "":
        new_lines.append("")

    new_lines.extend(entry_lines)
    new_lines.append("")
    new_lines.extend(lines[end:])

    return "\n".join(new_lines) + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Append a structured entry to docs/business/trail-assistant-runlog.md "
            "with consistent timestamp/date-section formatting."
        )
    )

    parser.add_argument("--task", required=True, help="Task label for '**Task worked:**'.")
    parser.add_argument(
        "--change",
        action="append",
        default=[],
        help="What changed bullet (repeatable; at least one required).",
    )
    parser.add_argument(
        "--validation",
        action="append",
        default=[],
        help="Validation bullet (repeatable).",
    )
    parser.add_argument(
        "--next-step",
        required=True,
        help="Next-step line for '**Next step:**'.",
    )
    parser.add_argument(
        "--blocker-status",
        required=True,
        help="Blocker status line for '**Blocker status:**'.",
    )
    parser.add_argument(
        "--safety-impact",
        help="Optional safety impact summary line.",
    )
    parser.add_argument(
        "--timestamp",
        help="Optional override timestamp (ISO-8601 or 'YYYY-MM-DD HH:MM', America/Chicago).",
    )
    parser.add_argument(
        "--runlog",
        default=str(DEFAULT_RUNLOG),
        help=f"Runlog path (default: {DEFAULT_RUNLOG}).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the generated entry without writing to disk.",
    )
    parser.add_argument(
        "--print-entry",
        action="store_true",
        help="Print appended entry after write.",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]

    try:
        timestamp = parse_timestamp(args.timestamp)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    task = args.task.strip()
    next_step = args.next_step.strip()
    blocker_status = args.blocker_status.strip()
    safety_impact = args.safety_impact.strip() if args.safety_impact else None
    changes = normalize_list(args.change)
    validations = normalize_list(args.validation)

    if not task:
        print("ERROR: --task cannot be empty.", file=sys.stderr)
        return 2

    if not changes:
        print("ERROR: at least one --change entry is required.", file=sys.stderr)
        return 2

    if not next_step:
        print("ERROR: --next-step cannot be empty.", file=sys.stderr)
        return 2

    if not blocker_status:
        print("ERROR: --blocker-status cannot be empty.", file=sys.stderr)
        return 2

    runlog_path = Path(args.runlog)
    if not runlog_path.is_absolute():
        runlog_path = repo_root / runlog_path

    if runlog_path.exists():
        runlog_text = runlog_path.read_text(encoding="utf-8")
    else:
        runlog_text = "# Trail Assistant Runlog\n"

    day = timestamp.astimezone(CT).strftime("%Y-%m-%d")
    entry_lines = build_entry_lines(
        timestamp=timestamp,
        task=task,
        changes=changes,
        validations=validations,
        safety_impact=safety_impact,
        next_step=next_step,
        blocker_status=blocker_status,
    )

    updated_text = insert_entry(runlog_text, day, entry_lines)

    if args.dry_run:
        print("DRY_RUN: no file changes written.")
    else:
        runlog_path.parent.mkdir(parents=True, exist_ok=True)
        runlog_path.write_text(updated_text, encoding="utf-8")
        print(f"ENTRY_APPENDED: {runlog_path}")

    print(f"ENTRY_DATE_SECTION: {day}")
    print(f"ENTRY_TIMESTAMP: {timestamp.astimezone(CT).strftime('%Y-%m-%d %H:%M %Z')}")

    if args.dry_run or args.print_entry:
        print("---ENTRY---")
        print("\n".join(entry_lines))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
