import json
nb = json.load(open('c:/Users/bnish/OneDrive/Desktop/Mini_project/notebooks/ai_teaching_assistant.ipynb'))
print(f'Cells: {len(nb["cells"])}')
for i, c in enumerate(nb['cells']):
    first = c['source'][0][:70].strip() if c['source'] else 'empty'
    print(f'  [{i+1}] {c["cell_type"]:8s} | {first}')
