from math import radians, sin, cos, atan2, sqrt

def get_distance(coor1, coor2):
    # approximate radius of earth in km
    R = 6373.0

    lat1 = radians(coor1[0])
    lon1 = radians(coor1[1])
    lat2 = radians(coor2[0])
    lon2 = radians(coor2[1])

    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c

    return distance