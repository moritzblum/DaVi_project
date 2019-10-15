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

    return query_json;
}


