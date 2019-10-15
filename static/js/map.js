// for debugging
document.getElementById('check_wheelchair_yes').checked = true;
document.getElementById('check_operator_sparkasse').checked = true;
document.getElementById('range_radius').value = 10;

mapboxgl.accessToken = 'pk.eyJ1IjoibWJsdW0xMDI0IiwiYSI6ImNrMHhyMjE5NDA2bmYzZG11Yzdkd2VueGsifQ.wPFbDXFe8SJShGLoX0jXdw';

var colormap = [];
colors = ['#fff5f0',
    '#fee0d2',
    '#fcbba1',
    '#fc9272',
    '#fb6a4a',
    '#ef3b2c',
    '#cb181d',
    '#a50f15',
    '#67000d'];


var heatmap_data = {};
var updateColors = false;
var graph_data = {};


var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [10.451526, 51.165691],
    zoom: 5,
    minZoom: 5,
    maxZoom: 12,
    maxBounds: [
        [4, 46],
        [16, 58]
    ]
});


map.on('load', function () {
    initDiscreteHeatmap(map);
});


function updateHeatmap() {
    $.ajax({
        type: 'POST',
        url: '/normalized_atm_count_per_region',
        contentType: "application/json",
        data: JSON.stringify(get_filter_json()),
        success: function (data) {
            heatmap_data = data;
            console.log('normalized_atm_count_per_region:');
            var density_values = [];
            Object.keys(heatmap_data).forEach(
                function (element) {
                    density_values.push(heatmap_data[element]);
                }
            );
            var max_of_array = Math.max.apply(Math, density_values);
            Object.keys(heatmap_data).forEach(
                function (element) {
                    heatmap_data[element] = heatmap_data[element] / max_of_array;
                }
            );
            getColormap(heatmap_data);
            if (updateColors) {
                map.setPaintProperty('landkreise-fills', 'fill-color', colormap);
            }
        }
    });
}


function initDiscreteHeatmap(map) {
    updateHeatmap();

    $.ajax({
        type: 'GET',
        url: '/regions',
        contentType: "application/json",

        data: "Landkreise",
        success: function (data) {
            console.log("Landkreise Geojson received from server.");

            map.addLayer({
                'id': 'landkreise-fills',
                'type': 'fill',
                'source': {
                    'type': 'geojson',
                    'data': data
                },
                'layout': {},
                'paint': {
                    'fill-color': colormap,
                    'fill-opacity': 0.8,
                }
            });

            map.addLayer({
                'id': 'landkreise-borders',
                'type': 'line',
                'source': {
                    'type': 'geojson',
                    'data': data
                },
                'layout': {},
                'paint': {
                    "line-color": "#627BC1",
                    "line-width": 1
                }
            });
            console.log("Layer added.");
            updateColors = true;
        }
    });
}


function getColormap() {
    if (Object.keys(heatmap_data).length!=0) {
        colormap = ['match', ['get', 'cartodb_id']];
        Object.keys(heatmap_data).forEach(
            function (cartodb_id) {
                var color_index = Math.round(heatmap_data[cartodb_id] * colors.length) - 1;
                var color = colors[color_index];
                if (color != undefined) {
                    colormap.push(parseInt(cartodb_id), color);
                }
            }
        );
        colormap.push(colors[0]);
    } else {
        colormap = colors[0];
    }
}




// controller to apply filter
document.getElementById("apply_filter").onclick = function () {
    updateHeatmap();
};


// When a click event occurs on a feature in the states layer, open a popup at the
// location of the click, with description HTML from its properties.
map.on('click', 'landkreise-fills', function (e) {
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(e.features[0].properties.cartodb_id)
        .addTo(map);
});






