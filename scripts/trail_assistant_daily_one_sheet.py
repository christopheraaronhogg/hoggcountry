#!/usr/bin/env python3
"""
Generate a daily one-sheet HTML progress report for Trail Assistant.

Outputs:
- docs/business/daily-updates/YYYY-MM-DD.html
- docs/business/daily-updates/latest.html

The report pulls from:
- docs/business/trail-assistant-runlog.md
- docs/business/trail-assistant-backlog.md
- local git commit history
- screenshot assets in docs/business/daily-updates/assets/YYYY-MM-DD/
"""

from __future__ import annotations

import argparse
import html
import re
import shutil
import subprocess
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable
from zoneinfo import ZoneInfo

CT = ZoneInfo("America/Chicago")


@dataclass
class BacklogSection:
    name: str
    done: int = 0
    total: int = 0


@dataclass
class RunlogEntry:
    timestamp: str
    task: str = ""
    changes: list[str] = field(default_factory=list)
    validation: list[str] = field(default_factory=list)
    next_step: str = ""
    blocker: str = ""


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def parse_backlog(backlog_text: str) -> tuple[list[BacklogSection], str, int, int]:
    sections: list[BacklogSection] = []
    current: BacklogSection | None = None
    active_task = ""
    done_total = 0
    count_total = 0

    for raw in backlog_text.splitlines():
        line = raw.rstrip()

        m_sec = re.match(r"^##\s+(.+)$", line)
        if m_sec:
            current = BacklogSection(name=m_sec.group(1).strip())
            sections.append(current)
            continue

        m_active = re.match(r"^-\s+Active:\s+(.+)$", line)
        if m_active:
            active_task = m_active.group(1).strip()
            continue

        m_chk = re.match(r"^-\s+\[( |x)\]\s+", line)
        if m_chk:
            checked = m_chk.group(1) == "x"
            done_total += 1 if checked else 0
            count_total += 1
            if current:
                current.done += 1 if checked else 0
                current.total += 1

    return sections, active_task, done_total, count_total


def extract_day_block(runlog_text: str, day: str) -> list[str]:
    lines = runlog_text.splitlines()
    target = f"## {day}"
    start = None

    for i, line in enumerate(lines):
        if line.strip() == target:
            start = i + 1
            break

    if start is None:
        return []

    end = len(lines)
    for i in range(start, len(lines)):
        if lines[i].startswith("## "):
            end = i
            break

    return lines[start:end]


def parse_runlog_entries(runlog_text: str, day: str) -> tuple[list[str], list[RunlogEntry], list[tuple[int, int]]]:
    lines = runlog_text.splitlines()
    day_lines = extract_day_block(runlog_text, day)

    general: list[str] = []
    entries: list[RunlogEntry] = []
    tests: list[tuple[int, int]] = []

    # Prefer high-level bullets from the explicit day block if present.
    for raw in day_lines:
        line = raw.rstrip()
        if line.startswith("- ") and not line.startswith("- **"):
            general.append(line[2:].strip())

    current: RunlogEntry | None = None
    section = ""

    ts_pattern = re.compile(rf"^-\s+\*\*({re.escape(day)}[^*]+)\*\*\s*$")
    field_pattern = re.compile(r"^\s{2}-\s+\*\*(Task worked|What changed|Validation|Next step|Blocker status):\*\*\s*(.*)$")

    for raw in lines:
        line = raw.rstrip()

        ts_match = ts_pattern.match(line)
        if ts_match:
            if current:
                entries.append(current)
            current = RunlogEntry(timestamp=ts_match.group(1).strip())
            section = ""
            continue

        if current is None:
            continue

        # Stop current entry when a different dated entry begins.
        if re.match(r"^-\s+\*\*\d{4}-\d{2}-\d{2}[^*]+\*\*\s*$", line):
            entries.append(current)
            current = None
            section = ""
            continue

        field_match = field_pattern.match(line)
        if field_match:
            section = field_match.group(1)
            value = field_match.group(2).strip()
            if section == "Task worked":
                current.task = value
            elif section == "Next step":
                current.next_step = value
            elif section == "Blocker status":
                current.blocker = value
            elif section == "What changed" and value:
                current.changes.append(value)
            elif section == "Validation" and value:
                current.validation.append(value)
            continue

        if line.startswith("    - "):
            value = line[6:].strip()
            if section == "What changed":
                current.changes.append(value)
            elif section == "Validation":
                current.validation.append(value)
                mt = re.search(r"(\d+)\s+tests?,\s*(\d+)\s+assertions", value)
                if mt:
                    tests.append((int(mt.group(1)), int(mt.group(2))))
            continue

        if line.startswith("  - "):
            value = line[4:].strip()
            if section == "What changed":
                current.changes.append(value)
            elif section == "Validation":
                current.validation.append(value)
                mt = re.search(r"(\d+)\s+tests?,\s*(\d+)\s+assertions", value)
                if mt:
                    tests.append((int(mt.group(1)), int(mt.group(2))))

    if current:
        entries.append(current)

    # Also scan full runlog for this day's explicit test counts.
    day_chunks = [line for line in lines if day in line]
    joined = "\n".join(day_chunks)
    for mt in re.finditer(r"(\d+)\s+tests?,\s*(\d+)\s+assertions", joined):
        pair = (int(mt.group(1)), int(mt.group(2)))
        if pair not in tests:
            tests.append(pair)

    return general, entries, tests


