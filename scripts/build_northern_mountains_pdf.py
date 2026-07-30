#!/usr/bin/env python3
"""Build the Dad-facing northern AT mountain guide PDF from shared JSON."""

from __future__ import annotations

import json
import math
import shutil
from pathlib import Path
from typing import Any

from reportlab.graphics.shapes import Drawing, Line, Path as ShapePath, Rect, String
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "apps/openclaw-web/src/lib/data/northern-mountains-guide.json"
OUTPUT_PATH = ROOT / "output/pdf/hogg-country-at-mountains-mile-1850-to-katahdin.pdf"
PUBLIC_PATH = ROOT / "apps/openclaw-web/static/guides/hogg-country-at-mountains-mile-1850-to-katahdin.pdf"

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN_X = 0.48 * inch
MARGIN_TOP = 0.54 * inch
MARGIN_BOTTOM = 0.5 * inch
CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN_X)

PINE = HexColor("#33483A")
INK = HexColor("#203026")
MOSS = HexColor("#84936F")
CREAM = HexColor("#F5F2E8")
PAPER = HexColor("#FFFDF7")
ORANGE = HexColor("#C86322")
TAN = HexColor("#E5D9B9")
MUTED = HexColor("#59635B")
LINE = HexColor("#D8D1C0")
CRUISE = HexColor("#4C8A63")
STEADY = HexColor("#9F731F")
HARD = HexColor("#BD5729")
SEVERE = HexColor("#9F3535")


def register_fonts() -> tuple[str, str]:
    display_path = Path("/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf")
    body_path = Path("/System/Library/Fonts/Supplemental/Verdana.ttf")
    body_bold_path = Path("/System/Library/Fonts/Supplemental/Verdana Bold.ttf")

    display = "Helvetica-Bold"
    body = "Helvetica"
    body_bold = "Helvetica-Bold"

    if display_path.exists():
        pdfmetrics.registerFont(TTFont("GuideDisplay", str(display_path)))
        display = "GuideDisplay"
    if body_path.exists() and body_bold_path.exists():
        pdfmetrics.registerFont(TTFont("GuideBody", str(body_path)))
        pdfmetrics.registerFont(TTFont("GuideBodyBold", str(body_bold_path)))
        body = "GuideBody"
        body_bold = "GuideBodyBold"

    return display, body, body_bold


DISPLAY_FONT, BODY_FONT, BODY_BOLD_FONT = register_fonts()


def ascii_text(value: Any) -> str:
    text = str(value)
    replacements = {
        "\u2010": "-",
        "\u2011": "-",
        "\u2012": "-",
        "\u2013": "-",
        "\u2014": "-",
        "\u2212": "-",
        "\u2026": "...",
        "\u00b7": "|",
        "\u2192": "to",
        "\u2019": "'",
        "\u2018": "'",
        "\u201c": '"',
        "\u201d": '"',
    }
    for source, replacement in replacements.items():
        text = text.replace(source, replacement)
    return text


def fmt(value: float, digits: int = 0) -> str:
    return f"{value:,.{digits}f}"


def difficulty_color(score: float) -> colors.Color:
    if score >= 8.5:
        return SEVERE
    if score >= 7:
        return HARD
    if score >= 5:
        return STEADY
    return CRUISE


def paragraph(text: Any, style: ParagraphStyle) -> Paragraph:
    return Paragraph(ascii_text(text), style)


