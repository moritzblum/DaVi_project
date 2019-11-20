// for debugging
document.getElementById('check_wheelchair_yes').checked = true;
document.getElementById('check_wheelchair_no').checked = true;
document.getElementById('check_operator_sparkasse').checked = true;
document.getElementById('check_operator_volksbank').checked = true;
document.getElementById('check_age_4').checked = true;
document.getElementById('check_age_5').checked = true;



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
var heatmapCreated = false;



var width = document.getElementById('map').clientWidth;
var height = width * 1.5;
var te;


function initChoroplethMap() {
    $.ajax({
        type: 'GET',
        url: '/regions',
        contentType: "application/json",

        data: "Landkreise",
        success: function (data) {
            console.log("Landkreise Geojson received from server.");
            geoJson = data;

            svg = d3.select("#map").select("svg")
                .attr("width", width)
                .attr("height", height);



            mapLayer = svg.append('g')
                .classed('map-layer', true);

            // add background
            te =  mapLayer.append('rect')
                .attr('width', width)
                .attr('height', height)
                .attr('fill', 'white');

            projection = d3.geoMercator().translate([width/2, height/2]).scale(width*4).center([12, 49]);
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
                    return getColor(d);
                }).on("mouseover", function (d) {
            }).on("mouseout", function (d) {
            }).on("click", function (d) {
                cartodb_id = d.properties.cartodb_id;
                if (selectedCartodbIds.includes(cartodb_id)) {
                    var index = selectedCartodbIds.indexOf(cartodb_id);
                    if (index > -1) {
                        selectedCartodbIds.splice(index, 1);
                    }
                    d3.select(this).style("fill", getColor(d));
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


// get the color depending on the stored heatmap_data data
function getColor(d) {
    cartodb_id = d.properties.cartodb_id;
    colorIntensity = heatmapData[cartodb_id];
    color = d3.interpolateYlGn(colorIntensity);
    console.log(colorIntensity, cartodb_id);

    if (colorIntensity != undefined) {
        return color;
    } else {
        // for this filter are no ATMs in this region
        console.log(heatmapData[cartodb_id]);
        return d3.interpolateYlGn(0);
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


function updateHeatmapData() {
    $.ajax({
        type: 'POST',
        url: '/normalized_atm_count_per_region',
        contentType: "application/json",
        data: JSON.stringify(get_filter_json()),
        success: function (data) {
            heatmapData = data;
            if (!heatmapCreated) {
                initChoroplethMap();
                updatePlot();
            } else {
                updateChoroplethMap();
                updatePlot();
            }
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
    width = document.getElementById('map').clientWidth;
    height = width*1.5;
   projection.translate([width/2, height/2]).scale(width*4).center([12, 49]);
   d3.select('svg').attr("width",width).attr("height",height);
   d3.select('te').attr("width",width).attr("height",height);
   d3.selectAll("path").attr('d', path);


}