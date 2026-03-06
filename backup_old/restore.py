import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

correct_css = """        /* =======================================
           VISUAL IDENTITY & OFFICIEEL KLEURENPALET
           ======================================= */
        :root {
            --meander-groen: #1A531A;
            --heuvel-groen: #7CC040;
            --rivier-blauw: #40ADEF;
            --zon-geel: #FED330;
            --dak-terracotta: #D04A3A;
            --creme-wit: #FAF8E7;
            --kozijn-geel: #FFF4C3;
            --white: #FFFFFF;
            --text-dark: var(--meander-groen);
            --text-medium: #2C3E2C;
            --border-radius-organic: 30px;
            --transition-smooth: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; font-size: 15px; }

        body {
            font-family: 'Quicksand', sans-serif;
            background-color: #f1f4eb; /* Zacht groen op de achtergrond voor buiten het middenkader */
            color: var(--text-medium);
            line-height: 1.7;
            overflow-x: hidden;
            padding-top: 100px;
        }

        .page-wrapper {
            max-width: 1000px;
            margin: 0 auto;
            background-color: var(--white);
            position: relative;
            box-shadow: 0 0 40px rgba(26, 83, 26, 0.05);
            min-height: 100vh;
        }

        /* Gekartelde randen (zig-zag SVG) aan de zijkant IN the page-wrapper */
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
        }

        .container { max-width: 100%; margin: 0 auto; padding: 0 50px; }

        img, .card, button, input, textarea, select {
            border-radius: var(--border-radius-organic);
        }

        /* Navigatie (Header) */
        header {
            position: fixed;
            top: 0; left: 0; width: 100%;
            padding: 15px 0;
            background-color: var(--white);
            box-shadow: 0 4px 15px rgba(26, 83, 26, 0.08); /* Zachte groene schaduw */
            transition: var(--transition-smooth);
            z-index: 1000;
        }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .logo-link { display: flex; align-items: center; text-decoration: none; }
        .logo-img { height: 125px; width: auto; border-radius: 0; }
        
        nav a {
            text-decoration: none;
            color: var(--text-dark);
            margin-left: 25px;
            font-weight: 600;
            font-size: 1.05rem;
            transition: var(--transition-smooth);
            position: relative;
        }
        nav a:hover { color: var(--heuvel-groen); }
        nav a::after {
            content: '';
            position: absolute; width: 8px; height: 8px; border-radius: 50%;
            bottom: -10px; left: 50%; transform: translateX(-50%) scale(0);
            background-color: var(--zon-geel); transition: var(--transition-smooth);
        }
        nav a:hover::after { transform: translateX(-50%) scale(1); }

        /* Knoppen */
        .btn {
            display: inline-block; background-color: var(--heuvel-groen); color: var(--white);
            text-decoration: none; padding: 16px 35px; border-radius: 50px; font-weight: 700;
            border: none; cursor: pointer; transition: var(--transition-smooth);
            box-shadow: 0 6px 20px rgba(124, 192, 64, 0.4);
        }
        .btn:hover {
            background-color: var(--meander-groen); transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(26, 83, 26, 0.5); color: var(--white);
        }
        .btn-outline {
            background-color: transparent; color: var(--meander-groen);
            border: 2px solid var(--meander-groen); box-shadow: none;
        }
        .btn-outline:hover { background-color: var(--meander-groen); color: var(--white); }
        .btn-yellow { background-color: var(--zon-geel); color: var(--meander-groen); box-shadow: 0 6px 20px rgba(254, 211, 48, 0.5); }
        .btn-yellow:hover { background-color: var(--dak-terracotta); color: var(--white); box-shadow: 0 10px 25px rgba(208, 74, 58, 0.5); }

        /* Animatie Classes voor Scroll */
        .fade-in { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
        .fade-in.visible { opacity: 1; transform: translateY(0); }
        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }

        /* HERO SECTIE */
        .hero {
            position: relative;
            min-height: 90vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            background-color: transparent;
            overflow: hidden;
        }
        .hero-bg-wrapper {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; overflow: hidden;
        }
        .hero-bg-image {
            width: 100%; height: 100%;
            background-image: url('ErveMeeander.jpg');
            background-size: cover; background-position: center bottom;
            transform: scale(1.0); opacity: 1; filter: brightness(0.9);
        }
        .hero-content {
            z-index: 2; max-width: 900px; padding: 40px; position: relative;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: var(--border-radius-organic);
            backdrop-filter: blur(8px);
            box-shadow: 0 15px 40px rgba(26, 83, 26, 0.1);
            border: 2px solid rgba(255,255,255,0.4);
        }
        .voorbereiding-label {
            display: inline-block; background-color: var(--zon-geel); color: var(--meander-groen);
            padding: 8px 20px; border-radius: 50px; font-weight: 700; font-size: 0.95rem; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;
        }
        .hero h1 { font-size: 3.8rem; color: var(--meander-groen); margin-bottom: 20px; text-shadow: 0 0 15px rgba(255,255,255,0.8); }
        .hero p { font-size: 1.35rem; color: var(--text-dark); margin-bottom: 35px; font-weight: 600; text-shadow: 0 0 15px rgba(255,255,255,0.8); }

        .shape-divider { position: absolute; bottom: 0; left: 0; right: 0; width: 100%; overflow: hidden; line-height: 0; transform: translateY(1px); z-index: 5; }
        .shape-divider svg { position: relative; display: block; width: calc(100% + 1.3px); height: 80px; }
        .shape-divider .shape-fill { fill: var(--white); }

        /* FILOSOFIE */
        .filosofie { background-color: transparent; padding: 100px 0; position: relative; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .filosofie-text h2 { font-size: 2.8rem; color: var(--meander-groen); }
        .highlight-blue { color: var(--rivier-blauw); }
        .organic-blob {
            position: relative; width: 100%; height: 500px; background: var(--kozijn-geel);
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            animation: waterMorph 12s ease-in-out infinite alternate;
            display: flex; align-items: center; justify-content: center; padding: 30px;
            border: 4px solid var(--heuvel-groen); overflow: hidden;
        }
        .blob-text { text-align: center; padding: 30px; z-index: 2; }
        .blob-text i { font-size: 4rem; color: var(--rivier-blauw); margin-bottom: 20px; }
        .blob-text h3 { color: var(--meander-groen); font-size: 1.8rem; }
        .blob-text p { color: var(--text-dark); font-weight: 600; }
        @keyframes waterMorph {
            0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
            100% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
        }

        /* WONEN & NABIJHEID */
        .nabijheid { padding: 100px 0; background-color: transparent; position: relative; text-align: center; }
        .nabijheid-content { max-width: 900px; margin: 0 auto; }
        .nabijheid h2 { font-size: 2.8rem; color: var(--meander-groen); }
        .icon-row { display: flex; justify-content: center; gap: 30px; margin: 40px 0; }
        .icon-item { display: flex; flex-direction: column; align-items: center; gap: 15px; width: 180px; }
        .icon-item i { font-size: 2.2rem; color: var(--white); background-color: var(--heuvel-groen); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: var(--transition-smooth); }
        .icon-item:hover i { background-color: var(--zon-geel); color: var(--meander-groen); transform: scale(1.1); }
        .icon-item span { font-weight: 700; color: var(--meander-groen); font-size: 1.05rem; }

        /* COMMUNITY GRID (PLANNEN) */
        .community { padding: 100px 0; background-color: transparent; position: relative; }
        .section-header { text-align: center; max-width: 800px; margin: 0 auto 60px auto; }
        .section-header h2 { font-size: 3rem; color: var(--meander-groen); }
        .plan-badge { background-color: var(--dak-terracotta); color: var(--white); padding: 5px 15px; border-radius: 20px; font-size: 0.9rem; font-weight: 700; display: inline-block; margin-bottom: 15px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .card { background-color: var(--white); padding: 40px 30px; border: 3px solid var(--white); box-shadow: 0 10px 30px rgba(124, 192, 64, 0.1); transition: var(--transition-smooth); display: flex; flex-direction: column; align-items: flex-start; }
        .card:hover { transform: translateY(-10px); border-color: var(--heuvel-groen); box-shadow: 0 15px 40px rgba(124, 192, 64, 0.2); }
        .card-icon { width: 70px; height: 70px; background-color: var(--creme-wit); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 25px; }
        .card-icon i { font-size: 1.8rem; color: var(--heuvel-groen); }
        .card:nth-child(2) .card-icon i { color: var(--rivier-blauw); }
        .card:nth-child(3) .card-icon i { color: var(--dak-terracotta); }
        .card h3 { font-size: 1.6rem; margin-bottom: 15px; }

        /* VRIENDEN VAN */
        .vrienden { padding: 120px 0; background-color: transparent; }
        .vrienden-box { background-color: var(--zon-geel); border-radius: var(--border-radius-organic); padding: 60px; text-align: center; max-width: 900px; margin: 0 auto; position: relative; box-shadow: 0 15px 35px rgba(254, 211, 48, 0.2); }
        .vrienden h2 { font-size: 2.8rem; color: var(--meander-groen); }
        .vrienden p.quote { font-size: 1.6rem; font-weight: 700; color: var(--dak-terracotta); margin: 25px 0; }
        .vrienden p.desc { font-size: 1.15rem; color: var(--text-dark); margin-bottom: 30px; font-weight: 500; }

        /* FOOTER & CONTACT FORM */
        footer { background-color: var(--meander-groen); color: var(--white); position: relative; padding-top: 100px; padding-bottom: 30px; border-top-left-radius: 60px; border-top-right-radius: 60px; z-index: 200; }
        .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
        .footer-info h2 { color: var(--zon-geel); font-size: 2.5rem; }
        .footer-info p { color: var(--creme-wit); font-size: 1.1rem; }
        .contact-card { background-color: var(--white); border-radius: var(--border-radius-organic); padding: 40px; color: var(--text-dark); }
        .contact-card h3 { font-size: 1.8rem; color: var(--meander-groen); margin-bottom: 25px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 700; color: var(--text-dark); font-size: 0.95rem; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 15px 20px; border: 2px solid var(--kozijn-geel); background-color: var(--white); font-family: inherit; font-size: 1rem; color: var(--text-dark); transition: var(--transition-smooth); }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--heuvel-groen); box-shadow: 0 0 0 3px rgba(124, 192, 64, 0.2); }
        .footer-bottom { grid-column: 1 / -1; text-align: center; margin-top: 60px; padding-top: 25px; border-top: 1px solid rgba(250, 248, 231, 0.2); }
        .footer-bottom p { font-size: 0.95rem; color: var(--kozijn-geel); margin: 0; }
        .initiator { display: inline-flex; align-items: center; gap: 10px; background-color: rgba(255, 255, 255, 0.1); padding: 8px 20px; border-radius: 50px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.2); }
        .initiator i { color: var(--zon-geel); }
        .initiator span { color: var(--creme-wit); font-weight: 700; }

        /* RESPONSIVE DESIGN */
        @media (max-width: 992px) {
            .hero h1 { font-size: 3.2rem; }
            .grid-2, .footer-grid { grid-template-columns: 1fr; gap: 40px; }
            .grid-3 { grid-template-columns: 1fr; }
            .hero-content { margin-top: 40px; }
            .organic-blob { height: 350px; }
        }

        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .hero p { font-size: 1.15rem; }
            header { padding: 10px 0; }
            nav { display: none; }
            .logo-img { height: 50px; }
            .section-header h2, .filosofie-text h2, .nabijheid h2 { font-size: 2.2rem; }
            .container { padding: 0 20px; }
        }"""