styles = getSampleStyleSheet()
STYLE = {
    "cover_kicker": ParagraphStyle(
        "cover_kicker",
        parent=styles["Normal"],
        fontName=BODY_BOLD_FONT,
        fontSize=8,
        leading=10,
        textColor=ORANGE,
        spaceAfter=8,
        uppercase=True,
    ),
    "cover_title": ParagraphStyle(
        "cover_title",
        parent=styles["Title"],
        fontName=DISPLAY_FONT,
        fontSize=55,
        leading=47,
        textColor=colors.white,
        spaceAfter=12,
    ),
    "cover_lede": ParagraphStyle(
        "cover_lede",
        parent=styles["BodyText"],
        fontName=BODY_FONT,
        fontSize=11,
        leading=17,
        textColor=HexColor("#E9EEE9"),
        spaceAfter=12,
    ),
    "section_kicker": ParagraphStyle(
        "section_kicker",
        parent=styles["Normal"],
        fontName=BODY_BOLD_FONT,
        fontSize=7.5,
        leading=9,
        textColor=ORANGE,
        spaceAfter=3,
    ),
    "section_title": ParagraphStyle(
        "section_title",
        parent=styles["Heading1"],
        fontName=DISPLAY_FONT,
        fontSize=27,
        leading=29,
        textColor=INK,
        spaceAfter=4,
    ),
    "section_meta": ParagraphStyle(
        "section_meta",
        parent=styles["Normal"],
        fontName=BODY_FONT,
        fontSize=7.5,
        leading=10,
        textColor=MUTED,
        alignment=TA_RIGHT,
    ),
    "mountain_name": ParagraphStyle(
        "mountain_name",
        parent=styles["Heading2"],
        fontName=DISPLAY_FONT,
        fontSize=15.5,
        leading=16.5,
        textColor=INK,
        spaceAfter=2,
    ),
    "mountain_meta": ParagraphStyle(
        "mountain_meta",
        parent=styles["Normal"],
        fontName=BODY_FONT,
        fontSize=6.7,
        leading=8.5,
        textColor=MUTED,
    ),
    "metric_label": ParagraphStyle(
        "metric_label",
        parent=styles["Normal"],
        fontName=BODY_BOLD_FONT,
        fontSize=5.7,
        leading=6.8,
        textColor=MUTED,
    ),
    "metric_value": ParagraphStyle(
        "metric_value",
        parent=styles["Normal"],
        fontName=DISPLAY_FONT,
        fontSize=11.5,
        leading=12,
        textColor=INK,
    ),
    "metric_note": ParagraphStyle(
        "metric_note",
        parent=styles["Normal"],
        fontName=BODY_FONT,
        fontSize=5.8,
        leading=7,
        textColor=MUTED,
    ),
    "expectation": ParagraphStyle(
        "expectation",
        parent=styles["BodyText"],
        fontName=BODY_FONT,
        fontSize=7.1,
        leading=10,
        textColor=MUTED,
    ),
    "difficulty_label": ParagraphStyle(
        "difficulty_label",
        parent=styles["Normal"],
        fontName=BODY_BOLD_FONT,
        fontSize=5.7,
        leading=6.5,
        textColor=colors.white,
        alignment=TA_CENTER,
    ),
    "difficulty_value": ParagraphStyle(
        "difficulty_value",
        parent=styles["Normal"],
        fontName=DISPLAY_FONT,
        fontSize=17,
        leading=17,
        textColor=colors.white,
        alignment=TA_CENTER,
    ),
    "body": ParagraphStyle(
        "body",
        parent=styles["BodyText"],
        fontName=BODY_FONT,
        fontSize=8,
        leading=12,
        textColor=MUTED,
    ),
    "body_bold": ParagraphStyle(
        "body_bold",
        parent=styles["BodyText"],
        fontName=BODY_BOLD_FONT,
        fontSize=8,
        leading=12,
        textColor=INK,
    ),
    "small": ParagraphStyle(
        "small",
        parent=styles["BodyText"],
        fontName=BODY_FONT,
        fontSize=6.4,
        leading=9,
        textColor=MUTED,
    ),
}


class CoverBackground(Flowable):
    def __init__(self, height: float):
        super().__init__()
        self.height = height
        self.width = CONTENT_WIDTH

    def wrap(self, available_width: float, available_height: float) -> tuple[float, float]:
        return available_width, self.height

    def draw(self) -> None:
        canvas = self.canv
        canvas.saveState()
        canvas.setFillColor(PINE)
        canvas.roundRect(0, 0, self.width, self.height, 12, fill=1, stroke=0)
        canvas.setStrokeColor(HexColor("#5E7462"))
        canvas.setLineWidth(0.45)
        for offset in range(12, int(self.height), 18):
            canvas.arc(self.width * 0.38, -self.height * 0.9 + offset, self.width * 1.24, self.height * 1.45 + offset, 20, 144)
        canvas.restoreState()


