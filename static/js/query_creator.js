function get_filter_json() {
    var query_json = {
        'filter': {
            'operator': {
                'include': [],
                'exclude': [],
                'others': true,
            },
            'wheelchair': {
                'yes': true,
                'no': true,
                'others': true
            },
            'population': {
                '0-17': false,
                '18-24': false,
                '25-44': false,
                '45-64': false,
                '65-100': false
            }
        }
    };

    var checkboxes = document.getElementsByClassName("form-check-input");
    for (i = 0; i < checkboxes.length; i++) {
        checkbox = checkboxes[i];
        if (checkbox.id.startsWith('check_operator')) {
            if (checkbox.id == 'check_operator_others') {
                query_json.filter.operator.others = checkbox.checked;
            } else {
                if (checkbox.checked) {
                    query_json.filter.operator.include.push(checkbox.id.replace('check_operator_', ''))
                } else {
                    query_json.filter.operator.exclude.push(checkbox.id.replace('check_operator_', ''))
                }
            }

        }
    }
    query_json.filter.wheelchair.yes = document.getElementById('check_wheelchair_yes').checked;
    query_json.filter.wheelchair.no = document.getElementById('check_wheelchair_no').checked;
    query_json.filter.wheelchair.others = document.getElementById('check_wheelchair_others').checked;

    query_json.filter.population['0-17'] = document.getElementById('check_age_1').checked;
    query_json.filter.population['18-24'] = document.getElementById('check_age_2').checked;
    query_json.filter.population['25-44'] = document.getElementById('check_age_3').checked;
    query_json.filter.population['45-64'] = document.getElementById('check_age_4').checked;
    query_json.filter.population['65-100'] = document.getElementById('check_age_5').checked;


    return query_json;
}


