import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the dummy mask-image
html = re.sub(r'\s*mask-image:\s*linear-gradient\(black, black\),\s*linear-gradient\(black, black\);', '', html)

# Replace the conic gradient pseudo elements with clean SVG ones
css_before_after = """        /* Gekartelde randen aan de zijkant IN the page-wrapper, zodat het sowieso met de hoogte meegroeit */
        .page-wrapper::before,
        .page-wrapper::after {
            content: "";
            position: absolute;
            top: 0;
            bottom: 0;
            width: 40px;
            background-size: 40px 80px;
            background-repeat: repeat-y;
            z-index: 100;
            pointer-events: none;
        }

        .page-wrapper::before {
            left: 0;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='80' viewBox='0 0 40 80'%3E%3Cpolygon points='0,0 40,40 0,80' fill='%23f1f4eb'/%3E%3C/svg%3E");
        }

        .page-wrapper::after {
            right: 0;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='80' viewBox='0 0 40 80'%3E%3Cpolygon points='40,0 0,40 40,80' fill='%23f1f4eb'/%3E%3C/svg%3E");
        }"""

html = re.sub(r'        /\* Gekartelde randen aan de zijkant IN the page-wrapper.*?(background-image: conic-gradient.*?;\s*\})', css_before_after, html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
