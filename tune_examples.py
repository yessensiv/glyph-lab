from pathlib import Path
import re
root = Path(__file__).parent
path = root / 'dist/index.html'
html = path.read_text(encoding='utf-8')
needle = '<label class="dither-label">'
assert html.count(needle) == 1
html = html.replace(needle, '''<div><div class="label-row"><label for="ink-lift" data-ru="Яркость цветных знаков">Color ink lift</label><output for="ink-lift" id="ink-lift-value">30</output></div><input id="ink-lift" type="range" min="0" max="100" value="30"><p class="ink-hint" data-ru="Делает цветные символы заметнее на чёрном фоне.">Brighter colored characters on black.</p></div>''' + needle)
for id, cols in [('film-frame',180),('digital-muses',150),('night-bloom',150),('listening-room',200)]:
    html = re.sub(rf'(data-art="{id}" data-width=")\d+', rf'\g<1>{cols}', html)
for old,new in [('> 01 / CINEMA / 220 COL','> 01 / CINEMA / 180 COL'),('> 02 / REMIX / 220 COL','> 02 / REMIX / 150 COL'),('> 03 / PORTRAIT / 180 COL','> 03 / PORTRAIT / 150 COL'),('> 04 / PHOTOGRAPHY / 220 COL','> 04 / PHOTOGRAPHY / 200 COL')]:
    assert old in html
    html = html.replace(old,new)
html = html.replace('data-output="marble-break" data-width="80"', 'data-output="marble-break" data-width="80" data-style="simple" data-ink-lift="0"')
html = html.replace('data-output="listening-room" data-width="56"', 'data-output="orbit" data-width="56" data-style="simple"')
html = html.replace('aria-label="Listening room converted to compact monochrome ASCII"', 'aria-label="An orbital loop rendered as 56-column monochrome ASCII"')
html = html.replace('data-recipe="chat" data-load="listening-room"', 'data-recipe="chat" data-load="orbit"')
html = html.replace('data-ru="Целая сцена. Несколько строк.">An entire scene. A few lines.', 'data-ru="Простая форма. Узнаваемый знак.">A simple shape. A clear signature.')
html = html.replace('data-ru="Сохраните настроение фотографии в компактном монохромном результате. Для мелких деталей лучше использовать PNG.">Keep a photograph\'s atmosphere in a compact monochrome study. Export PNG when fine details matter more than copyable text.', 'data-ru="Чёткий орбитальный узел остаётся узнаваемым даже при 56 столбцах. Геометрия подходит для текста лучше сложной фотографии.">A sculptural loop stays recognizable at just 56 columns. Clear geometry works better than a busy photograph at this scale.')
start = html.index('<article class="destination-feature">')
end = html.index('</section>', start)
region = html[start:end].replace('<span>Detailed</span>', '<span>Simple</span>').replace('<span>Dense</span>', '<span>Simple</span>')
html = html[:start] + region + html[end:]
path.write_text(html,encoding='utf-8')
print('Updated tuned example metadata and compact orbital study.')
