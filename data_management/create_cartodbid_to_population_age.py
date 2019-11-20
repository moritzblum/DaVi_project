import csv
import json

with open('./data/cartodb_id_map_age_distribution_id_bundesamt.json', encoding='utf-8') as id_map_json:
    id_map = json.load(id_map_json)
    cartodb_ids = id_map.keys()
    pop_ids = [id_map[cartodb_id] for cartodb_id in cartodb_ids]
    newDic = {}
    for cartodb_id in cartodb_ids:
        newDic[id_map[cartodb_id]] = cartodb_id

    age_dic = {}

    with open('./data/region_population.json') as population_file:
        population_file = json.load(population_file)

    for bevoelkerungsfile in ['Bevölkerung_0-17.csv', 'Bevölkerung_18-24.csv','Bevölkerung_25-44.csv','Bevölkerung_45-64.csv','Bevölkerung_65-100.csv']:
        age_dic[bevoelkerungsfile] = {}
        with open('./data/age_distribution/' + bevoelkerungsfile, encoding='utf-8') as bevoelkerungsdaten:
            spamreader = csv.reader(bevoelkerungsdaten, delimiter=';')
            rows = []
            for row in spamreader:
                rows += [row]
            rows = rows[1:]
            for row in rows:
                print(row)
                age_dic[bevoelkerungsfile][newDic[row[0]]] = int(round(float(row[2]) * population_file[newDic[row[0]]]["population"]))


    with open('./data/region_population_age.json', 'w') as outfile:
        json.dump(age_dic, outfile)




