#!/usr/bin/env python3
"""Build the canonical knee-aware northern AT mountain guide PDF."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Spacer,
    Table,
    TableStyle,
)

import build_northern_mountains_pdf_base as base


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "apps/openclaw-web/src/lib/data/northern-mountains-guide-b.json"
OUTPUT_PATH = ROOT / "output/pdf/hogg-country-at-mountains-mile-1850-to-katahdin.pdf"
PUBLIC_PATH = ROOT / "apps/openclaw-web/static/guides/hogg-country-at-mountains-mile-1850-to-katahdin.pdf"
LEGACY_OUTPUT_PATH = ROOT / "output/pdf/hogg-country-at-mountains-mile-1850-to-katahdin-version-b.pdf"
LEGACY_PUBLIC_PATH = ROOT / "apps/openclaw-web/static/guides/hogg-country-at-mountains-mile-1850-to-katahdin-version-b.pdf"

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN_X = 0.48 * inch
MARGIN_TOP = 0.66 * inch
MARGIN_BOTTOM = 0.5 * inch
CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN_X)

PINE = HexColor("#28483A")
INK = HexColor("#17251F")
UP = HexColor("#356F52")
DOWN = HexColor("#A94D2D")
DOWN_DARK = HexColor("#7C351F")
CREAM = HexColor("#F2ECDE")
PAPER = HexColor("#FFFDF7")
MUTED = HexColor("#626A65")
LINE = HexColor("#D5CBB8")
WHITE = colors.white


STYLE = {
    "cover_flag": ParagraphStyle(
        "b_cover_flag",
        parent=base.STYLE["cover_kicker"],
        fontName=base.BODY_BOLD_FONT,
        fontSize=8,
        leading=10,
        textColor=HexColor("#F3B08B"),
        spaceAfter=0,
    ),
    "cover_title": ParagraphStyle(
        "b_cover_title",
        parent=base.STYLE["cover_title"],
        fontName=base.DISPLAY_FONT,
        fontSize=47,
        leading=41,
        textColor=WHITE,
        alignment=TA_LEFT,
    ),
    "cover_lede": ParagraphStyle(
        "b_cover_lede",
        parent=base.STYLE["cover_lede"],
        fontSize=10.2,
        leading=14.5,
    ),
    "section_kicker": ParagraphStyle(
        "b_section_kicker",
        parent=base.STYLE["section_kicker"],
        textColor=DOWN,
    ),
    "section_title": ParagraphStyle(
        "b_section_title",
        parent=base.STYLE["section_title"],
        textColor=INK,
    ),
    "section_meta": ParagraphStyle(
        "b_section_meta",
        parent=base.STYLE["section_meta"],
    ),
    "mountain_name": ParagraphStyle(
        "b_mountain_name",
        parent=base.STYLE["mountain_name"],
        fontSize=14.2,
        leading=15,
        textColor=INK,
    ),
    "mountain_meta": ParagraphStyle(
        "b_mountain_meta",
        parent=base.STYLE["mountain_meta"],
        fontSize=6.2,
        leading=7.5,
    ),
    "metric_label": ParagraphStyle(
        "b_metric_label",
        parent=base.STYLE["metric_label"],
        fontSize=5.1,
        leading=6,
    ),
    "metric_value": ParagraphStyle(
        "b_metric_value",
        parent=base.STYLE["metric_value"],
        fontSize=9.6,
        leading=10,
        textColor=INK,
    ),
    "metric_note": ParagraphStyle(
        "b_metric_note",
        parent=base.STYLE["metric_note"],
        fontSize=5.2,
        leading=6.2,
    ),
    "panel_label": ParagraphStyle(
        "b_panel_label",
        parent=base.STYLE["metric_label"],
        fontName=base.BODY_BOLD_FONT,
        fontSize=5.8,
        leading=7,
        textColor=WHITE,
    ),
    "panel_score": ParagraphStyle(
        "b_panel_score",
        parent=base.STYLE["metric_value"],
        fontName=base.DISPLAY_FONT,
        fontSize=14,
        leading=14,
        textColor=WHITE,
        alignment=TA_RIGHT,
    ),
    "overall_label": ParagraphStyle(
        "b_overall_label",
        parent=base.STYLE["difficulty_label"],
        fontSize=5.1,
        leading=6,
    ),
    "overall_value": ParagraphStyle(
        "b_overall_value",
        parent=base.STYLE["difficulty_value"],
        fontSize=16,
        leading=16,
    ),
    "read": ParagraphStyle(
        "b_read",
        parent=base.STYLE["expectation"],
        fontSize=6.2,
        leading=8.2,
        textColor=HexColor("#5A5148"),
    ),
    "body": ParagraphStyle(
        "b_body",
        parent=base.STYLE["body"],
    ),
    "body_bold": ParagraphStyle(
        "b_body_bold",
        parent=base.STYLE["body_bold"],
    ),
    "small": ParagraphStyle(
        "b_small",
        parent=base.STYLE["small"],
    ),
    "center_small": ParagraphStyle(
        "b_center_small",
        parent=base.STYLE["small"],
        alignment=TA_CENTER,
    ),
    "cover_metric_label": ParagraphStyle(
        "b_cover_metric_label",
        parent=base.STYLE["metric_label"],
        fontSize=5.7,
        leading=6.8,
        textColor=HexColor("#D5DFD8"),
    ),
    "cover_stat": ParagraphStyle(
        "b_cover_stat",
        parent=base.STYLE["metric_value"],
        fontSize=17,
        leading=18,
        textColor=WHITE,
    ),
}


def paragraph(text: Any, style: ParagraphStyle):
    return base.paragraph(text, style)


def fmt(value: float, digits: int = 0) -> str:
    return base.fmt(value, digits)


def panel_metric(label: str, value: str, note: str = "") -> Table:
    rows = [
        [paragraph(label.upper(), STYLE["metric_label"])],
        [paragraph(value, STYLE["metric_value"])],
    ]
    if note:
        rows.append([paragraph(note, STYLE["metric_note"])])
    table = Table(rows)
    table.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return table


def downhill_read(mountain: dict[str, Any]) -> str:
    if mountain.get("terminusDescentNote"):
        return mountain["terminusDescentNote"]
    if float(mountain["descentDistanceMiles"]) <= 0:
        return "No meaningful low point before the next listed summit; treat this as a ridge connection."
    if mountain["descentRockinessScore"] >= 7.5:
        footing = "Very rocky footing makes braking and step placement a first-order concern."
    elif mountain["descentRockinessScore"] >= 6:
        footing = "Rocky footing adds braking and careful step placement."
    else:
        footing = "Footing is the smaller part of this descent screen."
    return (
        f"{mountain['declineLabel']}; about {fmt(mountain['averageLossFtPerMile'])} ft of loss per mile. "
        f"{footing}"
    )


def cover_profile(data: dict[str, Any]) -> Table:
    block_width = CONTENT_WIDTH - 28
    inner_width = block_width - 24
    drawing = base.elevation_drawing(data["summary"]["profile"], inner_width, 120, base.ORANGE)
    labels = Table([[
        paragraph(f"MILE {fmt(data['guideStartMile'])}", STYLE["cover_metric_label"]),
        paragraph(
            f"KATAHDIN {fmt(data['terminusMile'], 1)}",
            ParagraphStyle(
                "b_cover_profile_right",
                parent=STYLE["cover_metric_label"],
                alignment=TA_RIGHT,
            ),
        ),
    ]], colWidths=[inner_width / 2] * 2)
    labels.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    block = Table([[drawing], [labels]], colWidths=[block_width])
    block.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#263A2D")),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#5D6F60")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 9),
    ]))
    return block


def overview_table(data: dict[str, Any]) -> Table:
    summary = data["summary"]
    cells = [
        ("TRAIL AHEAD", f"{fmt(summary['distanceMiles'], 1)} mi"),
        ("NAMED MOUNTAINS", fmt(summary["mountainCount"])),
        ("TOTAL CLIMBING", f"{fmt(summary['gainFt'] / 1000, 1)}k ft"),
        ("TOTAL DESCENT", f"{fmt(summary['lossFt'] / 1000, 1)}k ft"),
    ]
    row = []
    for label, value in cells:
        row.append(Table([
            [paragraph(label, STYLE["cover_metric_label"])],
            [paragraph(value, STYLE["cover_stat"])],
        ]))
    table = Table([row], colWidths=[CONTENT_WIDTH / 4] * 4)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PINE),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#5D6F60")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, HexColor("#5D6F60")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return table


def side_panel(mountain: dict[str, Any], direction: str) -> Table:
    is_down = direction == "down"
    color = DOWN if is_down else UP
    score = mountain["kneeLoadScore"] if is_down else mountain["upDifficultyScore"]
    label = mountain["kneeLoadLabel"] if is_down else mountain["upDifficultyLabel"]

    header = Table([[
        paragraph(
            f"{'DOWN' if is_down else 'UP'} | "
            f"{mountain['descentType'] if is_down else mountain['approachType']}<br/>"
            f"{label.upper()}",
            STYLE["panel_label"],
        ),
        paragraph(fmt(score, 1), STYLE["panel_score"]),
    ]], colWidths=[CONTENT_WIDTH * 0.32, CONTENT_WIDTH * 0.12])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    if is_down:
        cells = [
            panel_metric("Distance", f"{fmt(mountain['descentDistanceMiles'], 1)} mi", f"to mi {fmt(mountain['descentEndMile'], 1)}"),
            panel_metric("Loss", f"-{fmt(mountain['descentLossFt'])} ft", f"{fmt(mountain['averageLossFtPerMile'])} ft/mi"),
            panel_metric("Steepest", f"{fmt(mountain['maxDescentGradePercent'], 1)}%", mountain["declineLabel"]),
            panel_metric("Rocks", f"{fmt(mountain['descentRockinessScore'], 1)}/10", mountain["descentRockinessLabel"]),
        ]
        points = mountain["descentProfile"]
        profile_left = f"SUMMIT {fmt(mountain['summitMile'], 1)}"
        profile_right = f"LOW {fmt(mountain['descentEndMile'], 1)}"
    else:
        cells = [
            panel_metric("Distance", f"{fmt(mountain['climbDistanceMiles'], 1)} mi", f"from mi {fmt(mountain['climbStartMile'], 1)}"),
            panel_metric("Gain", f"+{fmt(mountain['climbGainFt'])} ft", f"{fmt(mountain['averageGainFtPerMile'])} ft/mi"),
            panel_metric("Steepest", f"{fmt(mountain['maxGradePercent'], 1)}%", mountain["inclineLabel"]),
            panel_metric("Rocks", f"{fmt(mountain['rockinessScore'], 1)}/10", mountain["rockinessLabel"]),
        ]
        points = mountain["profile"]
        profile_left = f"MI {fmt(mountain['climbStartMile'], 1)}"
        profile_right = f"SUMMIT {fmt(mountain['summitMile'], 1)}"

    metrics = Table([cells], colWidths=[CONTENT_WIDTH * 0.11] * 4)
    metrics.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    if len(points) >= 2:
        drawing = base.elevation_drawing(points, CONTENT_WIDTH * 0.40, 27, color)
        labels = Table([[
            paragraph(profile_left, STYLE["metric_note"]),
            paragraph(profile_right, ParagraphStyle(
                f"b_profile_right_{direction}",
                parent=STYLE["metric_note"],
                alignment=TA_RIGHT,
            )),
        ]], colWidths=[CONTENT_WIDTH * 0.20] * 2)
        profile = Table([[drawing], [labels]], colWidths=[CONTENT_WIDTH * 0.42])
    else:
        profile = Table([[
            paragraph("NO POST-SUMMIT SEGMENT SCORED", STYLE["center_small"])
        ]], colWidths=[CONTENT_WIDTH * 0.42], rowHeights=[35])
    profile.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))

    panel = Table([[header], [metrics], [profile]], colWidths=[CONTENT_WIDTH * 0.44])
    panel.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return panel


def mountain_card(mountain: dict[str, Any]) -> KeepTogether:
    overall = float(mountain["terrainDemandScore"])
    score_color = base.difficulty_color(overall)
    title_meta = f"{mountain['trailRelation']} | {fmt(mountain['milesToKatahdin'], 1)} mi to Katahdin"
    if mountain.get("summitElevationFt") is not None:
        title_meta = f"~{fmt(mountain['summitElevationFt'])} ft | {title_meta}"

    title = Table([[
        Table([
            [paragraph("NOBO", STYLE["metric_label"])],
            [paragraph(
                fmt(mountain["summitMile"], 1),
                ParagraphStyle(
                    f"b_mile_{mountain['id']}",
                    parent=STYLE["metric_value"],
                    fontSize=14,
                    leading=14,
                    textColor=DOWN_DARK,
                ),
            )],
        ], colWidths=[44]),
        Table([
            [paragraph(mountain["name"], STYLE["mountain_name"])],
            [paragraph(title_meta, STYLE["mountain_meta"])],
        ]),
        Table([
            [paragraph("OVERALL", STYLE["overall_label"])],
            [paragraph(fmt(overall, 1), STYLE["overall_value"])],
            [paragraph(mountain["terrainDemandLabel"].upper(), STYLE["overall_label"])],
        ], colWidths=[55]),
    ]], colWidths=[48, CONTENT_WIDTH - 48 - 55 - 24, 55])
    title.setStyle(TableStyle([
        ("BACKGROUND", (2, 0), (2, 0), score_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (2, 0), (2, 0), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    panels = Table(
        [[side_panel(mountain, "up"), side_panel(mountain, "down")]],
        colWidths=[CONTENT_WIDTH * 0.44] * 2,
    )
    panels.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (1, 0), (1, 0), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    detail = Table([[
        paragraph(f"<b>DOWNHILL READ:</b> {downhill_read(mountain)}", STYLE["read"])
    ]], colWidths=[CONTENT_WIDTH - 24])
    detail.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F0E4D8")),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    card = Table([[title], [panels], [detail]], colWidths=[CONTENT_WIDTH])
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
        ("BOX", (0, 0), (-1, -1), 0.55, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 0),
        ("TOPPADDING", (0, 2), (-1, 2), 5),
        ("BOTTOMPADDING", (0, 2), (-1, 2), 7),
    ]))
    return KeepTogether([card, Spacer(1, 7)])


def region_header(region: dict[str, Any]) -> KeepTogether:
    heading = Table([[
        Table([
            [paragraph(
                f"{region['state'].upper()} | MILE {fmt(region['startMile'], 1)}-{fmt(region['endMile'], 1)}",
                STYLE["section_kicker"],
            )],
            [paragraph(region["name"], STYLE["section_title"])],
        ]),
        paragraph(
            f"{region['mountainCount']} UP / DOWN READS",
            STYLE["section_meta"],
        ),
    ]], colWidths=[CONTENT_WIDTH * 0.70, CONTENT_WIDTH * 0.30])
    heading.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LINEBELOW", (0, 0), (-1, -1), 2.2, PINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return KeepTogether([heading, Spacer(1, 9)])


def draw_page(canvas: Any, document: BaseDocTemplate) -> None:
    canvas.saveState()
    canvas.setFillColor(PINE)
    canvas.rect(0, PAGE_HEIGHT - 21, PAGE_WIDTH, 21, fill=1, stroke=0)
    canvas.setFont(base.BODY_BOLD_FONT, 6.5)
    canvas.setFillColor(WHITE)
    canvas.drawString(MARGIN_X, PAGE_HEIGHT - 14, "MOUNTAINS AHEAD | CLIMB + DESCENT")
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 14, "UP + DOWN | KNEE-AWARE")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_X, 27, PAGE_WIDTH - MARGIN_X, 27)
    canvas.setFont(base.BODY_BOLD_FONT, 6.2)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 15, "HOGG COUNTRY | TERRAIN PLANNING AID | NOT MEDICAL GUIDANCE")
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, 15, f"PAGE {document.page}")
    canvas.restoreState()


def cover_story(data: dict[str, Any]) -> list[Any]:
    story: list[Any] = []
    background = base.CoverBackground(260)
    title_content = Table([[
        Table([
            [paragraph("DAD'S 2026 NOBO FIELD REFERENCE | MILE 1,850 TO KATAHDIN", STYLE["cover_flag"])],
            [Spacer(1, 12)],
            [paragraph("MOUNTAINS<br/><font color='#F3B08B'>UP + DOWN.</font>", STYLE["cover_title"])],
            [Spacer(1, 13)],
            [paragraph(
                f"Every named mountain in the final {fmt(data['summary']['distanceMiles'], 1)} miles. "
                "The climb and the northbound descent now carry equal visual weight.",
                STYLE["cover_lede"],
            )],
        ], colWidths=[CONTENT_WIDTH - 58]),
    ]], colWidths=[CONTENT_WIDTH - 28])
    title_content.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 21),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    background_table = Table([[background]], colWidths=[CONTENT_WIDTH], rowHeights=[260])
    background_table.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.extend([background_table, Spacer(1, -250), title_content, Spacer(1, 51)])
    story.append(cover_profile(data))
    story.append(Spacer(1, 8))
    story.append(overview_table(data))
    story.append(Spacer(1, 10))

    watch = data["summary"]["highestKneeLoad"][:5]
    watch_rows = [[
        paragraph("DOWNHILL WATCHLIST", STYLE["body_bold"]),
        paragraph(
            " | ".join(
                f"{item['name']} {fmt(item['kneeLoadScore'], 1)}"
                for item in watch
            ),
            STYLE["body"],
        ),
    ]]
    watch_table = Table(watch_rows, colWidths=[CONTENT_WIDTH * 0.23, CONTENT_WIDTH * 0.77])
    watch_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(watch_table)
    story.append(Spacer(1, 8))
    story.append(paragraph(
        "<b>READ THE GUIDE:</b> UP is the climb-demand score. DOWN is the knee-load screen. "
        "The higher number becomes OVERALL, so a consequential descent is never averaged away.",
        STYLE["small"],
    ))
    story.append(PageBreak())
    return story


def method_and_sources(data: dict[str, Any]) -> list[Any]:
    story: list[Any] = [
        PageBreak(),
        paragraph("TERRAIN METHOD", STYLE["section_kicker"]),
        paragraph("How the downhill screen works.", STYLE["section_title"]),
        Spacer(1, 8),
        paragraph(data["methodology"]["climbDefinition"], STYLE["body"]),
        Spacer(1, 4),
        paragraph(data["methodology"]["descentDefinition"], STYLE["body"]),
        Spacer(1, 4),
        paragraph(data["methodology"]["kneeLoadDefinition"], STYLE["body"]),
        Spacer(1, 4),
        paragraph(data["methodology"]["difficultyDefinition"], STYLE["body"]),
        Spacer(1, 4),
        paragraph(f"<b>Field caution:</b> {data['methodology']['caution']}", STYLE["body"]),
        Spacer(1, 16),
    ]

    source_rows = []
    for source in data["sources"]:
        source_rows.append([
            paragraph(source["label"], STYLE["body_bold"]),
            paragraph(
                f"{source['detail']}<br/><font color='#28483A'>{source['url']}</font>",
                STYLE["small"],
            ),
        ])
    sources = Table(source_rows, colWidths=[CONTENT_WIDTH * 0.32, CONTENT_WIDTH * 0.68])
    sources.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("BACKGROUND", (0, 0), (0, -1), CREAM),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.extend([
        sources,
        Spacer(1, 16),
        paragraph(
            f"Compiled {data['generatedAt']}. Every displayed trail mile is re-derived from "
            "Hoggcountry's anchor-calibrated route; no mountain mile is hand-entered. "
            "The official AT dataset ends at Baxter Peak, so the separate exit descent from Katahdin is "
            "called out but not assigned a false score.",
            STYLE["small"],
        ),
    ])
    return story


def build_pdf(data: dict[str, Any], destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    document = BaseDocTemplate(
        str(destination),
        pagesize=letter,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title=base.ascii_text(data["title"] + " - " + data["subtitle"]),
        author="Hogg Country",
        subject="Knee-aware Appalachian Trail northern mountain reference",
        creator="Hogg Country trail data pipeline",
    )
    frame = Frame(
        MARGIN_X,
        MARGIN_BOTTOM,
        PAGE_WIDTH - (2 * MARGIN_X),
        PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="mountains-guide-frame",
    )
    document.addPageTemplates([PageTemplate(id="mountains-guide", frames=[frame], onPage=draw_page)])

    story = cover_story(data)
    for region in data["regions"]:
        mountains = [item for item in data["mountains"] if item["regionId"] == region["id"]]
        if not mountains:
            continue
        story.append(KeepTogether([region_header(region), mountain_card(mountains[0])]))
        for mountain in mountains[1:]:
            story.append(mountain_card(mountain))
    story.extend(method_and_sources(data))
    document.build(story)


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    build_pdf(data, OUTPUT_PATH)
    PUBLIC_PATH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(OUTPUT_PATH, PUBLIC_PATH)
    shutil.copy2(OUTPUT_PATH, LEGACY_OUTPUT_PATH)
    shutil.copy2(OUTPUT_PATH, LEGACY_PUBLIC_PATH)
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")
    print(f"Copied {PUBLIC_PATH.relative_to(ROOT)}")
    print(f"Updated legacy alias {LEGACY_PUBLIC_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
