function plot(data, cartodb_ids) {

    /*
Stacked bar chart for each region individually.
 */
    let stack_info_msg = "<font color=\"white\"> Trellis chart for multiple selections will appear here.</font>";

    if (data.length != 0) {
        var vlSpec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "datasets": {"somedata": data},
            "data": {"name": "somedata"},
            "title": "all selected regions",
            "mark": "bar",
            "encoding": {
                "x": {"field": "operator", "type": "nominal", "sort": "ascending"},
                "y": {"aggregate": "sum", "field": "c", "type": "quantitative"},
                "color": {
                    "field": "wheelchair", "type": "nominal", "scale": {
                        "domain": ["yes", "no", "unknown"],
                        "range": colors_diverging
                    }
                },
                "tooltip": {"field": "sum_c", "type": "quantitative"},
                "order": ["yes", "no", "unknown"]
            },
            "config": {"background": "white"}
        };
        vegaEmbed('#vis', vlSpec);
        if (1 < cartodb_ids.length && cartodb_ids.length < 6) {
            var trellis = {
                "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
                "repeat": {
                    "cartodb_id": cartodb_ids,
                },
                "datasets": {"somedata": data},
                "data": {"name": "somedata"},
                "title": "each region individually",

                "mark": "bar",
                "encoding": {
                    "x": {"field": "operator", "type": "nominal", "sort": "ascending"},
                    "y": {"aggregate": "sum", "field": "c", "type": "quantitative"},
                    "color": {
                        "field": "wheelchair", "type": "nominal", "scale": {
                            "domain": ["yes", "no", "unknown"],
                            "range": colors_diverging
                        }
                    },
                    "column": {
                        "field": "landkreis",
                        "type": "nominal",
                        "header": {"title": "Landkreis"}
                    },
                    "tooltip": {"field": "sum_c", "type": "quantitative"},
                    "order": ["yes", "no", "unknown"]
                },
                "config": {"background": "white"}
            };
            vegaEmbed('#vis_matrix', trellis);
        }
        else{
            document.getElementById('vis_matrix').innerHTML = stack_info_msg
        }
    } else {
        document.getElementById('vis_matrix').innerHTML = stack_info_msg
    }
}


