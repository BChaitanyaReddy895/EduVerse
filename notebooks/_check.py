import json

try:
    with open('notebooks/ai_teaching_assistant.ipynb', 'r', encoding='utf-8') as f:
        nb = json.load(f)
    print(f'Total cells: {len(nb.get("cells", []))}')
    for idx, cell in enumerate(nb['cells']):
        source = "".join(cell.get('source', []))
        if cell['cell_type'] == 'code' and '=== Results ===' in source:
            print(f'--- Output of Evaluation Cell {idx+1} ---')
            for out in cell.get('outputs', []):
                if 'text' in out:
                    print(''.join(out['text']))
                elif 'data' in out and 'text/plain' in out['data']:
                    print(''.join(out['data']['text/plain']))
except Exception as e:
    print(f'Error: {e}')
