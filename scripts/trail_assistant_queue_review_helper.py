#!/usr/bin/env python3
"""Trail Assistant daily/weekly queue review automation helper.

Purpose:
- Keep queue review cadence consistent (daily + weekly snapshots).
- Detect stale open tasks to prevent silent backlog aging.
- Surface owner-decision blocker signals for escalation handling.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

CT = ZoneInfo("America/Chicago")
DEFAULT_BACKLOG = Path("docs/business/trail-assistant-backlog.md")
DEFAULT_RUNLOG = Path("docs/business/trail-assistant-runlog.md")
DEFAULT_RECIPIENT = "christopheraaronhogg@gmail.com"


@dataclass
class TaskItem:
    task_id: str
    title: str
    done: bool


@dataclass
class RunlogEntry:
    timestamp: datetime
    task: str = ""
    blocker_status: str = ""


def parse_local_datetime(value: str) -> datetime:
    raw = value.strip()

    # Allow runlog range/label forms like:
    # - "2026-03-02 18:35 CST → 2026-03-03 00:55 CST"
    # - "2026-03-04 18:15 CST — Evening brief sweep"
    if "→" in raw:
        raw = raw.split("→", 1)[0].strip()
    if "—" in raw:
        raw = raw.split("—", 1)[0].strip()

    raw = raw.replace(" CST", "-06:00").replace(" CDT", "-05:00")

    try:
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=CT)
        return dt.astimezone(CT)
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
        f"Could not parse datetime: '{value}'. Use ISO-8601 or 'YYYY-MM-DD HH:MM'."
    )


def parse_review_date(value: str | None) -> date:
    if not value:
        return datetime.now(CT).date()

    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError("--date must be YYYY-MM-DD") from exc


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def parse_this_week_tasks(backlog_text: str) -> list[TaskItem]:
    lines = backlog_text.splitlines()

    start = None
    end = len(lines)

    for i, line in enumerate(lines):
        if line.startswith("## This Week"):
            start = i + 1
            break

    if start is None:
        return []

    for j in range(start, len(lines)):
        if lines[j].startswith("## "):
            end = j
            break

    tasks: list[TaskItem] = []
    pattern = re.compile(
        r"^-\s+\[( |x)\]\s+\*\*(?P<task_id>[A-Z]\d+\.\d+)\*\*\s+(?P<title>.+)$"
    )

    for raw in lines[start:end]:
        line = raw.strip()
        match = pattern.match(line)
        if not match:
            continue

        tasks.append(
            TaskItem(
                task_id=match.group("task_id"),
                title=match.group("title").strip(),
                done=match.group(1) == "x",
            )
        )

    return tasks


def parse_active_task(backlog_text: str) -> str:
    match = re.search(r"^-\s+Active:\s+(.+)$", backlog_text, flags=re.MULTILINE)
    return match.group(1).strip() if match else ""


def parse_runlog_entries(runlog_text: str) -> list[RunlogEntry]:
    entries: list[RunlogEntry] = []
    current: RunlogEntry | None = None

    ts_pattern = re.compile(r"^-\s+\*\*(\d{4}-\d{2}-\d{2} [^*]+)\*\*\s*$")
    task_pattern = re.compile(r"^\s{2}-\s+\*\*Task worked:\*\*\s*(.*)$")
    blocker_pattern = re.compile(r"^\s{2}-\s+\*\*Blocker status:\*\*\s*(.*)$")

    for raw in runlog_text.splitlines():
        line = raw.rstrip()

        ts_match = ts_pattern.match(line)
        if ts_match:
            if current:
                entries.append(current)

            stamp = parse_local_datetime(ts_match.group(1))
            current = RunlogEntry(timestamp=stamp)
            continue

        if current is None:
            continue

        task_match = task_pattern.match(line)
        if task_match:
            current.task = task_match.group(1).strip()
            continue

        blocker_match = blocker_pattern.match(line)
        if blocker_match:
            current.blocker_status = blocker_match.group(1).strip()
            continue

    if current:
        entries.append(current)

    return entries


def task_ids_in_text(value: str) -> set[str]:
    return set(re.findall(r"\b[A-Z]\d+\.\d+\b", value or ""))


def make_output_path(repo_root: Path, review_day: date) -> Path:
    return (
        repo_root
        / "docs"
        / "business"
        / "daily-updates"
        / "assets"
        / review_day.isoformat()
        / "queue-review.md"
    )


def yes_no(value: bool) -> str:
    return "yes" if value else "no"


def display_path(path: Path, repo_root: Path) -> str:
    try:
        return str(path.relative_to(repo_root))
    except ValueError:
        return str(path)


def format_date(value: datetime | None) -> str:
    if value is None:
        return "never"
    return value.astimezone(CT).strftime("%Y-%m-%d %H:%M %Z")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate a Trail Assistant queue review markdown report with daily/weekly "
            "status, stale-task scan, and blocker-escalation signal summary."
        )
    )

    parser.add_argument("--date", help="Review date (YYYY-MM-DD). Default: today in America/Chicago.")
    parser.add_argument(
        "--backlog",
        default=str(DEFAULT_BACKLOG),
        help=f"Backlog path (default: {DEFAULT_BACKLOG}).",
    )
    parser.add_argument(
        "--runlog",
        default=str(DEFAULT_RUNLOG),
        help=f"Runlog path (default: {DEFAULT_RUNLOG}).",
    )
    parser.add_argument(
        "--stale-days",
        type=int,
        default=2,
        help="Mark open tasks stale when untouched for this many days (default: 2).",
    )
    parser.add_argument(
        "--escalation-recipient",
        default=DEFAULT_RECIPIENT,
        help=f"Escalation recipient hint when >24h owner-decision blocker is detected (default: {DEFAULT_RECIPIENT}).",
    )
    parser.add_argument(
        "--output",
        help="Output markdown path (default: docs/business/daily-updates/assets/<date>/queue-review.md).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print report only; do not write to disk.",
    )
    parser.add_argument(
        "--print-report",
        action="store_true",
        help="Print report body to stdout after write.",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]

    try:
        review_day = parse_review_date(args.date)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    if args.stale_days < 0:
        print("ERROR: --stale-days cannot be negative.", file=sys.stderr)
        return 2

    backlog_path = Path(args.backlog)
    if not backlog_path.is_absolute():
        backlog_path = repo_root / backlog_path

    runlog_path = Path(args.runlog)
    if not runlog_path.is_absolute():
        runlog_path = repo_root / runlog_path

    backlog_text = read_text(backlog_path)
    runlog_text = read_text(runlog_path)

    if not backlog_text:
        print(f"ERROR: Backlog file not found or empty: {backlog_path}", file=sys.stderr)
        return 2

    if not runlog_text:
        print(f"ERROR: Runlog file not found or empty: {runlog_path}", file=sys.stderr)
        return 2

    tasks = parse_this_week_tasks(backlog_text)
    active_task = parse_active_task(backlog_text)
    entries = parse_runlog_entries(runlog_text)

    week_start = review_day - timedelta(days=review_day.weekday())
    week_end = week_start + timedelta(days=6)

    daily_entries = [entry for entry in entries if entry.timestamp.date() == review_day]
    weekly_entries = [
        entry
        for entry in entries
        if week_start <= entry.timestamp.date() <= week_end
    ]

    task_last_touched: dict[str, datetime] = {}
    blocker_mentions: dict[str, datetime] = {}
    owner_blocker_over_24 = False

    for entry in entries:
        for task_id in task_ids_in_text(entry.task):
            previous = task_last_touched.get(task_id)
            if previous is None or entry.timestamp > previous:
                task_last_touched[task_id] = entry.timestamp

        blocker_text = (entry.blocker_status or "").strip()
        if blocker_text:
            for task_id in task_ids_in_text(blocker_text):
                previous = blocker_mentions.get(task_id)
                if previous is None or entry.timestamp > previous:
                    blocker_mentions[task_id] = entry.timestamp

            blocker_lower = blocker_text.lower()
            if (
                "owner" in blocker_lower
                and "decision" in blocker_lower
                and (
                    ">24h" in blocker_lower
                    or "over 24h" in blocker_lower
                    or "older than 24h" in blocker_lower
                    or "unresolved >24h" in blocker_lower
                )
            ):
                owner_blocker_over_24 = True

    done_tasks = [task for task in tasks if task.done]
    open_tasks = [task for task in tasks if not task.done]
    blocked_task_ids = {task_id for task_id in blocker_mentions.keys() if any(task.task_id == task_id for task in open_tasks)}

    stale_task_ids: set[str] = set()
    review_dt = datetime.combine(review_day, datetime.min.time(), tzinfo=CT)

    for task in open_tasks:
        touched = task_last_touched.get(task.task_id)
        if touched is None:
            stale_task_ids.add(task.task_id)
            continue

        age_days = (review_dt - touched.astimezone(CT)).total_seconds() / 86400
        if age_days >= args.stale_days:
            stale_task_ids.add(task.task_id)

    highest_unblocked = None
    for task in open_tasks:
        if task.task_id in blocked_task_ids:
            continue
        if "blocked" in task.title.lower():
            continue
        highest_unblocked = task
        break

    generated_at = datetime.now(CT)
    output_path = Path(args.output) if args.output else make_output_path(repo_root, review_day)

    if not output_path.is_absolute():
        output_path = repo_root / output_path

    lines: list[str] = []
    lines.append(f"# Trail Assistant Queue Review — {review_day.isoformat()}")
    lines.append("")
    lines.append(f"Generated: {generated_at.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    lines.append(f"Backlog source: `{display_path(backlog_path, repo_root)}`")
    lines.append(f"Runlog source: `{display_path(runlog_path, repo_root)}`")
    lines.append("")

    lines.append(f"## Daily snapshot ({review_day.isoformat()})")
    lines.append(f"- Active task: {active_task or 'not set'}")
    lines.append(f"- This-week checklist: {len(done_tasks)} done / {len(open_tasks)} open")
    lines.append(f"- Runlog entries today: {len(daily_entries)}")
    if highest_unblocked:
        lines.append(
            f"- Highest-impact unblocked next task: {highest_unblocked.task_id} — {highest_unblocked.title}"
        )
    else:
        lines.append("- Highest-impact unblocked next task: none detected")

    if blocked_task_ids:
        blocked_list = ", ".join(sorted(blocked_task_ids))
        lines.append(f"- Blocked open tasks referenced in runlog blocker status: {blocked_list}")
    else:
        lines.append("- Blocked open tasks referenced in runlog blocker status: none")

    lines.append("")
    lines.append(f"## Weekly snapshot ({week_start.isoformat()} → {week_end.isoformat()})")
    lines.append(f"- Runlog entries this week: {len(weekly_entries)}")
    lines.append("")
    lines.append("| Task | Status | Last touched | Queue signal |")
    lines.append("|---|---|---|---|")

    for task in tasks:
        last_touched = task_last_touched.get(task.task_id)
        status = "done" if task.done else "open"

        if task.done:
            signal = "complete"
        elif task.task_id in blocked_task_ids:
            signal = "blocked"
        elif task.task_id in stale_task_ids:
            signal = f"stale>{args.stale_days}d"
        else:
            signal = "ready"

        lines.append(
            f"| {task.task_id} — {task.title} | {status} | {format_date(last_touched)} | {signal} |"
        )

    lines.append("")
    lines.append("## Escalation check")
    lines.append(f"- Owner-decision blocker over 24h detected: {yes_no(owner_blocker_over_24)}")

    if owner_blocker_over_24:
        lines.append(
            "- External blocker escalation should go to: "
            f"`{args.escalation_recipient}` (send via approved outbound path)."
        )
    else:
        lines.append("- Blocker escalation email is not currently required by the >24h rule.")

    lines.append("")
    lines.append("## Automation command")
    lines.append(
        "- `npm run trail-assistant:queue-review -- --date "
        f"{review_day.isoformat()} --print-report`"
    )

    report_text = "\n".join(lines).rstrip() + "\n"

    if args.dry_run:
        print("DRY_RUN: report not written.")
    else:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(report_text, encoding="utf-8")
        print(f"REPORT_READY: {output_path}")

    print(f"REVIEW_DATE: {review_day.isoformat()}")
    print(f"WEEK_WINDOW: {week_start.isoformat()}..{week_end.isoformat()}")
    print(f"OPEN_TASKS: {len(open_tasks)}")
    print(f"DONE_TASKS: {len(done_tasks)}")
    print(f"OWNER_BLOCKER_OVER_24H: {yes_no(owner_blocker_over_24)}")

    if args.dry_run or args.print_report:
        print("---REPORT---")
        print(report_text, end="")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