def git_commits_for_day(repo_root: Path, day: str) -> list[tuple[str, str, str]]:
    start = f"{day} 00:00:00"
    end_dt = datetime.fromisoformat(day) + timedelta(days=1)
    end = end_dt.strftime("%Y-%m-%d 00:00:00")

    cmd = [
        "git",
        "-C",
        str(repo_root),
        "log",
        "--since",
        start,
        "--until",
        end,
        "--date=short",
        "--pretty=format:%h|%ad|%s",
        "--max-count",
        "20",
    ]

    try:
        out = subprocess.check_output(cmd, text=True)
    except Exception:
        return []

    rows: list[tuple[str, str, str]] = []
    for line in out.splitlines():
        parts = line.split("|", 2)
        if len(parts) == 3:
            rows.append((parts[0], parts[1], parts[2]))
    return rows


def list_screenshots(asset_dir: Path) -> list[Path]:
    if not asset_dir.exists():
        return []
    exts = {".png", ".jpg", ".jpeg", ".webp"}
    shots = [p for p in asset_dir.iterdir() if p.is_file() and p.suffix.lower() in exts]
    return sorted(shots)


def pct(done: int, total: int) -> str:
    return "0%" if total <= 0 else f"{round((done / total) * 100)}%"


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def li_list(items: Iterable[str], empty_msg: str) -> str:
    items = [x for x in items if x]
    if not items:
        return f"<li class='muted'>{esc(empty_msg)}</li>"
    return "\n".join(f"<li>{esc(item)}</li>" for item in items)