text = re.sub(r'<style>[\s\S]*?</style>', '<style>\n' + correct_css + '\n    </style>', text)

hero_html = """        <!-- Hero Sectie -->
        <section class="hero" id="home">
            <div class="hero-bg-wrapper">
                <div class="hero-bg-image"></div>
            </div>
            <div class="container hero-content fade-in">
                <span class="voorbereiding-label"><i class="fa-solid fa-person-digging"></i> In Voorbereiding</span>
                <h1>Erve Meander:<br> <span>Een Natuurlijk Thuis op het Zorg-erf</span></h1>
                <p>We bevinden ons momenteel vol trots en overgave in de <strong>uitgebreide voorbereidingsfase</strong>
                    van
                    ons initiatief in Hellendoorn. Achter de schermen wordt hard gewerkt aan de unieke samensmelting van
                    wonen, warme zorg, en de overweldigende natuur. Ontdek onze op handen zijnde plannen voor de
                    toekomst.
                </p>
                <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <a href="#plannen" class="btn">Bekijk de Plannen</a>
                    <a href="#contact" class="btn btn-outline">Blijf op de hoogte</a>
                </div>
            </div>"""

text = re.sub(r'        <!-- Hero Sectie -->[\s\S]*?            <!-- Zachte golf afscheiding -->', hero_html + '\n\n            <!-- Zachte golf afscheiding -->', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
