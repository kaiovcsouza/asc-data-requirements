function alertMsg(type, msg) {
    let checkAlert = document.querySelectorAll('div[role=alert]');
    if (checkAlert.length > 0) {
        checkAlert[0].remove();
    }

    let pdiv = document.createElement('div');
    pdiv.classList.add('msgalert');

    let div = document.createElement('div');
    div.classList.add('alert', 'col-12', 'col-md-6', 'alert-dismissible');
    div.classList.add(type);
    div.style.margin = 'auto';
    div.setAttribute('role', 'alert')
    div.innerHTML = msg


    let btnclose = document.createElement('button');
    btnclose.classList.add('btn-close');
    btnclose.setAttribute('data-bs-dismiss', 'alert');
    btnclose.setAttribute('aria-label', 'Close');

    div.appendChild(btnclose);
    pdiv.appendChild(div);


    document.getElementById('pg-body').appendChild(pdiv);
    setTimeout(function () { div.remove(); }, 6500);
}

function exportToExcel(optTables = [], filename, urls, ap3a_data = null) {
    var workbook = XLSX.utils.book_new();
    if (optTables.length > 0) {
        optTables.forEach(table => {
            if (table == 'Appendix_2a') {
                let data = document.getElementById(table);
                var worksheet = XLSX.utils.table_to_sheet(data, { raw: true });

                Object.entries(worksheet).forEach(([key, value]) => {
                    worksheet[key].t = 's'
                    if (!(key.startsWith('A'))) {
                        if (worksheet[key].v in urls) {
                            worksheet[key].l = { Target: urls[worksheet[key].v] + worksheet[key].v };
                            worksheet[key].s = {
                                font: {
                                    name: "Calibri",
                                    sz: 12,
                                    color: { rgb: "009c9d" },
                                    underline: true,
                                    bold: false
                                }
                            };
                        }
                    }
                });

            } else {
               var worksheet = XLSX.utils.json_to_sheet(ap3a_data, { raw: true });
            }

            workbook.SheetNames.push(table);
            workbook.Sheets[table] = worksheet;

        });
    }
    return XLSX.writeFile(workbook, filename + '.xlsx');
};

function createTable(headers, data) {
    let storage = {};
    const resultdiv = document.getElementById('resulttable');

    let resultsTable = document.createElement("table");
    // resultsTable.classList.add('ascborder')
    let tabBody = document.createElement("tbody");
    let thead = document.createElement("thead");
    let trhead = document.createElement("tr");
    resultsTable.id = 'Appendix_2a';
    resultsTable.classList.add("table", "table-striped");
    thead.appendChild(trhead);
    resultsTable.appendChild(thead);
    resultsTable.appendChild(tabBody);
    resultdiv.appendChild(resultsTable);

    headers.forEach(headerText => {
        let header = document.createElement("th");
        header.style.whiteSpace = 'nowrap';
        header.style.borderBottom = 'none';
        header.classList.add('asctable-head')
        header.innerHTML = headerText
        trhead.appendChild(header);
    });

    // POPULATE THE TABLE WIH DATA PROVIDED
    data.forEach(records => {
        let trBody = document.createElement("tr");
        tabBody.appendChild(trBody);
        Object.entries(records).forEach(record => {
            let [key, value] = record;
            let tableValue = document.createElement("td");
            tableValue.style.fontSize = '0.8rem';
            tableValue.style.borderBottom = 'none';
            tableValue.style.whiteSpace = 'pre-wrap';
            if (key == 'Template_Link' || key == 'Webform_Link') {
                if (value != 'Not applicable.') {
                    splitedvalue = value.split('--');
                    url = splitedvalue[1];

                    text = '<a href=' + url + ' target= _blank>' + splitedvalue[0] + '</a>';

                    tableValue.style.cursor = 'pointer';
                    tableValue.innerHTML = text;

                    if (!(splitedvalue[0] in storage)) {
                        storage[splitedvalue[0]] = url
                    }
                } else {
                    tableValue.innerHTML = (value != 'None') ? value : '';
                }

            } else {
                tableValue.innerHTML = (value != 'None') ? value : '';
            }
            trBody.appendChild(tableValue);
        });
    });

    return storage
}

const form_content = document.getElementById('form-content');
const startBtn = document.getElementById('startbtn');
const expbtn = document.getElementById('exportbtn')
const filterdiv = document.getElementsByClassName('ascfilter')[0];