def build_html(
    day: str,
    sections: list[BacklogSection],
    active_task: str,
    done_total: int,
    count_total: int,
    general: list[str],
    entries: list[RunlogEntry],
    tests: list[tuple[int, int]],
    commits: list[tuple[str, str, str]],
    screenshots: list[Path],
    output_path: Path,
) -> str:
    day_dt = datetime.fromisoformat(day)
    day_label = day_dt.strftime("%A, %B %d, %Y")

    latest_test = tests[-1] if tests else None
    test_card = f"{latest_test[0]} tests / {latest_test[1]} assertions" if latest_test else "No test run captured"

    section_cards = "\n".join(
        f"""
        <article class="mini-card">
          <h4>{esc(sec.name)}</h4>
          <p><strong>{sec.done}/{sec.total}</strong> complete · {pct(sec.done, sec.total)}</p>
        </article>
        """
        for sec in sections
        if sec.total > 0
    )

    if not section_cards:
        section_cards = "<article class='mini-card'><h4>Backlog</h4><p>No section metrics found.</p></article>"

    runlog_blocks = []
    for e in entries:
        runlog_blocks.append(
            f"""
            <section class="entry">
              <div class="entry-head">
                <span class="stamp">{esc(e.timestamp)}</span>
                <h3>{esc(e.task or 'Execution block')}</h3>
              </div>
              <div class="entry-grid">
                <div>
                  <h4>What shipped</h4>
                  <ul>{li_list(e.changes, 'No detail lines recorded.')}</ul>
                </div>
                <div>
                  <h4>Validation</h4>
                  <ul>{li_list(e.validation, 'No validation notes recorded.')}</ul>
                </div>
              </div>
              <p><strong>Next step:</strong> {esc(e.next_step or 'Not set')}</p>
              <p><strong>Blocker status:</strong> {esc(e.blocker or 'Not listed')}</p>
            </section>
            """
        )
    runlog_html = "\n".join(runlog_blocks) if runlog_blocks else "<p class='muted'>No timestamped runlog entries for this date yet.</p>"

    commit_rows = "\n".join(
        f"<li><code>{esc(sha)}</code> — {esc(subject)} <span class='muted'>({esc(date)})</span></li>"
        for sha, date, subject in commits
    ) or "<li class='muted'>No commits found for this date.</li>"

    shot_cards = []
    rel_asset_base = Path("assets") / day
    for shot in screenshots:
        rel = rel_asset_base / shot.name
        caption = shot.stem.replace("-", " ")
        shot_cards.append(
            f"""
            <figure class="shot">
              <img src="{esc(str(rel))}" alt="{esc(caption)}" loading="lazy" />
              <figcaption>{esc(caption)}</figcaption>
            </figure>
            """
        )

    if not shot_cards:
        shot_cards.append(
            """
            <figure class="shot empty">
              <div class="empty-box">No screenshots captured yet for this date.</div>
              <figcaption>Add PNG/JPG files to <code>docs/business/daily-updates/assets/DATE/</code>.</figcaption>
            </figure>
            """
        )

    html_text = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Trail Assistant Daily One-Sheet — {esc(day)}</title>
  <style>
    :root {{
      --bg:#0f172a;
      --panel:#111827;
      --panel-2:#0b1220;
      --line:#334155;
      --text:#e5e7eb;
      --muted:#94a3b8;
      --accent:#22d3ee;
      --ok:#10b981;
      --warn:#f59e0b;
    }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:radial-gradient(circle at 15% 0%,#1e293b 0%,var(--bg) 48%); color:var(--text); }}
    .wrap {{ max-width:1200px; margin:0 auto; padding:28px 20px 80px; }}
    .hero {{ background:linear-gradient(180deg,var(--panel-2),var(--panel)); border:1px solid var(--line); border-radius:18px; padding:20px; }}
    .kicker {{ display:inline-block; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); border:1px solid rgba(34,211,238,.45); border-radius:999px; padding:4px 10px; }}
    h1 {{ margin:10px 0 4px; font-size:clamp(1.4rem,3vw,2.1rem); }}
    p {{ margin:0; line-height:1.5; }}
    .meta {{ color:var(--muted); margin-top:8px; }}
    .grid {{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:14px; }}
    .card {{ border:1px solid var(--line); border-radius:14px; background:rgba(15,23,42,.6); padding:14px; }}
    .card h3 {{ margin:0 0 4px; font-size:.82rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }}
    .card p {{ font-size:1.1rem; font-weight:700; }}
    .section {{ margin-top:16px; border:1px solid var(--line); border-radius:16px; background:var(--panel); padding:18px; }}
    .section h2 {{ margin:0 0 12px; font-size:1.15rem; }}
    .mini-grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; }}
    .mini-card {{ border:1px solid var(--line); border-radius:12px; padding:10px; background:rgba(15,23,42,.45); }}
    .mini-card h4 {{ margin:0 0 6px; font-size:.88rem; color:var(--muted); }}
    .mini-card p {{ margin:0; }}
    .muted {{ color:var(--muted); }}
    ul {{ margin:0; padding-left:18px; line-height:1.55; }}
    .entry {{ border:1px solid var(--line); border-radius:12px; padding:12px; margin-top:10px; background:rgba(15,23,42,.35); }}
    .entry-head {{ display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:8px; }}
    .entry-head h3 {{ margin:0; font-size:1rem; }}
    .stamp {{ font-size:.78rem; color:var(--accent); border:1px solid rgba(34,211,238,.45); border-radius:999px; padding:3px 8px; }}
    .entry-grid {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:8px; }}
    .entry-grid h4 {{ margin:0 0 6px; font-size:.86rem; color:var(--muted); }}
    .shots {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:12px; }}
    .shot {{ margin:0; border:1px solid var(--line); border-radius:12px; overflow:hidden; background:rgba(15,23,42,.35); }}
    .shot img {{ width:100%; height:240px; object-fit:cover; display:block; background:#020617; }}
    .shot figcaption {{ padding:8px 10px; font-size:.84rem; color:var(--muted); }}
    .empty-box {{ height:240px; display:flex; align-items:center; justify-content:center; color:var(--muted); padding:12px; text-align:center; }}
    code {{ font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:.88em; }}
    @media (max-width:960px) {{
      .grid {{ grid-template-columns:1fr 1fr; }}
      .entry-grid {{ grid-template-columns:1fr; }}
    }}
    @media (max-width:620px) {{
      .grid {{ grid-template-columns:1fr; }}
    }}
  </style>
</head>
<body>
  <main class="wrap">
    <header class="hero">
      <span class="kicker">Trail Assistant Daily One-Sheet</span>
      <h1>{esc(day_label)}</h1>
      <p class="meta">Single-page progress brief for HoggCountry Trail Assistant development.</p>

      <div class="grid">
        <article class="card"><h3>Backlog Completion</h3><p>{done_total}/{count_total} ({pct(done_total, count_total)})</p></article>
        <article class="card"><h3>Today's Commits</h3><p>{len(commits)}</p></article>
        <article class="card"><h3>Latest Validation</h3><p>{esc(test_card)}</p></article>
        <article class="card"><h3>Active Focus</h3><p>{esc(active_task or 'Not set')}</p></article>
      </div>
    </header>

    <section class="section">
      <h2>Backlog Snapshot</h2>
      <div class="mini-grid">{section_cards}</div>
    </section>

    <section class="section">
      <h2>High-Level Summary</h2>
      <ul>{li_list(general, 'No top-level summary bullets found for this date.')}</ul>
    </section>

    <section class="section">
      <h2>Execution Log (What shipped + evidence)</h2>
      {runlog_html}
    </section>

    <section class="section">
      <h2>Commit Evidence</h2>
      <ul>{commit_rows}</ul>
    </section>

    <section class="section">
      <h2>Screenshots</h2>
      <div class="shots">
        {''.join(shot_cards)}
      </div>
    </section>

    <section class="section">
      <h2>Report Metadata</h2>
      <p class="muted">Generated: {esc(datetime.now(CT).strftime('%Y-%m-%d %H:%M:%S %Z'))}</p>
      <p class="muted">Source files: <code>docs/business/trail-assistant-runlog.md</code> + <code>docs/business/trail-assistant-backlog.md</code></p>
      <p class="muted">Output path: <code>{esc(str(output_path.relative_to(output_path.parents[3])))}</code></p>
    </section>
  </main>
</body>
</html>
"""

    return html_text


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Trail Assistant daily one-sheet HTML report")
    parser.add_argument("--date", help="Date in YYYY-MM-DD (default: today in America/Chicago)")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    docs_dir = repo_root / "docs" / "business"
    runlog_path = docs_dir / "trail-assistant-runlog.md"
    backlog_path = docs_dir / "trail-assistant-backlog.md"

    report_date = args.date or datetime.now(CT).strftime("%Y-%m-%d")

    output_dir = docs_dir / "daily-updates"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{report_date}.html"
    latest_path = output_dir / "latest.html"

    asset_dir = output_dir / "assets" / report_date

    backlog_text = read_text(backlog_path)
    runlog_text = read_text(runlog_path)

    sections, active_task, done_total, count_total = parse_backlog(backlog_text)
    general, entries, tests = parse_runlog_entries(runlog_text, report_date)
    commits = git_commits_for_day(repo_root, report_date)
    screenshots = list_screenshots(asset_dir)

    html_text = build_html(
        day=report_date,
        sections=sections,
        active_task=active_task,
        done_total=done_total,
        count_total=count_total,
        general=general,
        entries=entries,
        tests=tests,
        commits=commits,
        screenshots=screenshots,
        output_path=output_path,
    )

    output_path.write_text(html_text, encoding="utf-8")
    shutil.copyfile(output_path, latest_path)

    print(f"Generated: {output_path}")
    print(f"Updated latest: {latest_path}")


if __name__ == "__main__":
    main()
