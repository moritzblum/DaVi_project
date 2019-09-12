import json
import os

files = os.listdir('./')
all = []
for file in files:
    if file.startswith('restaurant') and file.endswith('.json'):
        with open(file) as input:
            j = json.load(input)
            for feature in j['features']:
                all.append(feature)

with open('restaurant.json', 'w') as out:
    json.dump({'features': all}, out)
print(len(all))


