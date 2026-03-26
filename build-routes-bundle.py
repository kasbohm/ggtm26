#!/usr/bin/env python3
# Generer routes-bundle.js med alle GPX-filer innebygd som strenger.
# Kjør med: python3 build-routes-bundle.py
# Deretter åpne index.html direkte i nettleseren uten web server.

import os, json

routes_dir = os.path.join(os.path.dirname(__file__), 'routes')
out_file = os.path.join(os.path.dirname(__file__), 'routes-bundle.js')

files = sorted(f for f in os.listdir(routes_dir) if f.endswith('.gpx'))

with open(out_file, 'w', encoding='utf-8') as out:
    out.write('// Auto-generert av build-routes-bundle.py — ikke rediger manuelt\n')
    out.write('// Oppdater ved å kjøre: python3 build-routes-bundle.py\n')
    out.write('window.bundledRouteData = {\n')
    for i, f in enumerate(files):
        with open(os.path.join(routes_dir, f), 'r', encoding='utf-8') as gpx:
            content = gpx.read()
        comma = ',' if i < len(files) - 1 else ''
        out.write(f'  {json.dumps(f)}: {json.dumps(content)}{comma}\n')
    out.write('};\n')

size_kb = os.path.getsize(out_file) // 1024
print(f'Skrev {len(files)} GPX-filer til routes-bundle.js ({size_kb} KB)')
