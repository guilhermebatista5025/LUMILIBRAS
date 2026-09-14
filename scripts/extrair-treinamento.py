"""Extrai questões e imagens originais, sem redesenhar os sinais do PDF.

Uso: py scripts/extrair-treinamento.py [--biblioteca CAMINHO_PYPDF]
"""
import argparse
import json
import re
import sys
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--biblioteca')
args = parser.parse_args()
if args.biblioteca:
    sys.path.insert(0, args.biblioteca)
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
source = root / 'dist/Treinamento_Libras_no_Contexto_da_Saude.pdf'
if not source.exists():
    source = root / 'public/Treinamento_Libras_no_Contexto_da_Saude.pdf'
reader = PdfReader(source)
texts = [page.extract_text() for page in reader.pages]
answers = {}
for text in texts:
    if '\nGABARITO\n' in text:
        for number, letter, ref, name in re.findall(r'(\d{3}) • ([ABCD])\n(\d+\.\d+)  ([^\n]+)', text):
            answers[int(number)] = (letter, ref, name)
assert len(answers) == 139, f'Gabarito incompleto: {len(answers)}'

units = []
questions = []
image_data = []
for page_number, (page, text) in enumerate(zip(reader.pages, texts), 1):
    unit_match = re.search(r'\nUNIDADE (\d+)\n', text)
    if unit_match:
        objective = re.search(r'\nObjetivo\n(.*?)\nConteúdos avaliados', text, re.S).group(1)
        units.append({'id': int(unit_match[1]), 'objetivo': objective.replace('\n', ' '), 'pagina': page_number})
    blocks = re.findall(r'QUESTÃO (\d+)\nReferência (\d+\.\d+)\nQual termo corresponde ao sinal apresentado\?\n(.*?)(?=QUESTÃO |\Z)', text, re.S)
    if not blocks:
        continue
    # A ordem de desenho do PDF é a ordem visual das questões, de cima para baixo.
    names = [str(operands[0]) for operands, operator in page.get_contents().operations if operator == b'Do']
    assert len(names) == len(blocks), f'Imagens/questões incompatíveis na página {page_number}'
    for (number, ref, block), image_name in zip(blocks, names):
        number = int(number)
        choices = re.findall(r'(?:^|\n)([ABCD])\n(.*?)(?=\n[ABCD]\n|\Z)', block.strip(), re.S)
        assert len(choices) == 4, f'Alternativas incompletas: {number}'
        letter, answer_ref, term = answers[number]
        assert answer_ref == ref
        options = [name.replace('\n', ' ').strip() for _, name in choices]
        assert options['ABCD'.index(letter)] == term, f'Gabarito divergente: {number}'
        original = page.images[image_name]
        filename = f'sinal-{number:03d}{Path(original.name).suffix}'
        image_data.append((filename, original.data))
        questions.append({'id': number, 'referencia': ref, 'unidade': int(ref.split('.')[0]), 'termo': term,
                          'imagem': f'/treinamento/sinais/{filename}', 'alternativas': options,
                          'correta': 'ABCD'.index(letter), 'pagina': page_number})

assert len(units) == 13 and len(questions) == 139
assert [q['id'] for q in questions] == list(range(1, 140))
output = root / 'public/treinamento/sinais'
output.mkdir(parents=True, exist_ok=True)
for filename, data in image_data:
    (output / filename).write_bytes(data)
catalog = {'fonte': 'Treinamento_Libras_no_Contexto_da_Saude.pdf', 'aprovacao': 80, 'unidades': units, 'questoes': questions}
(root / 'src/data/treinamento-saude.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(units)} unidades, {len(questions)} questões, {len(image_data)} imagens originais; todos os gabaritos conferidos.')
