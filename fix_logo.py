import re

with open('components/LogoEmblem.tsx', 'r') as f:
    content = f.read()

# Change the name back to "سند" since it was changed to "معين" in a previous glitch or edit
old_text = r"""<span>معين</span>"""
new_text = """<span className="font-amiri text-lg">سند الأستاذ</span>"""
content = re.sub(old_text, new_text, content)

# Enhance the icon: Let's design a specialized emblem using standard SVG that looks premium and relevant to Islamic Sciences
old_svg = r"""<svg\s*width=\{Math\.round\(iconSize \* 0\.68\)\}\s*height=\{Math\.round\(iconSize \* 0\.68\)\}\s*viewBox="0 0 24 24"\s*fill="none"\s*stroke="currentColor"\s*strokeWidth="2"\s*strokeLinecap="round"\s*strokeLinejoin="round"\s*>\s*\{\/\* Stylized Book with Open Pages & Quill Mark \*\/\}\s*<path d="M4 19\.5v-15A2\.5 2\.5 0 0 1 6\.5 2H20v20H6\.5a2\.5 2\.5 0 0 1-2\.5-2\.5Z" />\s*<path d="M6 6h10" />\s*<path d="M6 10h10" />\s*<path d="M6 14h6" />\s*<circle cx="16" cy="14" r="1\.5" fill="#facc15" stroke="none" />\s*</svg>"""

new_svg = """<svg
          width={Math.round(iconSize * 0.65)}
          height={Math.round(iconSize * 0.65)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Islamic Arch & Open Book (Mushaf / Notebook) motif */}
          <path d="M12 3a9 9 0 0 0-9 9v9h18v-9a9 9 0 0 0-9-9Z" />
          <path d="M12 21v-8" />
          <path d="M8 15a4 4 0 0 1 4-4 4 4 0 0 1 4 4" />
          <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="#D9B44A" stroke="none" />
        </svg>"""

content = re.sub(old_svg, new_svg, content)

# Change subtitle to be more descriptive
old_subtitle = r"""\{academicYear\}"""
new_subtitle = """العلوم الإسلامية • {academicYear}"""
content = re.sub(old_subtitle, new_subtitle, content)


with open('components/LogoEmblem.tsx', 'w') as f:
    f.write(content)