def elevation_drawing(points: list[dict[str, Any]], width: float, height: float, color: colors.Color = ORANGE) -> Drawing:
    drawing = Drawing(width, height)
    if len(points) < 2:
        return drawing

    elevations = [float(point["elevationFt"]) for point in points]
    minimum = min(elevations)
    maximum = max(elevations)
    span = max(1.0, maximum - minimum)

    shape = ShapePath()
    fill = ShapePath()
    coordinates: list[tuple[float, float]] = []
    for index, point in enumerate(points):
        x = (index / (len(points) - 1)) * width
        y = 5 + ((float(point["elevationFt"]) - minimum) / span) * (height - 10)
        coordinates.append((x, y))

    first_x, first_y = coordinates[0]
    shape.moveTo(first_x, first_y)
    fill.moveTo(first_x, 0)
    fill.lineTo(first_x, first_y)
    for x, y in coordinates[1:]:
        shape.lineTo(x, y)
        fill.lineTo(x, y)
    fill.lineTo(width, 0)
    fill.lineTo(first_x, 0)
    fill.fillColor = colors.Color(color.red, color.green, color.blue, alpha=0.12)
    fill.strokeColor = None
    shape.strokeColor = color
    shape.strokeWidth = 1.5
    shape.fillColor = None
    drawing.add(fill)
    drawing.add(shape)
    return drawing


def score_bar(score: float, width: float = 128, height: float = 5) -> Drawing:
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, fillColor=LINE, strokeColor=None))
    drawing.add(Rect(0, 0, width * max(0, min(10, score)) / 10, height, fillColor=difficulty_color(score), strokeColor=None))
    return drawing


def cover_profile(data: dict[str, Any]) -> Table:
    drawing = elevation_drawing(data["summary"]["profile"], CONTENT_WIDTH - 28, 120, ORANGE)
    labels = Table(
        [[
            paragraph(f"MILE {fmt(data['guideStartMile'])}", STYLE["metric_label"]),
            paragraph(f"KATAHDIN {fmt(data['terminusMile'], 1)}", ParagraphStyle("right_metric", parent=STYLE["metric_label"], alignment=TA_RIGHT)),
        ]],
        colWidths=[(CONTENT_WIDTH - 28) / 2] * 2,
    )
    labels.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    block = Table([[drawing], [labels]], colWidths=[CONTENT_WIDTH - 28])
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
            [paragraph(label, STYLE["metric_label"])],
            [paragraph(value, ParagraphStyle("cover_stat", parent=STYLE["metric_value"], fontSize=17, leading=18, textColor=colors.white))],
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


def metric_cell(label: str, value: str, note: str) -> Table:
    cell = Table([
        [paragraph(label.upper(), STYLE["metric_label"])],
        [paragraph(value, STYLE["metric_value"])],
        [paragraph(note, STYLE["metric_note"])],
    ])
    cell.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return cell


def expectation_text(mountain: dict[str, Any]) -> str:
    if mountain["approachType"] == "Ridge traverse":
        effort = "Ridge traverse rather than a fresh climb."
    else:
        effort = (
            f"{mountain['inclineLabel']} with about "
            f"{fmt(mountain['averageGainFtPerMile'])} ft of gain per mile."
        )
    if mountain["rockinessScore"] >= 7.5:
        tread = "Footing is a major pace limiter."
    elif mountain["rockinessScore"] >= 6:
        tread = "Rocky tread will slow a clean hiking pace."
    else:
        tread = "Tread is the smaller part of the challenge here."
    return f"{effort} {tread}"


