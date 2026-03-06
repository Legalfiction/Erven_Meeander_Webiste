import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# CSS mask for page wrapper
css_wrapper = """        .page-wrapper {
            max-width: 1160px; /* 1000px content + 80px links en rechts voor de kartels */
            margin: 0 auto;
            background-color: var(--white);
            position: relative;
            box-shadow: 0 0 40px rgba(26, 83, 26, 0.05);
            min-height: 100vh;
            
            /* Prachtige, gigantische CSS Mask voor naadloze gekartelde rand over de hele wrapper */
            -webkit-mask-image: 
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='160' viewBox='0 0 80 160'%3E%3Cpolygon points='80,0 0,80 80,160' fill='black'/%3E%3C/svg%3E"), 
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='160' viewBox='0 0 80 160'%3E%3Cpolygon points='0,0 80,80 0,160' fill='black'/%3E%3C/svg%3E"), 
                linear-gradient(black, black);
            -webkit-mask-position: left top, right top, center top;
            -webkit-mask-size: 80px 160px, 80px 160px, calc(100% - 160px) 100%;
            -webkit-mask-repeat: repeat-y, repeat-y, no-repeat;
            
            mask-image: 
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='160' viewBox='0 0 80 160'%3E%3Cpolygon points='80,0 0,80 80,160' fill='black'/%3E%3C/svg%3E"), 
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='160' viewBox='0 0 80 160'%3E%3Cpolygon points='0,0 80,80 0,160' fill='black'/%3E%3C/svg%3E"), 
                linear-gradient(black, black);
            mask-position: left top, right top, center top;
            mask-size: 80px 160px, 80px 160px, calc(100% - 160px) 100%;
            mask-repeat: repeat-y, repeat-y, no-repeat;
        }"""
html = re.sub(r'        \.page-wrapper \{[\s\S]*?\}\s*\.page-wrapper::after \{[\s\S]*?\}', css_wrapper, html, count=1)


# Transparent hero content block
css_hero = """        .hero-content {
            z-index: 2;
            max-width: 900px;
            padding: 40px;
            position: relative;
            background-color: rgba(250, 248, 231, 0.45);
            /* Transparanter gemaakt per verzoek */
            border-radius: var(--border-radius-organic);
            box-shadow: 0 15px 40px rgba(26, 83, 26, 0.1);
            border: 2px solid var(--white);
        }"""
html = re.sub(r'        \.hero-content \{[\s\S]*?\}', css_hero, html, count=1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated")
