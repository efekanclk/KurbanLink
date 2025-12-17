import re
from collections import defaultdict


# style.css dosyasını oku
with open("/Users/enesdasci/Downloads/SELİM SON kopyası/project/static/css/style.css", "r", encoding="utf-8") as f:
    css = f.read()

# Tüm CSS bloklarını yakala
pattern = r"([.#]?[a-zA-Z0-9_-]+\s*\{[^}]*\})"
blocks = re.findall(pattern, css, re.DOTALL)

# Selector'a göre tüm property'leri birleştir
merged_blocks = defaultdict(dict)

for block in blocks:
    selector, body = block.split("{", 1)
    selector = selector.strip()
    body = body.strip("} \n")

    for line in body.split(";"):
        if ":" in line:
            prop, val = line.split(":", 1)
            merged_blocks[selector][prop.strip()] = val.strip()

# Birleştirilmiş CSS'i oluştur
final_css = ""
for selector, props in merged_blocks.items():
    final_css += f"{selector} {{\n"
    for prop, val in props.items():
        final_css += f"  {prop}: {val};\n"
    final_css += "}\n\n"

# Yeni dosyaya yaz
with open("/Users/enesdasci/Downloads/SELİM SON kopyası/project/static/css/style_temizlendi.css", "w", encoding="utf-8") as f:
    f.write(final_css)

print("[✓] Birleştirme ve temizlik tamamlandı → style_cleaned_merged.css")

