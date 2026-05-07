import json
import urllib.request

import os
token = os.environ.get("FIGMA_TOKEN", "")
file_key = "ZVtFJtBsJk6BsUm4M7K8Nq"

def fetch(url):
    req = urllib.request.Request(url, headers={'X-Figma-Token': token})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

# Get file document
print("Fetching file structure...")
data = fetch(f"https://api.figma.com/v1/files/{file_key}")
doc = data['document']

print("=" * 70)
print("PAGES")
print("=" * 70)
for page in doc['children']:
    child_count = len(page.get('children', []))
    print(f"ID: {page['id']} | Name: {page['name']} | Type: {page['type']} | Children: {child_count}")

print()
print("=" * 70)
print("COMPONENTS AND COMPONENT SETS")
print("=" * 70)

def explore_node(node, page_name, results):
    node_type = node.get('type', 'UNKNOWN')
    if node_type in ('COMPONENT_SET', 'COMPONENT'):
        results.append({
            'id': node['id'],
            'name': node['name'],
            'type': node_type,
            'page': page_name,
            'variantCount': len(node.get('children', [])) if node_type == 'COMPONENT_SET' else 1
        })
    for child in node.get('children', []):
        explore_node(child, page_name, results)

all_components = []
for page in doc['children']:
    explore_node(page, page['name'], all_components)

component_sets = [c for c in all_components if c['type'] == 'COMPONENT_SET']
standalone_components = [c for c in all_components if c['type'] == 'COMPONENT']

print(f"\nComponent Sets ({len(component_sets)}):")
for cs in sorted(component_sets, key=lambda x: x['name']):
    print(f"  [{cs['page']}] {cs['name']} - {cs['variantCount']} variants (ID: {cs['id']})")

print(f"\nStandalone Components ({len(standalone_components)}):")
for c in sorted(standalone_components, key=lambda x: x['name'])[:100]:
    print(f"  [{c['page']}] {c['name']} (ID: {c['id']})")
if len(standalone_components) > 100:
    print(f"  ... and {len(standalone_components) - 100} more")

# Get variables
print()
print("=" * 70)
print("VARIABLE COLLECTIONS")
print("=" * 70)
try:
    vars_data = fetch(f"https://api.figma.com/v1/files/{file_key}/variables/local")
    collections = vars_data.get('variableCollections', [])
    print(f"Found {len(collections)} variable collection(s)")
    for vc in collections:
        print(f"\n  Collection: {vc['name']} (ID: {vc['id']})")
        print(f"    Modes: {[m['name'] for m in vc.get('modes', [])]}")
        variables = vc.get('variables', [])
        print(f"    Variables ({len(variables)}):")
        for v in variables[:30]:
            resolved = v.get('resolvedType', 'unknown')
            print(f"      - {v['name']} ({resolved}, ID: {v['id']})")
        if len(variables) > 30:
            print(f"      ... and {len(variables) - 30} more")
except Exception as e:
    print(f"Could not fetch variables: {e}")

print()
print("=" * 70)
print("TOP-LEVEL NODES PER PAGE")
print("=" * 70)
for page in doc['children']:
    print(f"\nPage: {page['name']}")
    for node in page.get('children', []):
        node_type = node.get('type', 'UNKNOWN')
        node_name = node.get('name', 'unnamed')
        child_count = len(node.get('children', []))
        print(f"  - {node_name} ({node_type}, children: {child_count})")