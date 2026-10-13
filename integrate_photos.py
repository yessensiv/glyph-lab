from pathlib import Path
import re

root = Path(__file__).parent
path = root / 'dist/index.html'
html = path.read_text(encoding='utf-8')

mapping = {'shell': 'marble-break', 'terrain': 'film-frame', 'arch': 'digital-muses', 'orbit': 'listening-room'}
for old, new in mapping.items():
    html = html.replace(f'assets/{old}.webp', f'assets/{new}.png')
    for attr in ['data-art', 'data-load', 'data-output']:
        html = html.replace(f'{attr}="{old}"', f'{attr}="{new}"')

html = html.replace('font-size="143" font-weight="500"', 'font-size="143" font-weight="600"')
html = html.replace('id="letter-texture" width="8" height="6"', 'id="letter-texture" width="7.7" height="5.6"')
html = html.replace('y="4.5" fill="#ededef" font-size="4.5"', 'y="4.6" fill="#ededef" font-size="4.8"')
html = html.replace('data-art="marble-break" data-width="160"', 'data-art="marble-break" data-width="180"')
html = html.replace('alt="Original procedural spiral shell sculpture" width="900" height="900"', 'alt="Marble statue with sunglasses against a violet background" width="675" height="1200"')
html = html.replace('aria-label="Spiral shell rendered as colored ASCII characters"', 'aria-label="Marble portrait converted to colored ASCII characters"')
html = html.replace('160 columns · Sculpted', '180 columns · Sculpted')
html = html.replace('data-ru="Раковина ↗">Spiral study ↗', 'data-ru="Мрамор ↗">Marble portrait ↗')
html = html.replace('data-ru="Рельеф ↗">Try terrain ↗', 'data-ru="Кинокадр ↗">Try a film frame ↗')
html = html.replace('> SAMPLE LOADED / spiral-study.webp / processed locally', '> SAMPLE LOADED / marble-break.png / processed locally')
html = html.replace('01 / Spiral study', '01 / Marble, off duty')
html = html.replace('alt="Selected image before conversion" width="900" height="900"', 'alt="Selected image before conversion" width="675" height="1200"')
html = html.replace('data-ru="/ ЧЕТЫРЕ ОРИГИНАЛА. БЕСКОНЕЧНЫЕ ВАРИАЦИИ.">/ FOUR ORIGINALS. ENDLESS INTERPRETATIONS.', 'data-ru="/ ПЯТЬ ОБРАЗОВ. НОВЫЕ ИНТЕРПРЕТАЦИИ.">/ FIVE IMAGES. NEW INTERPRETATIONS.')

cards = [
    ('film-frame', 220, 'CINEMA', 'Two perspectives.', 'Два взгляда.',
     'Sharp silhouettes. A scene rebuilt in characters.', 'Чёткие силуэты. Сцена, собранная заново из символов.',
     'Two suited figures against a blue background', 736, 1308, '50% 28%'),
    ('digital-muses', 220, 'REMIX', 'Classics, remixed.', 'Классика в ремиксе.',
     'Marble meets neon. Every detail finds a new alphabet.', 'Мрамор встречает неон. Каждая деталь обретает новый алфавит.',
     'Two seated marble figures with neon glasses and a laptop', 736, 1313, '50% 48%'),
    ('night-bloom', 180, 'PORTRAIT', 'After dark.', 'После заката.',
     'A floral silhouette. A red field. A different kind of portrait.', 'Цветочный силуэт. Красный фон. Другой взгляд на портрет.',
     'A monochrome floral portrait against a deep red background', 736, 1308, '50% 86%'),
    ('listening-room', 220, 'PHOTOGRAPHY', 'Analog ritual.', 'Аналоговый ритуал.',
     'A listening room, translated line by line.', 'Комната для музыки, переведённая строка за строкой.',
     'A man in a transparent coat beside shelves of audio equipment', 736, 1307, '50% 52%'),
]
card_markup = []
for index, (id, cols, kind, title, title_ru, description, description_ru, alt, w, h, focus) in enumerate(cards, 1):
    card_markup.append(f'''        <article class="art-card">
          <div class="compare" data-art="{id}" data-width="{cols}" data-color="true" style="--image-focus:{focus}">
            <img src="assets/{id}.png" alt="{alt}" width="{w}" height="{h}" loading="lazy">
            <div class="ascii-layer"><canvas aria-label="{title.rstrip('.')} as colored ASCII art"></canvas></div>
            <span class="corner original" data-ru="Оригинал">Original</span><span class="corner converted">ASCII</span>
            <div class="divider"><span>‹ ›</span></div><input class="compare-range" type="range" min="0" max="100" value="50" aria-label="Compare {id} image and ASCII art">
          </div>
          <div class="card-copy"><p class="tiny">> {index:02} / {kind} / {cols} COL</p><h3 data-ru="{title_ru}">{title}</h3><p data-ru="{description_ru}">{description}</p><button class="text-link" data-load="{id}" data-ru="Попробовать этот образец ↗">Try this artwork ↗</button></div>
        </article>''')