def mountain_card(mountain: dict[str, Any]) -> KeepTogether:
    score = float(mountain["difficultyScore"])
    color = difficulty_color(score)
    title_meta = (
        f"{mountain['approachType'].upper()} | {mountain['trailRelation']}<br/>"
        f"{fmt(mountain['milesToKatahdin'], 1)} mi to Katahdin"
    )
    if mountain.get("summitElevationFt") is not None:
        title_meta = f"~{fmt(mountain['summitElevationFt'])} ft | " + title_meta

    title = Table([
        [
            Table([
                [paragraph("NOBO", STYLE["metric_label"])],
                [paragraph(fmt(mountain["summitMile"], 1), ParagraphStyle("mile", parent=STYLE["metric_value"], fontSize=15, leading=15, textColor=PINE))],
            ], colWidths=[46]),
            Table([
                [paragraph(mountain["name"], STYLE["mountain_name"])],
                [paragraph(title_meta, STYLE["mountain_meta"])],
            ]),
            Table([
                [paragraph("DIFFICULTY", STYLE["difficulty_label"])],
                [paragraph(fmt(score, 1), STYLE["difficulty_value"])],
                [paragraph(mountain["difficultyLabel"].upper(), STYLE["difficulty_label"])],
            ], colWidths=[58]),
        ]
    ], colWidths=[50, CONTENT_WIDTH - 50 - 58 - 24, 58])
    title.setStyle(TableStyle([
        ("BACKGROUND", (2, 0), (2, 0), color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (2, 0), (2, 0), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    metrics = Table([[
        metric_cell("Climb", f"{fmt(mountain['climbDistanceMiles'], 1)} mi", f"from mi {fmt(mountain['climbStartMile'], 1)}"),
        metric_cell("Gain", f"+{fmt(mountain['climbGainFt'])} ft", f"{fmt(mountain['averageGainFtPerMile'])} ft/mi"),
        metric_cell("Steepest", f"{fmt(mountain['maxGradePercent'], 1)}%", mountain["inclineLabel"]),
        metric_cell("Rockiness", f"{fmt(mountain['rockinessScore'], 1)}/10", mountain["rockinessLabel"]),
    ]], colWidths=[(CONTENT_WIDTH - 24) / 4] * 4)
    metrics.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 0.45, LINE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.45, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    profile = elevation_drawing(mountain["profile"], 150, 34, PINE)
    profile_labels = paragraph(
        f"mi {fmt(mountain['climbStartMile'], 1)} to summit {fmt(mountain['summitMile'], 1)}",
        STYLE["metric_note"],
    )
    profile_block = Table([[profile], [profile_labels]], colWidths=[158])
    profile_block.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    detail_lines = [expectation_text(mountain)]
    if mountain.get("crosses"):
        detail_lines.append("Sequence: " + " | ".join(mountain["crosses"]))
    detail = Table([
        [paragraph(" ".join(detail_lines), STYLE["expectation"])],
        [score_bar(score, 205, 4)],
    ], colWidths=[205])
    detail.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 0),
    ]))

    terrain = Table([[profile_block, detail]], colWidths=[172, CONTENT_WIDTH - 24 - 172])
    terrain.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    card = Table([[title], [metrics], [terrain]], colWidths=[CONTENT_WIDTH])
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
        ("BOX", (0, 0), (-1, -1), 0.55, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 0),
        ("TOPPADDING", (0, 2), (-1, 2), 6),
        ("BOTTOMPADDING", (0, 2), (-1, 2), 8),
    ]))
    return KeepTogether([card, Spacer(1, 7)])


def region_header(region: dict[str, Any]) -> KeepTogether:
    heading = Table([[
        Table([
            [paragraph(f"{region['state'].upper()} | MILE {fmt(region['startMile'], 1)}-{fmt(region['endMile'], 1)}", STYLE["section_kicker"])],
            [paragraph(region["name"], STYLE["section_title"])],
        ]),
        paragraph(f"{region['mountainCount']} MOUNTAINS", STYLE["section_meta"]),
    ]], colWidths=[CONTENT_WIDTH * 0.72, CONTENT_WIDTH * 0.28])
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
    canvas.rect(0, PAGE_HEIGHT - 13, PAGE_WIDTH, 13, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_X, 27, PAGE_WIDTH - MARGIN_X, 27)
    canvas.setFont(BODY_BOLD_FONT, 6.4)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 15, "HOGG COUNTRY | MOUNTAINS AHEAD | PLANNING AID")
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, 15, f"PAGE {document.page}")
    canvas.restoreState()


