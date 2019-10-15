import json
import sqlite3

from flask import Flask, render_template, request, jsonify

# create the application object
app = Flask(__name__)


def tuple_list_to_geojson(list_of_tuples):
    list_of_features = []
    for row in list_of_tuples:
        id = row[0]
        operator = row[1]
        lat = row[2]
        lon = row[3]
        landkreis_id = row[13]
        list_of_features.append({
            'type': "Feature",
            'geometry': {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                'id': id,
                'operator': operator,
                'landkreis_id': landkreis_id
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
    return query_database(post_request['filter'])


@app.route('/normalized_atm_count_per_region', methods=['POST'])
def normalized_atm_count_per_region():
    atms_in_region = {}
    post_request = request.json
    geojson = query_database(post_request['filter'])
    with open('data/region_population.json') as population_file:
        population_json = json.load(population_file)
        for atm in geojson['features']:
            landkreis_id = str(atm['properties']['landkreis_id'])
            if landkreis_id in atms_in_region.keys():
                atms_in_region[landkreis_id] += 1
            else:
                atms_in_region[landkreis_id] = 1
        atms_in_region.pop("", None)
        for region in atms_in_region.keys():
            atms_in_region[region] = atms_in_region[region]/population_json[region]['population']
    return atms_in_region



# start the server with the 'run()' method
if __name__ == '__main__':
    app.run(debug=True)
