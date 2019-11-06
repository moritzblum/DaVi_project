import json

id_population_map = {}

with open('data/landkreise_deutschland_vereinfacht.geojson', encoding="utf-8") as json_input:
    geojson = json.load(json_input)
    features = geojson['features']
    for feature in features:
        properties = feature['properties']
        population_dict = json.loads(properties['destatis'])
        id = properties['cartodb_id']
        id_population_map[id] = {'population': population_dict['population'],
                                 'population_m': population_dict['population_m'],
                                 'population_w': population_dict['population_w']}

with open('data/region_population.json', 'w') as file:
    json.dump(id_population_map,file)