gallery = '<div class="gallery">\n' + '\n'.join(card_markup) + '''
      </div><p class="footnote" data-ru="Изображения предоставлены для этого проекта. ASCII-превью созданы этой студией из исходных файлов.">Images supplied for this project. Actual ASCII previews, converted from the source files in this studio.</p>'''
html, count = re.subn(r'<div class="gallery">.*?</div><p class="footnote"[^>]*>Original mathematical artworks\..*?</p>', gallery, html, flags=re.S)
assert count == 1, 'Gallery boundary did not match.'

# Editorial output uses the dramatic portrait; the smaller studies remain monochrome.
html = html.replace('data-output="marble-break" data-width="130"', 'data-output="night-bloom" data-width="130"')
html = html.replace('data-recipe="editorial" data-load="marble-break"', 'data-recipe="editorial" data-load="night-bloom"')
html = html.replace('aria-label="Actual colored ASCII shell output"', 'aria-label="Actual colored ASCII floral portrait"')
html = html.replace('data-output="digital-muses" data-width="66"', 'data-output="marble-break" data-width="80"')
html = html.replace('> README MARK / 66 COL', '> TEXT PORTRAIT / 80 COL')
html = html.replace('aria-label="ASCII arch for a README"', 'aria-label="Monochrome ASCII marble portrait"')
html = html.replace('data-recipe="readme" data-load="digital-muses"', 'data-recipe="readme" data-load="marble-break"')
html = html.replace('data-ru="Пусть ваш проект узнают.">A signature for your repository.', 'data-ru="Портрет в обычном тексте.">A portrait in plain text.')
html = html.replace('data-ru="Простая форма придаёт README характер. Используйте блок кода, чтобы сохранить пробелы.">A simple shape gives your README a little character. Use a fenced code block to keep the spaces intact.', 'data-ru="Превратите портрет в текстовую миниатюру. Блок кода сохранит пробелы и пропорции в README.">Turn a portrait into a text-sized study. A fenced code block keeps its spacing and proportions in a README.')
html = html.replace('data-ru="Создать знак ↗">Create a project mark ↗', 'data-ru="Создать текстовый портрет ↗">Create a text portrait ↗')
html = html.replace('aria-label="Compact orbital ASCII artwork"', 'aria-label="Listening room converted to compact monochrome ASCII"')
html = html.replace('data-ru="Больше характера в общении.">Put a little art in the conversation.', 'data-ru="Целая сцена. Несколько строк.">An entire scene. A few lines.')
html = html.replace('data-ru="Небольшие узоры для приветствий, сообщений и подписей. Проверьте переносы строк на телефоне.">Compact patterns for welcome messages, posts, and signatures. Check for line wrapping on a phone before you share.', 'data-ru="Сохраните настроение фотографии в компактном монохромном результате. Для мелких деталей лучше использовать PNG.">Keep a photograph\'s atmosphere in a compact monochrome study. Export PNG when fine details matter more than copyable text.')
path.write_text(html, encoding='utf-8')
print('Integrated all five supplied images and updated gallery copy.')
