"""Read the Courses worksheet as JSON using Python's standard library only.

Cells are data only: formulas and external links are never executed.
"""
import json
import posixpath
import re
import sys
from zipfile import ZipFile
from xml.etree import ElementTree as ET

NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def read_courses(path):
    with ZipFile(path) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            strings = [''.join(item.itertext()) for item in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        workbook = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = workbook.find('s:sheets', NS)
        sheet = next((s for s in sheets if s.get('name') == 'Courses'), None)
        if sheet is None:
            raise ValueError('Workbook must contain a Courses worksheet')
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        target = next(r.get('Target') for r in rels if r.get('Id') == sheet.get('{%s}id' % REL))
        sheet_path = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
        rows = []
        for row in ET.fromstring(z.read(sheet_path)).findall('s:sheetData/s:row', NS):
            values = {}
            for cell in row:
                col = re.match(r'[A-Z]+', cell.get('r')).group()
                if cell.find('s:f', NS) is not None:
                    raise ValueError('Formula cells are not accepted for course imports')
                value = cell.find('s:v', NS)
                if cell.get('t') == 's':
                    value = strings[int(value.text)] if value is not None else None
                elif cell.get('t') == 'inlineStr':
                    value = ''.join(cell.find('s:is', NS).itertext())
                else:
                    value = value.text if value is not None else None
                values[col] = value
            if any(v is not None for v in values.values()):
                rows.append(values)
        headers = rows[0]
        required = {'Course ID', 'Course Name', 'Institution', 'Course URL'}
        if not required.issubset(set(headers.values())):
            raise ValueError('Missing required TVET workbook headers')
        return [{header: row.get(col) for col, header in headers.items() if header} for row in rows[1:]]


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(read_courses(sys.argv[1]), ensure_ascii=False))
