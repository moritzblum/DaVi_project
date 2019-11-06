import json

d = {}

with open('data/landkreise_deutschland_vereinfacht.geojson', encoding='utf-8') as geojson:
        geo_dict = json.load(geojson)
        for feature in geo_dict['features']:
            if feature['properties']['cartodb_id'] not in d.keys():
                d[feature['properties']['cartodb_id']] = feature['properties']['gen']

with open('data/id_to_landkreis.json', 'w') as out:
    json.dump(d, out)