def cover_story(data: dict[str, Any]) -> list[Any]:
    story: list[Any] = []
    background = CoverBackground(265)
    title_content = Table([[
        Table([
            [paragraph("DAD'S NORTHERN FIELD REFERENCE | 2026 NOBO", STYLE["cover_kicker"])],
            [paragraph("MOUNTAINS<br/>AHEAD.", STYLE["cover_title"])],
            [paragraph(
                f"Every named mountain in the final {fmt(data['summary']['distanceMiles'], 1)} miles, "
                f"ordered northbound from mile {fmt(data['guideStartMile'])} to Baxter Peak.",
                STYLE["cover_lede"],
            )],
        ], colWidths=[CONTENT_WIDTH - 52]),
    ]], colWidths=[CONTENT_WIDTH - 28])
    title_content.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.transparent),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    cover_stack = Table([[background]], colWidths=[CONTENT_WIDTH], rowHeights=[265])
    cover_stack.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))

    # Overlay via negative spacing: ReportLab draws the background first, then
    # places the title table back over the same vertical area.
    story.extend([cover_stack, Spacer(1, -255), title_content, Spacer(1, 57)])
    story.append(cover_profile(data))
    story.append(Spacer(1, 8))
    story.append(overview_table(data))
    story.append(Spacer(1, 12))

    hardest = ", ".join(
        f"{item['name']} ({fmt(item['difficultyScore'], 1)})"
        for item in data["summary"]["hardest"][:4]
    )
    cover_notes = Table([[
        paragraph(
            "<b>READ THE SCORE</b><br/>1-4.9 Cruise | 5-6.9 Steady | 7-8.4 Hard | 8.5-10 Severe",
            STYLE["body"],
        ),
        paragraph(f"<b>HARDEST MOVEMENT SCREENS</b><br/>{hardest}", STYLE["body"]),
    ]], colWidths=[CONTENT_WIDTH * 0.45, CONTENT_WIDTH * 0.55])
    cover_notes.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(cover_notes)
    story.append(Spacer(1, 10))
    story.append(paragraph(
        f"<b>Important:</b> {data['methodology']['caution']} "
        "Check current weather, closures, water, and Baxter status before acting.",
        STYLE["small"],
    ))
    story.append(PageBreak())
    return story


def method_and_sources(data: dict[str, Any]) -> list[Any]:
    story: list[Any] = [
        PageBreak(),
        paragraph("METHOD AND SOURCES", STYLE["section_kicker"]),
        paragraph("How this guide was built.", STYLE["section_title"]),
        Spacer(1, 8),
        paragraph(data["methodology"]["climbDefinition"], STYLE["body"]),
        Spacer(1, 4),
        paragraph(data["methodology"]["difficultyDefinition"], STYLE["body"]),
        Spacer(1, 4),
        paragraph(f"<b>Field caution:</b> {data['methodology']['caution']}", STYLE["body"]),
        Spacer(1, 18),
    ]
    source_rows = []
    for source in data["sources"]:
        source_rows.append([
            paragraph(source["label"], STYLE["body_bold"]),
            paragraph(f"{source['detail']}<br/><font color='#33483A'>{source['url']}</font>", STYLE["small"]),
        ])
    table = Table(source_rows, colWidths=[CONTENT_WIDTH * 0.32, CONTENT_WIDTH * 0.68])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("BACKGROUND", (0, 0), (0, -1), CREAM),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.extend([
        table,
        Spacer(1, 18),
        paragraph(
            f"Compiled {data['generatedAt']}. Peak names and coordinates are a curated open-data selection. "
            "Every displayed trail mile is re-derived from Hoggcountry's anchor-calibrated route; no mountain mile is hand-entered. "
            "This document is a planning aid, not a navigation or current-conditions source.",
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
        title=ascii_text(data["title"] + " - " + data["subtitle"]),
        author="Hogg Country",
        subject="Appalachian Trail northern mountain reference",
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
        id="guide-frame",
    )
    document.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=draw_page)])

    story: list[Any] = cover_story(data)
    for region_index, region in enumerate(data["regions"]):
        if region_index > 0:
            story.append(PageBreak())
        story.append(region_header(region))
        for mountain in [item for item in data["mountains"] if item["regionId"] == region["id"]]:
            story.append(mountain_card(mountain))
    story.extend(method_and_sources(data))
    document.build(story)


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    build_pdf(data, OUTPUT_PATH)
    PUBLIC_PATH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(OUTPUT_PATH, PUBLIC_PATH)
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")
    print(f"Copied {PUBLIC_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