jQuery(document).ready(function ($) {
    let urls_storage = {};
    let appendix3a_storage = {};

    $('#psys').select2({ placeholder: 'Select or type' });
    $('#pmethod').select2({ placeholder: 'Select or type' });
    $('#sp').select2({ placeholder: 'Select or type' });
    $('#wland').select2({ placeholder: 'Select or type' });
    $('#wtype').select2({ placeholder: 'Select or type' });
    $('#fd').select2({ placeholder: 'Select or type' });

    //AJAX BEHAVIOR
    if (typeof (filterdiv) != 'undefined' && filterdiv != null) {

        jQuery(document).on({
            ajaxStart: function () {
                //CLEAR LOADING SPACE AFTER AJAX IS FINISHED
                if (typeof (document.getElementById('loading-space')) != 'undefined' && document.getElementById('loading-space') != null) {
                    document.getElementById('loading-space').remove();
                }

                document.getElementById('tablediv').style.display = 'none';
                document.getElementById('btndiv').style.display = 'none';

                // Create the loading space.
                let loaderDiv = document.createElement("div");
                loaderDiv.style.width = "100%";
                loaderDiv.style.textAlign = "center";
                loaderDiv.style.marginTop = "0.6rem";
                loaderDiv.id = 'loading-space';
                document.getElementById('filterbox').parentElement.after(loaderDiv);
                let loadingGif = document.createElement("span");
                loadingGif.id = 'loading';
                loadingGif.classList.add("loader");
                loaderDiv.appendChild(loadingGif);
            },
            ajaxStop: function () {
                //CLEAR LOADING SPACE AFTER AJAX IS FINISHED
                if (typeof (document.getElementById('loading-space')) != 'undefined' && document.getElementById('loading-space') != null) {
                    document.getElementById('loading-space').remove();
                }

                document.getElementById('tablediv').style.display = 'block';
                document.getElementById('btndiv').style.display = 'block';


            }
        });
    }

    startBtn.addEventListener('click', e => {
        e.preventDefault();

        let resultdiv = document.getElementById('resulttable');

        resultdiv.replaceChildren();

        let err = 0;
        let errmsg = 'Please <strong>inform</strong> your applicability:<BR><BR>';

        if ($('#sp').val() == '') {
            err = 1
            errmsg += 'Species is mandatory<BR>'
        }
        if ($('#psys').val() == '') {
            err = 1
            errmsg += 'Production system is mandatory<BR>'
        }
        if ($('#pmethod').val() == '') {
            err = 1
            errmsg += 'Production method is mandatory<BR>'
        }
        if ($('#wland').val() == '') {
            err = 1
            errmsg += 'Water body is mandatory<BR>'
        }
        if ($('#wtype').val() == '') {
            err = 1
            errmsg += 'Water type is mandatory<BR>'
        }
        if ($('#fd').val() == '') {
            err = 1
            errmsg += 'Feed dependent is mandatory<BR>'
        }

        if (err == 1) {
            alertMsg('alert-danger', errmsg);
            return false;
        }

        let filter = {};

        let applicability = [
            $('#fd').val(),
            $('#psys').val(),
            $('#pmethod').val(),
            $('#sp').val(),
            $('#wland').val(),
            $('#wtype').val(),
        ];

        if (applicability.length > 0) {
            applicability.forEach(appl => {
                filter[appl] = 1;
            });
        }

        jQuery.ajax({
            type: 'post',
            url: dsDataDetail.ajaxDetails,
            data: {
                action: 'ascds_ajax_process',
                _ajax_nonce: dsDataDetail.nonce,
                collection: 'Reporting_Requeriments_Appendix_2a',
                filter,
                projection: {
                    '_id': 0,
                    'Topic': 1,
                    'Indicator': 1,
                    'Reporting_Frequency': 1,
                    'Level_of_Reporting': 1,
                    'Temporal_Coverage': 1,
                    'Submission_Timeframe': 1,
                    'Template_Link': 1,
                    'Webform_Link': 1,
                    'Applicability_Other': 1,
                }
            },
            success: function (response) {
                let obj = JSON.parse(response)

                if (obj.documents.length <= 0) {
                    alertMsg('alert-warning', 'No data requirement found for this applicability.<BR>Please review applicability in filter.')
                    return false;
                }

                let headers = []
                Object.keys(obj.documents[0]).forEach(key => headers.push(key.replaceAll('_', ' ')));

                urls_storage = createTable(headers, obj.documents)
            }
        });

        jQuery.ajax({
            type: 'post',
            url: dsDataDetail.ajaxDetails,
            data: {
                action: 'ascds_ajax_process',
                _ajax_nonce: dsDataDetail.nonce,
                collection: 'Reporting_Requeriments_Appendix_3a',
                filter,
                projection: {
                    '_id': 0,
                    'Topic': 1,
                    'Indicator': 1,
                    'Attribute': 1,
                    'Input_Autopopulated_Output': 1,
                    'Submission_format': 1
                }
            },
            success: function (response) {

                let obj = JSON.parse(response)

                appendix3a_storage = obj.documents
            }
        });
    });

    expbtn.addEventListener('click', e => {
        Date.prototype.yyyymmdd = function () {
            var mm = this.getMonth() + 1; // getMonth() is zero-based
            var dd = this.getDate();

            return [this.getFullYear(),
            (mm > 9 ? '' : '0') + mm,
            (dd > 9 ? '' : '0') + dd
            ].join('');
        };

        let date = new Date();
        let tables = ['Appendix_2a', 'Appendix_3a'];
        let filename = date.yyyymmdd() + '_Data_Requirement'
        exportToExcel(tables, filename, urls_storage, appendix3a_storage)
    })
});

