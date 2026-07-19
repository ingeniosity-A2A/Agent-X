#!/usr/bin/env python3
"""Generate a professional PDF containing the full Assembly Tech source code."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, Preformatted, Flowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Registration ──
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman Bold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Calibri Bold', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman Bold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri Bold')

# ── Colors ──
BG_DARK = colors.HexColor('#0d1117')
BG_CARD = colors.HexColor('#161b22')
ACCENT = colors.HexColor('#f7ad32')
ACCENT2 = colors.HexColor('#e09020')
TEXT_LIGHT = colors.HexColor('#e6edf3')
TEXT_MUTED = colors.HexColor('#8b949e')
BORDER = colors.HexColor('#21262d')
CODE_BG = colors.HexColor('#f6f8fa')
CODE_TEXT = colors.HexColor('#1f2328')
CODE_KEYWORD = colors.HexColor('#cf222e')
CODE_STRING = colors.HexColor('#0a3069')
CODE_COMMENT = colors.HexColor('#656d76')
CODE_BORDER = colors.HexColor('#d1d9e0')

PAGE_W, PAGE_H = A4
LEFT_M = 18 * mm
RIGHT_M = 18 * mm
TOP_M = 20 * mm
BOTTOM_M = 20 * mm
CONTENT_W = PAGE_W - LEFT_M - RIGHT_M

# ── Styles ──
cover_title_style = ParagraphStyle(
    'CoverTitle', fontName='Times New Roman', fontSize=42,
    leading=48, alignment=TA_CENTER, textColor=colors.white,
    spaceAfter=8,
)
cover_subtitle_style = ParagraphStyle(
    'CoverSubtitle', fontName='Calibri', fontSize=18,
    leading=24, alignment=TA_CENTER, textColor=TEXT_MUTED,
    spaceAfter=20,
)
cover_badge_style = ParagraphStyle(
    'CoverBadge', fontName='Calibri', fontSize=11,
    leading=14, alignment=TA_CENTER, textColor=ACCENT,
    spaceAfter=24,
)
section_title_style = ParagraphStyle(
    'SectionTitle', fontName='Times New Roman', fontSize=20,
    leading=26, textColor=colors.HexColor('#1f2328'),
    spaceAfter=6, spaceBefore=16,
)
section_desc_style = ParagraphStyle(
    'SectionDesc', fontName='Calibri', fontSize=10,
    leading=14, textColor=TEXT_MUTED, spaceAfter=10,
)
file_header_style = ParagraphStyle(
    'FileHeader', fontName='DejaVuSans', fontSize=12,
    leading=16, textColor=colors.HexColor('#1f2328'),
)
file_path_style = ParagraphStyle(
    'FilePath', fontName='DejaVuSans', fontSize=9,
    leading=12, textColor=TEXT_MUTED,
)
toc_title_style = ParagraphStyle(
    'TocTitle', fontName='Times New Roman', fontSize=24,
    leading=30, textColor=colors.HexColor('#1f2328'),
    spaceAfter=16,
)
toc_file_style = ParagraphStyle(
    'TocFile', fontName='DejaVuSans', fontSize=11,
    leading=16, textColor=colors.HexColor('#1f2328'),
)
toc_path_style = ParagraphStyle(
    'TocPath', fontName='DejaVuSans', fontSize=9,
    leading=12, textColor=TEXT_MUTED,
)
toc_desc_style = ParagraphStyle(
    'TocDesc', fontName='Calibri', fontSize=9,
    leading=13, textColor=TEXT_MUTED,
)
toc_lines_style = ParagraphStyle(
    'TocLines', fontName='DejaVuSans', fontSize=10,
    leading=14, textColor=TEXT_MUTED, alignment=TA_CENTER,
)
code_style = ParagraphStyle(
    'Code', fontName='DejaVuSans', fontSize=7.2,
    leading=10.2, textColor=CODE_TEXT,
    leftIndent=0, rightIndent=0,
    spaceBefore=0, spaceAfter=0,
)
line_num_style = ParagraphStyle(
    'LineNum', fontName='DejaVuSans', fontSize=7.2,
    leading=10.2, textColor=TEXT_MUTED, alignment=TA_CENTER,
)


class HRule(Flowable):
    """Horizontal rule flowable."""
    def __init__(self, width, color=BORDER, thickness=1):
        Flowable.__init__(self)
        self.width = width
        self.color = color
        self.thickness = thickness
        self.height = thickness + 4

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 2, self.width, 2)


class DarkCover(Flowable):
    """Dark background cover page."""
    def __init__(self, width, height):
        Flowable.__init__(self)
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        # Dark background
        c.setFillColor(BG_DARK)
        c.rect(-LEFT_M, -BOTTOM_M, PAGE_W, PAGE_H, fill=1, stroke=0)
        
        # Accent line
        cx = self.width / 2
        c.setStrokeColor(ACCENT)
        c.setLineWidth(3)
        c.line(cx - 30, 180, cx + 30, 180)


def build_code_block(lines, content_width):
    """Build a code block as a Table with line numbers."""
    line_num_width = 30
    code_width = content_width - line_num_width - 8
    
    data = []
    for i, line in enumerate(lines, 1):
        # Escape XML characters for Paragraph
        safe_line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        if not safe_line.strip():
            safe_line = ' '
        
        ln = Paragraph(str(i), line_num_style)
        code = Paragraph(safe_line, code_style)
        data.append([ln, code])
    
    if not data:
        data.append([Paragraph('1', line_num_style), Paragraph('(empty)', code_style)])
    
    col_widths = [line_num_width, code_width]
    
    style_commands = [
        ('BACKGROUND', (0, 0), (-1, -1), CODE_BG),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (0, -1), 4),
        ('RIGHTPADDING', (0, 0), (0, -1), 2),
        ('LEFTPADDING', (1, 0), (1, -1), 6),
        ('RIGHTPADDING', (1, 0), (1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('LINEBELOW', (0, 0), (-1, -1), 0.25, colors.HexColor('#e1e4e8')),
        ('BOX', (0, 0), (-1, -1), 0.5, CODE_BORDER),
    ]
    
    t = Table(data, colWidths=col_widths, hAlign='LEFT')
    t.setStyle(TableStyle(style_commands))
    return t


def build_file_header(name, path, description):
    """Build a file header with name, path, and description."""
    elements = []
    
    # File header table
    header_data = [
        [Paragraph(f'<b>{name}</b>', file_header_style)],
        [Paragraph(path, file_path_style)],
    ]
    header_table = Table(header_data, colWidths=[CONTENT_W])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f6f8fa')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 0.5, CODE_BORDER),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.HexColor('#d1d9e0')),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 4))
    
    if description:
        elements.append(Paragraph(description, section_desc_style))
        elements.append(Spacer(1, 4))
    
    return elements


# ── Read source files ──
base_dir = '/home/z/my-project'
files_to_include = [
    {
        'name': 'page.tsx',
        'path': 'src/app/page.tsx',
        'description': 'Main page component with 3D camera, furniture carousel, hero card, workshop bar, and share functionality.',
    },
    {
        'name': 'assembly.css',
        'path': 'src/app/assembly.css',
        'description': 'Complete CSS with 3D camera styles, neumorphic design, 3D reflection carousel, workshop search bar, and all keyframe animations.',
    },
    {
        'name': 'layout.tsx',
        'path': 'src/app/layout.tsx',
        'description': 'Root layout with Geist fonts, metadata, and toaster component.',
    },
    {
        'name': 'next.config.ts',
        'path': 'next.config.ts',
        'description': 'Next.js configuration with standalone output, TypeScript settings, and image remote patterns for freepik.',
    },
]

# Read file contents
for f in files_to_include:
    filepath = os.path.join(base_dir, f['path'])
    with open(filepath, 'r', encoding='utf-8') as fh:
        f['content'] = fh.read()
    f['lines'] = f['content'].split('\n')


# ── Build PDF ──
output_path = os.path.join(base_dir, 'output', 'assembly-tech-source-code.pdf')

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=LEFT_M,
    rightMargin=RIGHT_M,
    topMargin=TOP_M,
    bottomMargin=BOTTOM_M,
    title='Assembly Tech - Full Source Code',
    author='Z.ai',
    creator='Z.ai',
    subject='Complete source code for the Assembly Tech furniture assembly platform built with Next.js 16',
)

story = []

# ═══════════ COVER PAGE ═══════════
# Dark background cover
story.append(Spacer(1, 80))
story.append(DarkCover(CONTENT_W, 100))

# Badge
story.append(Spacer(1, -200))
badge_data = [[Paragraph('NEXT.JS 16 APP ROUTER', ParagraphStyle(
    'Badge', fontName='DejaVuSans', fontSize=10, leading=14,
    textColor=ACCENT, alignment=TA_CENTER,
))]]
badge_table = Table(badge_data, colWidths=[200])
badge_table.setStyle(TableStyle([
    ('BOX', (0, 0), (-1, -1), 1, ACCENT),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 16),
    ('RIGHTPADDING', (0, 0), (-1, -1), 16),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
]))
story.append(badge_table)

story.append(Spacer(1, 30))
story.append(Paragraph('<b>Assembly Tech</b>', ParagraphStyle(
    'CT2', fontName='Times New Roman', fontSize=48,
    leading=54, alignment=TA_CENTER, textColor=colors.HexColor('#1f2328'),
)))
story.append(Spacer(1, 8))
story.append(Paragraph('Full Source Code Documentation', ParagraphStyle(
    'CS2', fontName='Calibri', fontSize=18,
    leading=24, alignment=TA_CENTER, textColor=TEXT_MUTED,
)))

# Accent line
story.append(Spacer(1, 24))
line_data = [['  ']]
line_table = Table(line_data, colWidths=[60])
line_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), ACCENT),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
]))
story.append(line_table)

# Stats
story.append(Spacer(1, 36))
total_lines = sum(len(f['lines']) for f in files_to_include)
total_files = len(files_to_include)
stats_data = [
    [
        Paragraph(f'<b>{total_files}</b>', ParagraphStyle('Stat1', fontName='Times New Roman', fontSize=28, leading=34, alignment=TA_CENTER, textColor=ACCENT)),
        Paragraph(f'<b>{total_lines}</b>', ParagraphStyle('Stat2', fontName='Times New Roman', fontSize=28, leading=34, alignment=TA_CENTER, textColor=ACCENT)),
        Paragraph(f'<b>TSX/CSS</b>', ParagraphStyle('Stat3', fontName='Times New Roman', fontSize=28, leading=34, alignment=TA_CENTER, textColor=ACCENT)),
    ],
    [
        Paragraph('Source Files', ParagraphStyle('SL1', fontName='Calibri', fontSize=10, leading=14, alignment=TA_CENTER, textColor=TEXT_MUTED)),
        Paragraph('Total Lines', ParagraphStyle('SL2', fontName='Calibri', fontSize=10, leading=14, alignment=TA_CENTER, textColor=TEXT_MUTED)),
        Paragraph('Languages', ParagraphStyle('SL3', fontName='Calibri', fontSize=10, leading=14, alignment=TA_CENTER, textColor=TEXT_MUTED)),
    ],
]
stats_table = Table(stats_data, colWidths=[CONTENT_W / 3] * 3)
stats_table.setStyle(TableStyle([
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(stats_table)

story.append(PageBreak())

# ═══════════ TABLE OF CONTENTS ═══════════
story.append(Paragraph('<b>Table of Contents</b>', toc_title_style))
story.append(HRule(CONTENT_W, ACCENT, 2))
story.append(Spacer(1, 12))

for idx, f in enumerate(files_to_include, 1):
    toc_row_data = [
        [
            Paragraph(f'<b>{idx}</b>', ParagraphStyle('TN', fontName='Times New Roman', fontSize=18, leading=22, alignment=TA_CENTER, textColor=ACCENT)),
            [
                Paragraph(f'<b>{f["name"]}</b>', toc_file_style),
                Paragraph(f['path'], toc_path_style),
                Paragraph(f['description'], toc_desc_style),
            ],
            Paragraph(f'{len(f["lines"])} lines', toc_lines_style),
        ],
    ]
    toc_table = Table(toc_row_data, colWidths=[36, CONTENT_W - 36 - 70, 70])
    toc_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#e1e4e8')),
    ]))
    story.append(toc_table)

story.append(PageBreak())

# ═══════════ SOURCE CODE FILES ═══════════
for idx, f in enumerate(files_to_include, 1):
    # File header
    story.extend(build_file_header(f['name'], f['path'], f['description']))
    story.append(Spacer(1, 4))
    
    # Code block — split into chunks of 50 lines to avoid massive tables
    LINES_PER_CHUNK = 50
    all_lines = f['lines']
    
    for chunk_start in range(0, len(all_lines), LINES_PER_CHUNK):
        chunk_end = min(chunk_start + LINES_PER_CHUNK, len(all_lines))
        chunk = all_lines[chunk_start:chunk_end]
        
        code_table = build_code_block(chunk, CONTENT_W)
        story.append(code_table)
        story.append(Spacer(1, 8))
    
    # Page break between files (not after the last one)
    if idx < len(files_to_include):
        story.append(PageBreak())


# ── Build ──
doc.build(story)
print(f"PDF generated: {output_path}")
print(f"File size: {os.path.getsize(output_path):,} bytes")
