import time

import overpass
import json

api = overpass.API()
api = overpass.API(timeout=36000)


for i in range(0, 180, 5):
    response = api.get('node["amenity"="restaurant"](-90,' + str(i) + ',90,' + str(i+5) + ')')
    with open('restaurant' + str(i) + '.json', 'w') as out:
        json.dump(response, out)
    time.sleep(100)
    print(response)
