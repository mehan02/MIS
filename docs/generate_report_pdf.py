from pathlib import Path
import textwrap

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

md_path = Path('/Users/mehan/MIS/docs/Full_Architecture_Report_2026-03-19.md')
pdf_path = Path('/Users/mehan/MIS/docs/Full_Architecture_Report_2026-03-19.pdf')

text = md_path.read_text(encoding='utf-8')

page_width, page_height = A4
left_margin = 40
top_margin = 40
bottom_margin = 40
line_height = 14
max_chars = 108

c = canvas.Canvas(str(pdf_path), pagesize=A4)
c.setTitle('MIS Full Architecture Report')
c.setFont('Helvetica', 10)

y = page_height - top_margin

for raw_line in text.splitlines():
    line = raw_line.rstrip()
    wrapped = textwrap.wrap(line, width=max_chars) if line else ['']
    for chunk in wrapped:
        if y <= bottom_margin:
            c.showPage()
            c.setFont('Helvetica', 10)
            y = page_height - top_margin
        c.drawString(left_margin, y, chunk)
        y -= line_height

c.save()
print(f'PDF generated: {pdf_path}')
