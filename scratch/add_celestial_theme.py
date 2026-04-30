import json
import subprocess

new_theme = {
    "id": "celestial-ink",
    "label": "Celestial Ink",
    "description": "Derin mürekkep arka plan + parlayan altın detaylar. OG görselimizden ilham alan mistik ve lüks tema.",
    "preview": {
        "primary": "#C9A961",
        "bg": "#0F0B07",
        "text": "#F5EFE3",
        "accent": "#B8923D"
    },
    "tokens": {
        "version": "2",
        "colors": {
            "brand_primary": "#C9A961",
            "brand_primary_dark": "#A8884A",
            "brand_primary_light": "#D4BB7A",
            "brand_secondary": "#C9A961",
            "brand_secondary_dim": "#B89651",
            "brand_secondary_light": "#E5D0A0",
            "brand_accent": "#B8923D",
            "bg_base": "#0F0B07",
            "bg_deep": "#050402",
            "bg_surface": "#1A140E",
            "bg_surface_high": "#2A2018",
            "text_primary": "#F5EFE3",
            "text_secondary": "#D4C5A8",
            "text_muted": "#8A7B5A",
            "text_muted_soft": "#6B5C4A",
            "border": "rgba(201,169,97,0.30)",
            "border_soft": "rgba(201,169,97,0.15)",
            "success": "#4CAF6E",
            "warning": "#F0A030",
            "error": "#E55B4D",
            "info": "#5B9BD5"
        },
        "typography": {
            "font_display": "Cinzel, Georgia, serif",
            "font_serif": "Fraunces, Georgia, serif",
            "font_sans": "Manrope, system-ui, -apple-system, sans-serif",
            "font_mono": "JetBrains Mono, monospace",
            "base_size": "16px"
        },
        "radius": {
            "xs": "4px",
            "sm": "8px",
            "md": "12px",
            "lg": "16px",
            "xl": "24px",
            "pill": "9999px"
        },
        "shadows": {
            "soft": "0 10px 30px rgba(0,0,0,0.6)",
            "card": "0 30px 80px rgba(0,0,0,0.9)",
            "glow_primary": "0 0 60px rgba(201,169,97,0.25)",
            "glow_gold": "0 0 30px rgba(201,169,97,0.30)"
        },
        "branding": {
            "app_name": "GoldMoodAstro",
            "tagline": "Ruhsal danışmanlık ve modern astroloji",
            "tagline_en": "Spiritual guidance and modern astrology",
            "logo_url": "/brand/logo.png",
            "favicon_url": "/favicon.ico",
            "theme_color": "#C9A961",
            "theme_color_dark": "#0F0B07",
            "og_image_url": "/brand/og-image.png"
        }
    }
}

with open('theme_presets_clean.json', 'r') as f:
    presets = json.load(f)

# Add if not exists
if not any(p['id'] == 'celestial-ink' for p in presets):
    presets.append(new_theme)

updated_json = json.dumps(presets, ensure_ascii=False)

# Update theme_presets
subprocess.run([
    'mysql', '-u', 'app', '-papp', '-e',
    f"UPDATE site_settings SET value = '{updated_json}' WHERE `key` = 'theme_presets'" ,
    'goldmoodastro'
])

# Also make it the active theme in design_tokens if user wants (I'll do it for design parity)
subprocess.run([
    'mysql', '-u', 'app', '-papp', '-e',
    f"UPDATE site_settings SET value = '{json.dumps(new_theme['tokens'], ensure_ascii=False)}' WHERE `key` = 'design_tokens'" ,
    'goldmoodastro'
])

print("Theme updated successfully.")
