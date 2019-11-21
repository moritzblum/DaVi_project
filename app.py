import json
import sqlite3
import numpy as np

from flask import Flask, render_template, request, jsonify

# create the application object
from scipy.stats import stats

app = Flask(__name__)


def tuple_list_to_geojson(list_of_tuples):
    list_of_features = []
    for row in list_of_tuples:
        id = row[0]
        operator = row[1]
        lat = row[2]
        lon = row[3]
        landkreis_id = row[13]
        wheelchair = row[4]
        if wheelchair != 'yes' and wheelchair != 'no':
            wheelchair = 'unknown'
        list_of_features.append({
            'type': "Feature",
            'geometry': {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                'id': id,
                'operator': operator,
                'landkreis_id': landkreis_id,
                'wheelchair': wheelchair,
                'c': 1
            }
        })
    return {"type": "FeatureCollection", 'features': list_of_features}


def query_database(filter_dict):
    """
    Database access from simple json filter.
    :param filter_dict: Dictionary specifying the filter properties entered by the user
    :return: GEOJSON containing the ATM locations as points with the operator and wheelchair accessibility as properties
    """
    include = filter_dict['operator']['include']
    exclude = filter_dict['operator']['exclude']
    others = filter_dict['operator']['others']
    wheelchair_yes = filter_dict['wheelchair']['yes']
    wheelchair_no = filter_dict['wheelchair']['no']
    wheelchair_others = filter_dict['wheelchair']['others']

    # request for database entries fulfilling the request
    conn = sqlite3.connect('data/atm.db')
    c = conn.cursor()
    sql_query = "SELECT * FROM FILTERED"
    response = []  # as default assume no checkbox is selected => no data requested
    if others:
        # get all operators, except all in exclude
        if exclude:
            sql_query += " WHERE"
            for operator in exclude:
                if exclude.index(operator) != 0:
                    sql_query += " and "
                sql_query += " NOT OPERATOR= \"" + operator + "\" COLLATE NOCASE"
        sql_query += ';'
        print('SQL query to filter operators: ' + sql_query)
        c.execute(sql_query)
        response = c.fetchall()
    else:
        if include:
            sql_query += " WHERE"
            # query database for entries where the bank is requested in include
            for operator in include:
                if include.index(operator) != 0:
                    sql_query += " or "
                sql_query += " OPERATOR= \"" + operator + "\" COLLATE NOCASE"
            sql_query += ';'
            print('SQL query to filter operators: ' + sql_query)
            c.execute(sql_query)
            response = c.fetchall()
    response_filtered = response.copy()

    # filter by wheelchair accessibility
    for row in response:
        if row[4] == 'yes' and not wheelchair_yes:
            response_filtered.remove(row)
        if row[4] == 'no' and not wheelchair_no:
            response_filtered.remove(row)
        if row[4] != 'yes' and row[4] != 'no' and not wheelchair_others:
            response_filtered.remove(row)

    return tuple_list_to_geojson(response_filtered)


@app.route('/')
def home():
    return render_template('mapbox.html')  # render a template


@app.route('/regions', methods=['GET'])
def regions():
    with open('data/landkreise_deutschland_vereinfacht.geojson', encoding='utf-8') as landkreise_file:
        landkreise_json = json.load(landkreise_file)
    return landkreise_json


@app.route('/data_request', methods=['POST'])
def data_request():
    post_request = request.json
    response = query_database(post_request['filter'])
    regions = post_request['regions']
    plot_data = []
    for entry in response['features']:
        if entry['properties']['operator']:
            if entry['properties']['operator'].lower() not in post_request['filter']['operator']['include'] + \
                    post_request['filter']['operator']['exclude']:
                entry['properties']['operator'] = 'others'
        else:
            entry['properties']['operator'] = 'others'
        if entry['properties']['landkreis_id'] in regions or len(regions) == 0:
            entry['properties']['landkreis'] = entry['properties']['landkreis_id']
            plot_data.append(entry['properties'])
    return {'data': plot_data}

