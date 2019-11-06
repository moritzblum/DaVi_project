import json

num_atms = 0
key_list_without_restriction = []
key_list_restricted = []

with open('../data/atm.json') as i:
    j = json.load(i)
    new_dict = {}
    features = j['features']

    new_list = []
    for feature in features:

        lat = feature['geometry']['coordinates'][1]
        lon = feature['geometry']['coordinates'][0]
        if 46 <= lat <= 58 and 3 <= lon <= 16:
            num_atms += 1
            r = {}
            r['id'] = feature['id']
            r['lat'] = lat

            r['lon'] = lon
            for k in feature['properties'].keys():
                if k not in key_list_without_restriction:
                    key_list_without_restriction.append(k)
                if k in ['wheelchair', 'brand', 'opening_hours', 'operator', 'website', 'layer', 'surveillance',
                         'level', 'fee', 'brand:wikidata', 'description', 'contact:email', 'contact:facebook',
                         'contact:twitter', 'contact:youtube', 'operator:wikidata', 'wikidata', 'wikipedia', 'branch',
                         'note:url', 'url', 'note:url', 'url', 'brand:wikipedia', 'official_name', 'number',
                         'addr:floor', 'indoor:level', 'operator:wikipedia', 'opening_hours:atm', 'network:wikipedia',
                         'atm: operator'] or k.startswith('name') or k.startswith('operator') or k.startswith(
                    'currency:'):
                    r[k] = feature['properties'][k]
                    if k not in key_list_restricted:
                        key_list_restricted.append(k)
            new_list.append(r)
new_dict['atm'] = new_list

with open('../data/atm_filtered.json', 'w') as o:
    json.dump(new_dict, o)

print('Number of ATMs: ' + str(num_atms))
print('Number of Key without restriction: ' + str(len(key_list_without_restriction)))
print('Number of Key without restriction: ' + str(len(key_list_restricted)))

