// for debugging
document.getElementById('check_wheelchair_yes').checked = true;
document.getElementById('check_wheelchair_no').checked = true;
document.getElementById('check_operator_sparkasse').checked = true;
document.getElementById('check_operator_volksbank').checked = true;
document.getElementById('range_radius').value = 10;

mapboxgl.accessToken = 'pk.eyJ1IjoibWJsdW0xMDI0IiwiYSI6ImNrMHhyMjE5NDA2bmYzZG11Yzdkd2VueGsifQ.wPFbDXFe8SJShGLoX0jXdw';

var colormap = [];
colors_sequential = ['#fff5f0',
    '#fee0d2',
    '#fcbba1',
    '#fc9272',
    '#fb6a4a',
    '#ef3b2c',
    '#cb181d',
    '#a50f15',
    '#67000d'];

colors_diverging = ['#d8b365',
    '#f5f5f5',
    '#5ab4ac'];

var heatmap_data = {};
var updateColors = false;
var graph_data = {};
var geoJson = {};
var selected_id = [];



var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [10.451526, 51.165691],
    zoom: 5,
    minZoom: 2,
    maxZoom: 15,
    maxBounds: [
        [4, 46],
        [16, 58]
    ]
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
            updateColormap(heatmap_data);
            if (updateColors) {
                map.setPaintProperty('landkreise-fills', 'fill-color', colormap);
            } else {
                initDiscreteHeatmap(map);
                updateColors = true;

            }
        }
    });
}


function initDiscreteHeatmap(map) {

    $.ajax({
        type: 'GET',
        url: '/regions',
        contentType: "application/json",

        data: "Landkreise",
        success: function (data) {
            console.log("Landkreise Geojson received from server.");
            geoJson = data;
            map.addLayer({
                'id': 'landkreise-fills',
                'type': 'fill',
                'source': {
                    'type': 'geojson',
                    'data': geoJson
                },
                'layout': {},
                'paint': {
                    'fill-color': colormap,
                    'fill-opacity': 0.7
                }
            });

            map.addLayer({
                'id': 'landkreise-borders',
                'type': 'line',
                'source': {
                    'type': 'geojson',
                    'data': geoJson
                },
                'layout': {},
                'paint': {
                    "line-color": "#627BC1",
                    "line-width": 0.5
                }
            });
            console.log("Layer added.");

            map.addLayer({
                'id': 'selection',
                'type': 'line',
                'source': {
                    'type': 'geojson',
                    'data': {"type": "FeatureCollection", "features": []}
                },
                'layout': {},
                'paint': {
                    "line-color": "#627BC1",
                    "line-width": 3
                }
            });

        }
    });
}


function updateColormap() {
    if (Object.keys(heatmap_data).length != 0) {
        colormap = ['match', ['get', 'cartodb_id']];
        Object.keys(heatmap_data).forEach(
            function (cartodb_id) {
                var color_index = Math.round(heatmap_data[cartodb_id] * colors_sequential.length) - 1;
                var color = colors_sequential[color_index];
                if (color != undefined) {
                    colormap.push(parseInt(cartodb_id), color);
                }
            }
        );
        colormap.push(colors_sequential[0]);
    } else {
        colormap = colors_sequential[0];
    }
}


map.on('load', function () {
    updateHeatmap();
});


// controller to apply filter
document.getElementById("apply_filter").onclick = function () {
    updateHeatmap();
    updatePlot();
};

function updatePlot(){
    // generate plot
    filter = get_filter_json();
    filter['regions'] = selected_id;
    $.ajax({
        type: 'POST',
        url: '/data_request',
        contentType: "application/json",
        data: JSON.stringify(filter),
        success: function (data) {
            graph_data = data.data;
            console.log(graph_data);
            plot(graph_data);
        }
    });
}


// When a click event occurs on a feature in the states layer, open a popup at the
// location of the click, with description HTML from its properties.
map.on('click', 'landkreise-fills', function (e) {
    // mark selected regions
    var cartodb_id = parseInt(e.features[0].properties.cartodb_id);
    if (selected_id.includes(cartodb_id)){
        var index = selected_id.indexOf(cartodb_id);
        if (index !== -1) selected_id.splice(index, 1);
    }
    else{
        selected_id.push(cartodb_id);
    }
    map.getSource('selection').setData(getGeoJson(selected_id));
    document.getElementById('selected').innerHTML = idsToLandkreis(selected_id);

    // query data and update plot
    updatePlot();
});


function getGeoJson(cartodb_ids) {
    features = [];
    cartodb_ids.forEach(function (cartodb_id, index) {
        geoJson.features.forEach(function (feature, index) {
            if (feature.properties.cartodb_id == cartodb_id) {
                features.push(feature)
            }
        })
    });
    return {"type": "FeatureCollection", "features": features}
}


function idsToLandkreis(cartodb_ids){
    var landkreise = [];
    cartodb_ids.forEach(function (cartodb_id, index) {
       geoJson.features.forEach(function (feature, i){
           if (feature.properties.cartodb_id == parseInt(cartodb_id)) {
                landkreise.push(feature.properties.gen);
            }
       })
    });
    return landkreise;

}