def normalize(normal, inverse):
    normal_values = []
    keys_ordered = []

    for key in normal.keys():
        normal_values.append(normal[key])
        keys_ordered.append(key)

    inverse_values = [inverse[key] for key in inverse.keys()]

    max_value_to_tormalize_with = max([max(normal_values), max(inverse_values)])

    for key in normal.keys():
        normal[key] = normal[key] / max_value_to_tormalize_with

    for key in inverse.keys():
        inverse[key] = inverse[key] / max_value_to_tormalize_with
    return normal, inverse


@app.route('/normalized_atm_count_per_region', methods=['POST'])
def normalized_atm_count_per_region():
    post_request = request.json
    normal = normalized_atm_count_per_region(post_request)
    print(normal)
    for age in post_request['filter']['population'].keys():
        post_request['filter']['population'][age] = not post_request['filter']['population'][age]
    inverse = normalized_atm_count_per_region(post_request)
    print(inverse)

    normal_values = []
    keys_ordered = []
    for key in normal.keys():
        normal_values.append(normal[key])
        keys_ordered.append(key)

    inverse_values = [inverse[key] for key in inverse.keys()]

    normal_unnor = normal_values.copy()
    inverse_unnor = inverse_values.copy()
    # normalize
    normal, inverse = normalize(normal, inverse)

    normal_values = []
    keys_ordered = []

    for key in normal.keys():
        normal_values.append(normal[key])
        keys_ordered.append(key)

    inverse_values = [inverse[key] for key in inverse.keys()]



    outlier_regions = []
    if post_request['filter']['outliers']:


        z = np.abs(stats.zscore(normal_values))

        outliers = np.where(z > 3)

        for outlier in outliers[0]:
            outlier_regions.append(keys_ordered[outlier])

        z = np.abs(stats.zscore(inverse_values))

        outliers = np.where(z > 3)

        for outlier in outliers[0]:
            if not keys_ordered[outlier] in outlier_regions:
                outlier_regions.append(keys_ordered[outlier])

        for outlier in outlier_regions:
            del normal[outlier]
            del inverse[outlier]



        normal, inverse = normalize(normal, inverse)

    max_color_value = 0
    for value in normal_unnor:
        if value > max_color_value:
            max_color_value = value
    for value in inverse_unnor:
        if value > max_color_value:
            max_color_value = value
    print("max for color scale:", 1/max_color_value)
    print(max_color_value)
    return {'normal': normal, 'inverse': inverse, 'outlier_regions': outlier_regions, 'max_color_value': max_color_value}


def normalized_atm_count_per_region(post_request):
    atms_in_region = {}

    geojson = query_database(post_request['filter'])
    with open('data/region_population_age.json') as population_file:
        population_json = json.load(population_file)
        for atm in geojson['features']:
            landkreis_id = str(atm['properties']['landkreis_id'])
            if landkreis_id in atms_in_region.keys():
                atms_in_region[landkreis_id] += 1
            else:
                atms_in_region[landkreis_id] = 1
        atms_in_region.pop("", None)
        for region in atms_in_region.keys():
            people_to_consider = 1
            for people_age in population_json:
                if post_request['filter']['population'][people_age]:
                    try:
                        people_to_consider += population_json[people_age][str(region)]
                    except:
                        print(str(region))

            atms_in_region[region] = atms_in_region[region] / (people_to_consider/100)

    values = [atms_in_region[key] for key in atms_in_region.keys()]


    return atms_in_region


def idsToLandkreis(cartodb_id):
    with open('data/cartodb_id_to_landkreis.json', encoding='utf-8') as j:
        d = json.load(j)
        return str(cartodb_id) + " " + d[str(cartodb_id)]


# start the server with the 'run()' method
if __name__ == '__main__':
    app.run(debug=True)
