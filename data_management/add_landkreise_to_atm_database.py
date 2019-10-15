import json
import sqlite3
from shapely.geometry import Point, MultiPolygon
from shapely.geometry import shape

conn = sqlite3.connect('data/atm.db')
c = conn.cursor()
c.execute("SELECT ID, LAT, LON FROM FILTERED")
response = c.fetchall()


landkreise_dict = {}
with open('data/landkreise_deutschland_vereinfacht.geojson', encoding='utf-8') as landkreise_file:
    landkreise_dict = json.load(landkreise_file)


def get_landkreis_for_loc(lat, lon):
    point = Point(lon, lat)
    for landkreis in landkreise_dict['features']:
        landkreis_name = landkreis['properties']['cartodb_id']
        geo_data = landkreis['geometry']
        if shape(geo_data).contains(point):
            return str(landkreis_name)
    return ""


#c.execute("""ALTER TABLE FILTERED ADD LANDKREIS STRING;""")

for point in response:
    id = point[0]
    landkreis = get_landkreis_for_loc(point[1], point[2])
    print("""UPDATE FILTERED SET LANDKREIS=\"""" + landkreis + """\" WHERE ID=""" + str(id) + ";")
    c.execute("""UPDATE FILTERED SET LANDKREIS=\"""" + landkreis + """\" WHERE ID=""" + str(id) + ";")
    conn.commit()







