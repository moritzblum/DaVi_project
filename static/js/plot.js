function plot(data) {
    if (data.length != 0) {
        var vlSpec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "datasets": {"somedata": data},
            "data": {"name": "somedata"},
            "mark": "bar",
            "encoding": {
                "column": {"field": "region", "type": "ordinal"},
                "x": {"field": "operator", "type": "nominal", "sort": "ascending"},
                "y": {"aggregate": "sum", "field": "c", "type": "quantitative"},
                "color": {
                    "field": "wheelchair", "type": "nominal", "scale": {
                        "domain": ["yes", "no", "unknown"],
                        "range": ["#e7ba52", "#c7c7c7", "#aec7e8"]
                    }
                },
                "tooltip": {"field": "sum_c", "type": "quantitative"},
                "order": ["yes", "no", "unknown"]
            },
            "config": {"background": "white"}
        };
        vegaEmbed('#vis', vlSpec);
    }
    else{
        document.getElementById('vis').innerHTML = 'No data available';
    }
}


