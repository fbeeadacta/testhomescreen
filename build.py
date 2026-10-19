#!/usr/bin/env python3
"""Genera casa-3d.html (file singolo, funziona anche da file://) unendo template, three.js e src/app.js.
Uso: python3 build.py <cartella con three@0.147.0 estratto (package/)>"""
import sys, pathlib
root = pathlib.Path(__file__).parent
vendor = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'vendor' / 'package'
three = (vendor / 'build' / 'three.min.js').read_text()
orbit = (vendor / 'examples' / 'js' / 'controls' / 'OrbitControls.js').read_text()
app = (root / 'src' / 'app.js').read_text()
html = (root / 'src' / 'template.html').read_text()
for tag, code in (('/*THREE*/', three), ('/*ORBIT*/', orbit), ('/*APP*/', app)):
    html = html.replace(tag, code.replace('</script', '<\\/script'))
(root / 'casa-3d.html').write_text(html)
print('casa-3d.html', len(html) // 1024, 'KB')
