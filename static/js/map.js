// for debugging
document.getElementById('check_wheelchair_yes').checked = true;
document.getElementById('check_wheelchair_no').checked = true;
document.getElementById('check_wheelchair_others').checked = true;

document.getElementById('check_operator_sparkasse').checked = true;
document.getElementById('check_operator_volksbank').checked = true;
document.getElementById('check_age_4').checked = true;
document.getElementById('check_age_5').checked = true;
document.getElementById('invert').checked = true;


var selectedCartodbIds = [];

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
    '#c51b8a',
    '#5ab4ac'];

selectionColor = '#2b83ba';

var heatmapData = {};
var GraphData = {};
var geoJson = {};
var mapLayer;
var path;
var projection;


var mapBackground;
var inverseMapBackground;


function initChoroplethMap() {


    if (document.getElementById('invert').checked) {
        width = document.getElementById('mapWindow').clientWidth;
        mapWidth = width / 2 - 1;
        mapHeight = width * 3 / 4;
        document.getElementById("mapWindow").innerHTML = "<div id=\"map\"><svg></svg></div><div id=\"inverseMap\"><svg></svg></div>";
    } else {
        height = document.getElementById('mapWindow').clientWidth;
        mapHeight = height;
        mapWidth = height * 3 / 4;
        document.getElementById("mapWindow").innerHTML = "<div id=\"map\"><svg></svg></div>";
    }


    svg = d3.select("#map").select("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight);


    mapBackground = svg.append('rect')
        .attr('width', mapWidth)
        .attr('height', mapHeight)
        .attr('fill', 'green');


    $.ajax({

        type: 'GET',
        url: '/regions',
        contentType: "application/json",

        data: "Landkreise",
        success: function (data) {
            console.log("Landkreise Geojson received from server.");
            geoJson = data;

            svg = d3.select("#map").select("svg")
                .attr("width", mapWidth)
                .attr("height", mapHeight);


            mapLayer = svg.append('g')
                .classed('map-layer', true);

            projection = d3.geoMercator().translate([mapWidth / 2, mapHeight / 2]).scale(mapWidth * 4).center([12, 50]);

            path = d3.geoPath().projection(projection);

            // add regions
            mapLayer.selectAll("path")
                .data(geoJson.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("stroke", "black")
                .style("stroke-width", 0.5)
                .style('fill', function (d) {
                    return getColor(d, 'normal');
                }).on("click", function (d) {
                cartodb_id = d.properties.cartodb_id;
                if (selectedCartodbIds.includes(cartodb_id)) {
                    var index = selectedCartodbIds.indexOf(cartodb_id);
                    if (index > -1) {
                        selectedCartodbIds.splice(index, 1);
                    }
                    d3.select(this).style("fill", getColor(d, 'normal'));
                } else {
                    selectedCartodbIds.push(cartodb_id);
                    d3.select(this).style("fill", selectionColor);
                }
                updatePlot();
                document.getElementById("selected").innerHTML = idsToLandkreis(selectedCartodbIds);
            });
            heatmapCreated = true;

        }
    });


}


function initChoroplethMapInverse() {

    console.log("Add inverse");
    width = document.getElementById('mapWindow').clientWidth;
    mapWidth = width / 2 - 1;
    mapHeight = width * 3 / 4;


    inverseSvg = d3.select("#inverseMap").select("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight);

    inverseMapBackground = inverseSvg.append('rect')
        .attr('width', mapWidth)
        .attr('height', mapHeight)
        .attr('fill', 'blue');

    $.ajax({
        type: 'GET',
        url: '/regions',
        contentType: "application/json",

        data: "Landkreise",
        success: function (data) {

            geoJson = data;

            inverseSvg = d3.select("#inverseMap").select("svg")
                .attr("width", mapWidth)
                .attr("height", mapHeight);


            inverseMapLayer = inverseSvg.append('g')
                .classed('inverseMap-layer', true);

            inverseProjection = d3.geoMercator().translate([mapWidth / 2, mapHeight / 2]).scale(mapWidth * 4).center([12, 50]);

            inversePath = d3.geoPath().projection(inverseProjection);

            // add regions
            inverseMapLayer.selectAll("path")
                .data(geoJson.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("stroke", "black")
                .style("stroke-width", 0.5)
                .style('fill', function (d) {
                    return getColor(d, 'inverse');
                }).on("click", function (d) {
                cartodb_id = d.properties.cartodb_id;
                if (selectedCartodbIds.includes(cartodb_id)) {
                    var index = selectedCartodbIds.indexOf(cartodb_id);
                    if (index > -1) {
                        selectedCartodbIds.splice(index, 1);
                    }
                    d3.select(this).style("fill", getColor(d, 'inverse'));
                } else {
                    selectedCartodbIds.push(cartodb_id);
                    d3.select(this).style("fill", selectionColor);
                }
                updatePlot();
                document.getElementById("selected").innerHTML = idsToLandkreis(selectedCartodbIds);
            });

        }
    });


}


// get the color depending on the stored heatmap_data data
function getColor(d, mode) {
    cartodb_id = d.properties.cartodb_id;
    colorIntensity = heatmapData[mode][cartodb_id];
    color = d3.interpolatePiYG(colorIntensity);

    if (colorIntensity != undefined && color!= undefined) {
        return color;
    } else {
        // for this filter are no ATMs in this region
        console.log("Error, region has no atms!");
        return d3.interpolatePiYG(0);
    }
    /*
    var color_index = Math.round(heatmapData[cartodb_id] * colors_sequential.length) - 1;
    var color = colors_sequential[color_index];
    if (color != undefined) {
        return color;
    } else {
        // for this filter are no ATMs in this region
        return colors_sequential[0];
    }
    */
}

/*
function updateChoroplethMap() {
    mapLayer.selectAll("path").style('fill', function (d) {
        // if the region is currently selected, highlight it
        if (selectedCartodbIds.includes(d.properties.cartodb_id)) {
            return selectionColor;
        } else {
            return getColor(d);
        }
    })
}
 */


function updateHeatmapData() {
    $.ajax({
        type: 'POST',
        url: '/normalized_atm_count_per_region',
        contentType: "application/json",
        data: JSON.stringify(get_filter_json()),
        success: function (data) {
            heatmapData = data;

            initChoroplethMap();
            if (document.getElementById('invert').checked) {
                initChoroplethMapInverse();
            }
            updatePlot();

        }
    });
}


function updatePlot() {
    // generate plot
    filter = get_filter_json();
    filter['regions'] = selectedCartodbIds;
    $.ajax({
        type: 'POST',
        url: '/data_request',
        contentType: "application/json",
        data: JSON.stringify(filter),
        success: function (data) {
            GraphData = data.data;
            plot(GraphData, selectedCartodbIds);
        }
    });
}


function idsToLandkreis(cartodb_ids) {
    var landkreise = [];
    cartodb_ids.forEach(function (cartodb_id, index) {
        geoJson.features.forEach(function (feature, i) {
            if (feature.properties.cartodb_id == parseInt(cartodb_id)) {
                landkreise.push(cartodb_id + " " + feature.properties.gen);
            }
        })
    });
    return landkreise;
}


window.onload = function () {
    updateHeatmapData();
};

// controller to apply filter
document.getElementById("apply_filter").onclick = function () {
    updateHeatmapData();

};

d3.select(window).on('resize', resize);

function resize() {

    if (document.getElementById('invert').checked) {
        width = document.getElementById('mapWindow').clientWidth;
        mapWidth = width / 2 - 1;
        mapHeight = width * 3 / 4;
    } else {
        height = document.getElementById('mapWindow').clientWidth;
        mapHeight = height;
        mapWidth = height * 3 / 4;
    }


    d3.select("#map").select('svg').attr("width", mapWidth).attr("height", mapHeight);
    d3.select("#inverseMap").select('svg').attr("width", mapWidth).attr("height", mapHeight);
    d3.select("#map").select('svg').select('rect').attr("width", mapWidth).attr("height", mapHeight);
    d3.select("#inverseMap").select('svg').select('rect').attr("width", mapWidth).attr("height", mapHeight);

    projection.translate([mapWidth / 2, mapHeight / 2]).scale(mapWidth * 4).center([12, 50]);
    inverseProjection.translate([mapWidth / 2, mapHeight / 2]).scale(mapWidth * 4).center([12, 50]);

    d3.selectAll("path").attr('d', path);


}