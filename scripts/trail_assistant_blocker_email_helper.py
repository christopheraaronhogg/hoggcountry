#!/usr/bin/env python3
"""Trail Assistant blocker escalation email helper.

Purpose:
- Enforce the ">24h + owner decision required" escalation rule.
- Generate a consistent Option A / Option B blocker email draft.
- Prevent accidental outbound email sends via an explicit auto-send guard.

Default behavior is draft-only.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

CT = ZoneInfo("America/Chicago")
SEND_CONFIRM_TOKEN = "SEND_BLOCKER_EMAIL"
DEFAULT_RECIPIENT = "christopheraaronhogg@gmail.com"


def parse_datetime(value: str) -> datetime:
    raw = value.strip()

    # Accept common zone shorthands in runlog-style timestamps.
    raw = raw.replace(" CST", "-06:00").replace(" CDT", "-05:00")

    # ISO-8601 first.
    try:
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=CT)
        return dt
    except ValueError:
        pass

    # Fallback patterns treated as America/Chicago local time.
    patterns = (
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %I:%M %p",
    )

    for pattern in patterns:
        try:
            return datetime.strptime(raw, pattern).replace(tzinfo=CT)
        except ValueError:
            continue

    raise ValueError(
        f"Could not parse datetime: '{value}'. Use ISO-8601 or 'YYYY-MM-DD HH:MM'."
    )


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:64] or "blocker"


def build_subject(task: str) -> str:
    return f"[Trail Assistant Blocker] {task}"


def build_body(
    *,
    task: str,
    blocked_since: datetime,
    blocked_hours: float,
    decision_needed: str,
    option_a: str,
    option_b: str,
    default_path: str,
    deadline: datetime,
    context_lines: list[str],
    now: datetime,
) -> str:
    blocked_since_label = blocked_since.astimezone(CT).strftime("%Y-%m-%d %H:%M %Z")
    deadline_label = deadline.astimezone(CT).strftime("%Y-%m-%d %H:%M %Z")
    now_label = now.astimezone(CT).strftime("%Y-%m-%d %H:%M %Z")

    lines = [
        "Hi Chris,",
        "",
        "Trail Assistant autonomy escalation triggered: blocker unresolved for >24h and owner decision required.",
        "",
        f"Task: {task}",
        f"Blocked since: {blocked_since_label} ({blocked_hours:.1f}h)",
        f"Decision needed: {decision_needed}",
        "",
        "Option A:",
        f"- {option_a}",
        "",
        "Option B:",
        f"- {option_b}",
        "",
        "Default path if no decision by deadline:",
        f"- {default_path}",
        f"- Deadline: {deadline_label}",
        "",
    ]

    if context_lines:
        lines.append("Context:")
        for line in context_lines:
            if line.strip():
                lines.append(f"- {line.strip()}")
        lines.append("")

    lines.extend(
        [
            "Safety posture preserved while blocked:",
            "- No command execution from untrusted inputs.",
            "- No external/public posting was performed.",
            "- Privacy-preserving defaults and moderation controls remain in place.",
            "",
            f"Generated at: {now_label}",
            "",
            "— Trail Assistant autonomous build loop",
        ]
    )

    return "\n".join(lines)


def build_default_output_path(repo_root: Path, now: datetime, task: str) -> Path:
    date_str = now.astimezone(CT).strftime("%Y-%m-%d")
    slug = slugify(task)
    return (
        repo_root
        / "docs"
        / "business"
        / "daily-updates"
        / "assets"
        / date_str
        / f"blocker-email-{slug}.txt"
    )


def run_send_command(command_template: str, *, to: str, subject: str, body: str) -> None:
    command = command_template.format(to=to, subject=subject)

    subprocess.run(
        command,
        input=body,
        text=True,
        shell=True,
        check=True,
    )



def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate Trail Assistant blocker escalation email drafts and optionally send "
            "them with an explicit safety guard."
        )
    )

    parser.add_argument("--task", required=True, help="Blocked task label (for subject/body)")
    parser.add_argument(
        "--blocked-since",
        required=True,
        help="When blocker began (ISO-8601 or 'YYYY-MM-DD HH:MM' in America/Chicago)",
    )
    parser.add_argument(
        "--decision-needed",
        required=True,
        help="Owner decision required to unblock work",
    )
    parser.add_argument("--option-a", required=True, help="Decision option A")
    parser.add_argument("--option-b", required=True, help="Decision option B")
    parser.add_argument(
        "--default-path",
        required=True,
        help="Default path to execute if no decision by deadline",
    )
    parser.add_argument(
        "--deadline",
        required=True,
        help="Decision deadline (ISO-8601 or 'YYYY-MM-DD HH:MM' in America/Chicago)",
    )

    parser.add_argument(
        "--context",
        action="append",
        default=[],
        help="Optional context line (repeatable)",
    )
    parser.add_argument(
        "--to",
        default=DEFAULT_RECIPIENT,
        help=f"Escalation recipient (default: {DEFAULT_RECIPIENT})",
    )
    parser.add_argument(
        "--threshold-hours",
        type=float,
        default=24,
        help="Escalation threshold in hours (default: 24)",
    )
    parser.add_argument(
        "--now",
        help="Override current time (ISO-8601) for testing",
    )
    parser.add_argument(
        "--output",
        help="Output draft path (default: docs/business/daily-updates/assets/<date>/blocker-email-<task>.txt)",
    )

    # Optional send path with explicit guard.
    parser.add_argument(
        "--auto-send",
        action="store_true",
        help="Attempt to send using --send-command (guarded; off by default)",
    )
    parser.add_argument(
        "--send-command",
        help=(
            "Shell command template used only with --auto-send. "
            "Supports {to} and {subject}; body is piped via STDIN."
        ),
    )
    parser.add_argument(
        "--confirm-send",
        help=f"Required with --auto-send. Must exactly equal: {SEND_CONFIRM_TOKEN}",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]

    try:
        blocked_since = parse_datetime(args.blocked_since)
        deadline = parse_datetime(args.deadline)
        now = parse_datetime(args.now) if args.now else datetime.now(CT)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    blocked_hours = (now - blocked_since).total_seconds() / 3600
    if blocked_hours < 0:
        print("ERROR: --blocked-since cannot be in the future.", file=sys.stderr)
        return 2

    if deadline < now:
        print("ERROR: --deadline must be at/after current time.", file=sys.stderr)
        return 2

    should_escalate = blocked_hours >= args.threshold_hours

    if not should_escalate:
        print(
            "NO_ESCALATION: blocker age "
            f"{blocked_hours:.1f}h is below threshold {args.threshold_hours:.1f}h."
        )
        return 0

    subject = build_subject(args.task)
    body = build_body(
        task=args.task,
        blocked_since=blocked_since,
        blocked_hours=blocked_hours,
        decision_needed=args.decision_needed,
        option_a=args.option_a,
        option_b=args.option_b,
        default_path=args.default_path,
        deadline=deadline,
        context_lines=args.context,
        now=now,
    )

    output_path = Path(args.output) if args.output else build_default_output_path(repo_root, now, args.task)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    draft_text = f"To: {args.to}\nSubject: {subject}\n\n{body}\n"
    output_path.write_text(draft_text, encoding="utf-8")

    print(f"DRAFT_READY: {output_path}")
    print(f"RECIPIENT: {args.to}")
    print(f"SUBJECT: {subject}")

    if args.auto_send:
        if args.confirm_send != SEND_CONFIRM_TOKEN:
            print(
                "SEND_BLOCKED: missing/invalid --confirm-send token. "
                f"Expected exact token: {SEND_CONFIRM_TOKEN}",
                file=sys.stderr,
            )
            return 3

        if not args.send_command:
            print(
                "SEND_BLOCKED: --send-command is required when using --auto-send.",
                file=sys.stderr,
            )
            return 3

        try:
            run_send_command(args.send_command, to=args.to, subject=subject, body=body)
        except subprocess.CalledProcessError as exc:
            print(f"SEND_FAILED: command exited with code {exc.returncode}", file=sys.stderr)
            return exc.returncode or 1

        print("SENT: blocker escalation email command completed.")
    else:
        print("SEND_SKIPPED: draft-only mode (default).")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
