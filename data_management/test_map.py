import csv
import json

with open('./data/cartodb_id_map_age_distribution_id_bundesamt.json') as id_map_file:
    id_map = json.load(id_map_file)
    with open('./data/landkreise_deutschland_vereinfacht.geojson', encoding='utf-8') as geojson_file:
        with open('./data/region_population.json') as population_file:
            population_file = json.load(population_file)
            geo_json = json.load(geojson_file)

            # init new dict
            age_population_dict = {}
            for age_file in ['Bevölkerung_0-17.csv', 'Bevölkerung_18-24.csv', 'Bevölkerung_25-44.csv',
                             'Bevölkerung_45-64.csv', 'Bevölkerung_65-100.csv']:
                age_range = age_file[12:-4]
                age_population_dict[age_range] = {}

            # compute values
            for feature in geo_json['features']:
                cartodb_id = feature['properties']['cartodb_id']
                bund_id = id_map[str(cartodb_id)]
                for age_file in ['Bevölkerung_0-17.csv', 'Bevölkerung_18-24.csv', 'Bevölkerung_25-44.csv','Bevölkerung_45-64.csv','Bevölkerung_65-100.csv']:
                    age_range = age_file[12:-4]

                    with open('./data/age_distribution/' + age_file, encoding='utf-8') as bevoelkerungsdaten:
                        spamreader = csv.reader(bevoelkerungsdaten, delimiter=';')
                        rows = []
                        for row in spamreader:
                            rows += [row]
                        rows = rows[1:]
                        for row in rows:
                            if row[0] == bund_id:
                                age_population_dict[age_range][cartodb_id] = int(round(population_file[str(cartodb_id)]['population'] * float(row[2])))

print(age_population_dict)

with open('./data/region_population_age.json', 'w') as outfile:
    json.dump(age_population_dict, outfile)