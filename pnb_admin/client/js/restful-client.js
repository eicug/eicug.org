$.ui.dialog.prototype._focusTabbable = $.noop;

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

function Comparator(a,b) {
	if (a[1] > b[1]) return -1;
	if (a[1] < b[1]) return 1;
	return 0;
}

function ComparatorInst(a,b) {
	if (a[1] < b[1]) return -1;
	if (a[1] > b[1]) return 1;
	return 0;
}

function ComparatorName(a,b) {
	if (a[3] < b[3]) return -1;
	if (a[3] > b[3]) return 1;
	return 0;
}

var orderKeys = function(o, f) {
  var os=[], ks=[], i;
  for (i in o) {
    os.push([i, o[i]]);
  }
  os.sort(function(a,b){return f(a[1],b[1]);});
  for (i=0; i<os.length; i++) {
    ks.push(os[i][0]);
  }
  return ks;
};

var RCLIENT = RCLIENT || { REVISION: '1' };

// RCLIENT.Phonebook class declaration:
RCLIENT.Phonebook = function () {
	this.tabs = '';
	this.tabTitle = $( "#tab_title" );
	this.tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
	this.tabCounter = 4;

        this.service_url = 'http://www.eicug.org/pnb_admin/service/index.php';

	this.countries = '';

	this.institutions_fields = '';
	this.institutions_fields_ordered = '';

	this.institution_fields_groups = '';
	this.instiutions_fields_groups_ordered = '';

	this.institutions = new Array();

	this.members_fields = '';
	this.members_fields_ordered = '';

	this.members_fields_groups = '';
	this.members_fields_groups_ordered = '';

	this.members = new Array();
};

//  define functions within class prototype:
RCLIENT.Phonebook.prototype = {
	constructor: RCLIENT.Phonebook,

	initialize : function() {
		var service = this;

        $('#close_all_tabs').click(function() {
            for (var i = 2; i <= service.tabCounter; i++) {
                var tabid = "tabs-" + i;
                $('li[aria-controls="'+tabid+'"]').remove();
                $('#'+tabid).remove();
                console.log('removing '+tabid);
            }
            $("#tabs").tabs( "refresh" );
        });

		$('.ui-layout-center').append('<div id="system-loading-dialog" title="Please wait, data is loading"><div id="loading-progress"></div></div>');
		$('#system-loading-dialog').dialog({
			dialogClass: "no-close",
			modal: true,
			autoOpen: true,
			height: 100,
			width:  300
		});	
		$( "#loading-progress" ).progressbar({
			value: 0,
			max: 100,
			complete: function( event, ui ) {
				$('#system-loading-dialog').dialog('close');
			}
		});	


		this.get_institutions_fields_groups(function() {
			var val = $('#loading-progress').progressbar("value") + 14.3;
			$('#loading-progress').progressbar({ value: val });
			service.get_institutions_fields(function() {
				var val = $('#loading-progress').progressbar("value") + 14.3;
				$('#loading-progress').progressbar({ value: val });
			});
		});

		this.get_institutions('all', function() {
			var val = $('#loading-progress').progressbar("value") + 14.3;
			$('#loading-progress').progressbar({ value: val });
		});

		this.get_members_fields_groups(function(){
			var val = $('#loading-progress').progressbar("value") + 14.3;		
			$('#loading-progress').progressbar({ value: val });
			service.get_members_fields( function() {
				var val = $('#loading-progress').progressbar("value") + 14.3;
				$('#loading-progress').progressbar({ value: val });
			});
		});

		this.get_members(function() {
			var val = $('#loading-progress').progressbar("value") + 14.3;		
			$('#loading-progress').progressbar({ value: val });
		}, 'all','full');

		this.get_countries(function() {
			var val = $('#loading-progress').progressbar("value") + 14.3;		
			$('#loading-progress').progressbar({ value: val });
		});

		var service = this;

		$('#menu_search').click(function() {
			service.display_search();
		});
	},

	find_field_id_institutions: function(name) {
		var service = this;
		var field_id = '';
		for (var i in service.institutions_fields) {
			if (service.institutions_fields[i]['name_fixed'] == name) {
				return i;
			}
		}
		return field_id;
	},
	find_field_options_by_id_institutions: function(id) {
		var service = this;
		var option_list = service.institutions_fields[id]['options'].split(',');
		var options = new Object();
		for (var i = 0; i < option_list.length; i++) {
			var tmp = option_list[i].split(':');
			options[tmp[0]] = tmp[1];
		}
		return options;
	},

	find_field_id_members: function(name) {
		var service = this;
		var field_id = '';
		for (var i in service.members_fields) {
			if (service.members_fields[i]['name_fixed'] == name) {
				return i;
			}
		}
		return field_id;
	},

	find_field_options_by_id_members: function(id) {
		var service = this;
		var option_list = service.members_fields[id]['options'].split(',');
		var options = new Object();
		for (var i = 0; i < option_list.length; i++) {
			var tmp = option_list[i].split(':');
			options[tmp[0]] = tmp[1];
		}
		return options;
	},

	export_excel_board: function() {
		var service = this;
		var url = service.service_url+'?q=/members/excel_board/date:'+Date.now();
		location.href = url;
	},

	export_excel: function() {
		var service = this;
		if ($("#export-excel-dialog").length > 0) {
			$('#export-excel-dialog').remove();
		}
		$('.ui-layout-center').append('\
			<div id="export-excel-dialog" title="Export members data into Excel format">\
				<form id="export-excel-form">\
					<fieldset id="export-excel-fieldset"><legend>Please mark desired MEMBER fields</legend>\
					</fieldset>\
				</form>\
			</div>\
		');
		var max_line = 3;
		var out = '';
		var cnt = 0;
		var sort1 = '<p>Sort by <SELECT id="sort_1" style="display: inline-block;"><OPTION value="">FIRST SORTING FIELD</OPTION>';
		var sort2 = '<SELECT id="sort_2"><OPTION value="">SECOND SORTING FIELD</OPTION>';
		var sort3 = '<SELECT id="sort_3"><OPTION value="">THIRD SORTING FIELD</OPTION>';
		var sort4 = '<SELECT id="sort_4"><OPTION value="">FOURTH SORTING FIELD</OPTION>';
		for (var m = 0; m < service.members_fields_ordered.length; m++) {
			var i = service.members_fields_ordered[m];
			var fields = service.members_fields[i];
			sort1 += '<OPTION value="'+fields['id']+'m" ';
			if (fields['name_fixed'] == 'institution_id') { sort1 += 'selected=selected'; }
			sort1 += '>MEMBER: '+fields['name_desc']+'</OPTION>';

			sort2 += '<OPTION value="'+fields['id']+'m" ';
			if (fields['name_fixed'] == 'name_last') { sort2 += 'selected=selected'; }
			sort2 += '>MEMBER: '+fields['name_desc']+'</OPTION>';

			sort3 += '<OPTION value="'+fields['id']+'m" >MEMBER: '+fields['name_desc']+'</OPTION>';
			sort4 += '<OPTION value="'+fields['id']+'m" >MEMBER: '+fields['name_desc']+'</OPTION>';

			var checked = '';
			if (fields['name_fixed'] == 'name_first' || fields['name_fixed'] == 'name_last' 
				|| fields['name_fixed'] == 'email' || fields['name_fixed'] == 'institution_id' ) {
				checked = ' checked=checked';
			}
			out += '<div style="width: 180px; display: inline-block; border-bottom: 1px dashed silver; border-left: 1px dashed silver;"><label for="id_'+fields['id']+'"><input type="checkbox" id="id_'+fields['id']+'" '+checked+' /> '+fields['name_desc']+'</label></div>'; 
			cnt += 1;
			//if (cnt >= max_line) {
			//	out += '<br>';
			//	cnt = 0;
			//}
		}
		sort1 += '</SELECT>, then by ';
		sort2 += '</SELECT>,<br> then by ';
		sort3 += '</SELECT>, then by ';
		sort4 += '</SELECT></p>';

		var iout = '', iasort1 = [], iasort2 = [];
		for (var m = 0; m < service.institutions_fields_ordered.length; m++) {
			var i = service.institutions_fields_ordered[m];
			var fields = service.institutions_fields[i];
			iout += '<div style="width: 180px; display: inline-block; border-bottom: 1px dashed silver; border-left: 1px dashed silver;"><label for="id_'+fields['id']+'"><input type="checkbox" id="iid_'+fields['id']+'" '+checked+' /> '+fields['name_desc']+'</label></div>';
			var isort1 = '';
			isort1 += '<OPTION value="'+fields['id']+'i" >INST: '+fields['name_desc']+'</OPTION>';
			var isort2 = '';
			isort2 += '<OPTION value="'+fields['id']+'i" >INST: '+fields['name_desc']+'</OPTION>';
			iasort1.push( isort1 ); iasort2.push( isort2 );
		}

		$('#export-excel-fieldset').append(out);
		$('#export-excel-dialog').append(sort1+sort2+sort3+sort4);
		$('#sort_1').append( iasort1.join('') );
		$('#sort_2').append( iasort1.join('') );
		$('#sort_3').append( iasort1.join('') );
		$('#sort_4').append( iasort1.join('') );
		$('#export-excel-dialog').append('<fieldset id="export-excel-fieldset-inst"><legend>or, mark INSTITUTIONAL Fields</legend>'+iout+'</fieldset>');
		$('#export-excel-dialog').dialog({
			autoOpen: true,
			height: 600,
			width: 800,
			modal: true,
			buttons: {
				"Export Data": function() {
					var ids = [];
					for (var m = 0; m < service.members_fields_ordered.length; m++) {
						var i = service.members_fields_ordered[m];
						var fields = service.members_fields[i];
						if ( $('#id_'+fields['id']).is(':checked') ) {
							ids.push(fields['id']);
						}
					}
					ids = ids.join(',');
					iids = [];
					for (var m = 0; m < service.institutions_fields_ordered.length; m++) {
						var i = service.institutions_fields_ordered[m];
						var fields = service.institutions_fields[i];
						if ( $('#iid_'+fields['id']).is(':checked') ) {
							iids.push(fields['id']);
						}
					}
					iids = iids.join(',');
					var url = service.service_url+'?q=/members/excel/fields:'+ids;
					url += '/ifields:' + iids;
					url += '/sort:'+$('#sort_1 option:selected').val();
					url += ','+$('#sort_2 option:selected').val();
					url += ','+$('#sort_3 option:selected').val();
					url += ','+$('#sort_4 option:selected').val();
					url += '/date:'+Date.now();
				    location.href = url;
					$( this ).dialog( "close" );
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			},
			close: function() {
						
			}
		});
	},

	display_chart: function(type, param, plot) {
		var service = this;
		if (type == undefined || param == undefined || plot == undefined) { return; }
		if (type == '' || param == '' || plot == '') { return; }
		if ($("#system-chart-dialog").length > 0) {
			$('#system-chart-dialog').remove();
		}
		var titles = { "p_1" : 'Institutions - by Region of the World', 'p_2': 'Institutions - by Country' , 'p_3': 'Members - Gender', 'p_4': 'Members - Region of the World', 'p_5': 'Members - Country', 'p_6': 'Members - Area', 'p_7': 'Board Members - Gender', 'p_8': 'Board Members - Area of Expertise' };
		var title = titles[param];
		$('.ui-layout-center').append('<div id="system-chart-dialog" title="'+title+'"><div id="chart-plot" style="height: 100%; width: 100%; overflow-x: auto; overflow-y:auto;"></div></div>');
		$('#system-chart-dialog').dialog({
			modal: true,
			autoOpen: true,
			height: 800,
			width:  800,
			open: function( event, ui ) {		
			},
			buttons: {
				"Save Image": function() {
					//$('#chart-plot')[0].download = 'image.png';
					//$('#chart-plot').jqplotSaveImage();
					var imgData = $('#chart-plot').jqplotToImageStr({});
					if (imgData) {
						download(imgData, 'image-'+Math.floor(Date.now() / 1000)+'.png', "image/png");
					}
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
		});	
		var chartdata = [];
		if (type == 't_1') { // institutions
			switch(param) {
				case 'p_1':
					// region of the world
					var field_id = service.find_field_id_institutions('region');
					if (field_id == '') { return; }
					var inst;
					var regions = new Object();
					var options = service.find_field_options_by_id_institutions(field_id);
					for (var i in service.institutions) {
						inst = service.institutions[i];
						if (inst['status'] != 'active') { continue; } // only check active institutions
						if (inst['fields'][field_id] == undefined) {
							if (regions['Unspecified'] == undefined) { regions['Unspecified'] = 0; }
							regions['Unspecified'] += 1;
						} else {
							if (regions[ options[ inst['fields'][field_id] ] ] == undefined) { regions[ options[ inst['fields'][field_id] ] ] = 0; }
							regions[ options[ inst['fields'][field_id] ] ] += 1;
						}
					}
					for(var i in regions) {
						chartdata.push( [ i, regions[i] ] );
					}
					break;
				case 'p_2':
					// country
					var field_id = service.find_field_id_institutions('country_code');
					if (field_id == '') { return; }
					var inst;
					var countries = new Object();
					for (var i in service.institutions) {
						inst = service.institutions[i];
						if (inst['status'] != 'active') { continue; } // only check active institutions
						if (inst['fields'][field_id] == undefined) {
							if (countries['Unspecified'] == undefined) { countries['Unspecified'] = 0; }
							countries['Unspecified'] += 1;
						} else {
							if (countries[ service.countries[ inst['fields'][field_id] ] ] == undefined) { countries[ service.countries[ inst['fields'][field_id] ] ] = 0; }
							countries[ service.countries[ inst['fields'][field_id] ] ] += 1;
						}
					}
					for(var i in countries) {
						chartdata.push( [ i, countries[i] ] );
					}
					break;
				default:
					return; // unknown parameter
					break;
			}
		} else if (type == 't_2') { // members
			switch(param) {
				case 'p_5':
					// country - from institution
					var field_id = service.find_field_id_institutions('country_code');
					if (field_id == '') { return; }
					var inst_field_id = service.find_field_id_members('institution_id');
					var inst;
					var countries = new Object();
					var options = service.find_field_options_by_id_institutions(field_id);
					for (var i in service.members) {
						var mem = service.members[i];
						if ( mem['status'] != 'active' ) { continue; } // only check active members
						var inst = service.institutions[ mem['fields'][inst_field_id] ];
						if (inst['fields'][field_id] == undefined) {
							if (countries['Unspecified'] == undefined) { countries['Unspecified'] = 0; }
							countries['Unspecified'] += 1;
						} else {
							if (countries[ service.countries[ inst['fields'][field_id] ] ] == undefined) { 
								countries[ service.countries[ inst['fields'][field_id] ] ] = 0; }
							countries[ service.countries[ inst['fields'][field_id] ] ] += 1;
						}
					}
					for(var i in countries) {
						chartdata.push( [ i, countries[i] ] );
					}
				break;
				case 'p_4':
					// region of the world - from institution
					var field_id = service.find_field_id_institutions('region');
					var inst_field_id = service.find_field_id_members('institution_id');
					if (field_id == '') { return; }
					var inst;
					var regions = new Object();
					var options = service.find_field_options_by_id_institutions(field_id);
					for (var i in service.members) {
						var mem = service.members[i];
						if ( mem['status'] != 'active' ) { continue; } // only check active members
						var inst = service.institutions[ mem['fields'][inst_field_id] ];
						if (inst['fields'][field_id] == undefined) {
							if (regions['Unspecified'] == undefined) { regions['Unspecified'] = 0; }
							regions['Unspecified'] += 1;
						} else {
							if (regions[ options[ inst['fields'][field_id] ] ] == undefined) { 
								regions[ options[ inst['fields'][field_id] ] ] = 0; }
							regions[ options[ inst['fields'][field_id] ] ] += 1;
						}
					}
					for(var i in regions) {
						chartdata.push( [ i, regions[i] ] );
					}
				break;
				case 'p_6':
					// area, aka 'person_category'
					var field_id = service.find_field_id_members('person_category');
					if (field_id == '') { return; }
					var mem;
					var areas = new Object();
					var options = service.find_field_options_by_id_members(field_id);
					for (var i in service.members) {
						mem = service.members[i];
						if (mem['status'] != 'active') { continue; } // only check active members
						if ( mem['fields'][field_id] == undefined ) {
							if ( areas['Unknown'] == undefined) { areas['Unknown'] = 0; }
							areas['Unknown'] += 1;
						} else {
							if ( areas[ options[ mem['fields'][field_id] ] ] == undefined) { areas[ options[ mem['fields'][field_id] ] ] = 0; }
							areas[ options[ mem['fields'][field_id] ] ] += 1;
						}
					}
					for(var i in areas) {
						chartdata.push( [ i, areas[i] ] );
					}
				break;
				case 'p_3':
					// gender
					var field_id = service.find_field_id_members('gender');
					if (field_id == '') { return; }
					var mem;
					var genders = new Object();
					var options = service.find_field_options_by_id_members(field_id);
					
					for (var i in service.members) {
						mem = service.members[i];
						if (mem['status'] != 'active') { continue; } // only check active members
						if ( mem['fields'][field_id] == undefined ) {
							if (genders['Unspecified'] == undefined) { genders['Unspecified'] = 0; }
							genders['Unspecified'] += 1;
						} else {
							if (genders[ options[ mem['fields'][field_id] ] ] == undefined) { genders[ options[ mem['fields'][field_id] ] ] = 0; }
							genders[ options[ mem['fields'][field_id] ] ] += 1;
						}
					}
					for(var i in genders) {
						chartdata.push( [ i, genders[i] ] );
					}
					break;
				default:
					return; // unknown parameter
					break;
			}
		} else if ( type == 't_3' ) { // board members
			switch(param) {
				case 'p_7':
					// gender
					var field_id = service.find_field_id_members('gender');
					if (field_id == '') { return; }
					var mem;
					var genders = new Object();
					var options = service.find_field_options_by_id_members(field_id);
					for (var i in service.institutions) {
						if ( service.institutions[i]['status'] !== 'active' ) { continue; }
						var ifields = service.institutions[i]['fields']; // 9, 46, 47, 48 = rep ids
						if ( ifields[9] && ifields[9] != '' && ifields[9] != '0' ) {
							mem = service.members[ ifields[9] ];
							if ( mem['status'] == 'active' ) {
								if ( mem['fields'][field_id] == undefined ) {
									if (genders['Unspecified'] == undefined) { genders['Unspecified'] = 0; }
									genders['Unspecified'] += 1;
								} else {
									if (genders[ options[ mem['fields'][field_id] ] ] == undefined) { genders[ options[ mem['fields'][field_id] ] ] = 0; }
									genders[ options[ mem['fields'][field_id] ] ] += 1;
								}
							}
						}
						if ( ifields[46] && ifields[46] != '' && ifields[46] != '0' ) {
							mem = service.members[ ifields[46] ];
							if ( mem['status'] == 'active' ) {
								if ( mem['fields'][field_id] == undefined ) {
									if (genders['Unspecified'] == undefined) { genders['Unspecified'] = 0; }
									genders['Unspecified'] += 1;
								} else {
									if (genders[ options[ mem['fields'][field_id] ] ] == undefined) { genders[ options[ mem['fields'][field_id] ] ] = 0; }
									genders[ options[ mem['fields'][field_id] ] ] += 1;
								}
							}
						}
						if ( ifields[46] && ifields[47] != '' && ifields[47] != '0' ) {
							mem = service.members[ ifields[47] ];
							if ( mem['status'] == 'active' ) {
								if ( mem['fields'][field_id] == undefined ) {
									if (genders['Unspecified'] == undefined) { genders['Unspecified'] = 0; }
									genders['Unspecified'] += 1;
								} else {
									if (genders[ options[ mem['fields'][field_id] ] ] == undefined) { genders[ options[ mem['fields'][field_id] ] ] = 0; }
									genders[ options[ mem['fields'][field_id] ] ] += 1;
								}
							}
						}
						if ( ifields[48] && ifields[48] != '' && ifields[48] != '0' ) {
							mem = service.members[ ifields[48] ];
							if ( mem['status'] == 'active' ) {
								if ( mem['fields'][field_id] == undefined ) {
									if (genders['Unspecified'] == undefined) { genders['Unspecified'] = 0; }
									genders['Unspecified'] += 1;
								} else {
									if (genders[ options[ mem['fields'][field_id] ] ] == undefined) { genders[ options[ mem['fields'][field_id] ] ] = 0; }
									genders[ options[ mem['fields'][field_id] ] ] += 1;
								}
							}
						}
					}
					for(var i in genders) {
						chartdata.push( [ i, genders[i] ] );
					}
				break;
				case 'p_8':
					// area, aka 'person_category'
					var field_id = service.find_field_id_members('person_category');
					if (field_id == '') { return; }
					var mem;
					var areas = new Object();
					var options = service.find_field_options_by_id_members(field_id);
					for (var i in service.institutions) {
						if ( service.institutions[i]['status'] !== 'active' ) { continue; }
						var ifields = service.institutions[i]['fields']; // 9, 46, 47, 48 = rep ids

						if ( ifields[9] && ifields[9] != '' && ifields[9] != '0' ) {
							mem = service.members[ ifields[9] ];
							if (mem['status'] === 'active') { 
								if ( mem['fields'][field_id] == undefined ) {
									if ( areas['Unknown'] == undefined) { areas['Unknown'] = 0; }
									areas['Unknown'] += 1;
								} else {
									if ( areas[ options[ mem['fields'][field_id] ] ] == undefined) { areas[ options[ mem['fields'][field_id] ] ] = 0; }
									areas[ options[ mem['fields'][field_id] ] ] += 1;
								}
							}
						}
						if ( ifields[46] && ifields[46] != '' && ifields[46] != '0' ) {
							mem = service.members[ ifields[46] ];
							if (mem['status'] === 'active') { 
								if ( mem['fields'][field_id] == undefined ) {
									if ( areas['Unknown'] == undefined) { areas['Unknown'] = 0; }
									areas['Unknown'] += 1;
								} else {
									if ( areas[ options[ mem['fields'][field_id] ] ] == undefined) { areas[ options[ mem['fields'][field_id] ] ] = 0; }
									areas[ options[ mem['fields'][field_id] ] ] += 1;
								}
							}
						}
						if ( ifields[47] && ifields[47] != '' && ifields[47] != '0' ) {
							mem = service.members[ ifields[47] ];
							if (mem['status'] === 'active') { 
								if ( mem['fields'][field_id] == undefined ) {
									if ( areas['Unknown'] == undefined) { areas['Unknown'] = 0; }
									areas['Unknown'] += 1;
								} else {
									if ( areas[ options[ mem['fields'][field_id] ] ] == undefined) { areas[ options[ mem['fields'][field_id] ] ] = 0; }
									areas[ options[ mem['fields'][field_id] ] ] += 1;
								}
							}
						}
						if ( ifields[48] && ifields[48] != '' && ifields[48] != '0' ) {
							mem = service.members[ ifields[48] ];
							if (mem['status'] === 'active') { 
								if ( mem['fields'][field_id] == undefined ) {
									if ( areas['Unknown'] == undefined) { areas['Unknown'] = 0; }
									areas['Unknown'] += 1;
								} else {
									if ( areas[ options[ mem['fields'][field_id] ] ] == undefined) { areas[ options[ mem['fields'][field_id] ] ] = 0; }
									areas[ options[ mem['fields'][field_id] ] ] += 1;
								}
							}
						}
					}
					for(var i in areas) {
						chartdata.push( [ i, areas[i] ] );
					}
				break;

				default:
			}

		} else {
			return; // unknown entity type
		}
		chartdata = chartdata.sort(Comparator);
		var chart = '';
		if (plot == 'pie') {
			chart = jQuery.jqplot ('chart-plot', [chartdata],{
					  seriesDefaults: {
					      renderer: $.jqplot.PieRenderer, 
					      rendererOptions: {
						      showDataLabels: true
					      }
					  },
					  legend: { show:true, location: 'e' }
				  });
		} else if (plot == 'bar') {
			chart = $.jqplot('chart-plot', [chartdata], {
				seriesDefaults:{
					renderer:$.jqplot.BarRenderer,
					pointLabels: {
						show: true,
						angle: 90
					},
					rendererOptions: {
						fillToZero: true,
						barDirection: 'vertical',
						barWidth : 10,
						barMargin : 15,
						barPadding : 1
					}
				},
				axes: {
						xaxis:{
							renderer: $.jqplot.CategoryAxisRenderer,
							labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
							tickRenderer: $.jqplot.CanvasAxisTickRenderer,
							tickOptions:{
								angle: -45
							}
						},
						yaxis: {
							padMin: 0
						}
					}
				});
		} else {
			return; // unknown plot type
		}

	},

	display_statistics: function() {
		var service = this;
		// count countries, institutions and members
		var num_inst = 0, num_mem = 0, num_auth = 0, num_expt = 0, num_junr = 0, num_emer = 0, num_shft = 0, num_cntr = 0, num_reg = 0;
		var num_accel = 0, num_theory = 0, num_experiment = 0, num_support = 0, num_other = 0;
		var inst_fld, cntr = new Array(), reg = new Array();
		for (var i in service.institutions) {
			if (service.institutions[i]['status'] != 'active') { continue; }
			num_inst += 1;
			
			inst_fld = service.institutions[i]['fields'];
			if (inst_fld[34] != undefined && $.inArray(inst_fld[34], cntr) == -1) {
				cntr.push(inst_fld[34]);
			}
			if (inst_fld[40] != undefined && $.inArray(inst_fld[40], reg) == -1) {
				reg.push(inst_fld[40]);
			}
		}
		var now = Math.round(+new Date()/1000); // unixtime
		for (var i in service.members) {
			if (service.members[i]['status'] != 'active') { continue; }
			if (service.members[i]['fields'][86] != undefined && strtotime(service.members[i]['fields'][86]) < now) { continue; }
			num_mem += 1;
			if (service.members[i]['fields'][40] == 'y') { num_auth += 1; }
			if (service.members[i]['fields'][43] == 'y') { num_expt += 1; }
			if (service.members[i]['fields'][42] == 'y') { num_shft += 1; }
			if (service.members[i]['fields'][44] == 'y') { num_emer += 1; }
			if (service.members[i]['fields'][41] == 'y') { num_junr += 1; }
            if (service.members[i]['fields'][89] == 't') { num_theory += 1; }
            else if (service.members[i]['fields'][89] == 'a') { num_accel += 1; }
            else if (service.members[i]['fields'][89] == 'e') { num_experiment += 1; }
            else if (service.members[i]['fields'][89] == 's') { num_support += 1; }
            else { num_other += 1; }
		}
		num_cntr = cntr.length;
		num_reg  = reg.length;

		// display
		if ($("#system-statistics-dialog").length > 0) {
			$('#system-statistics-dialog').remove();
		}
		$('.ui-layout-center').append('<div id="system-statistics-dialog" title="Phonebook statistics"></div>');
		
		var selects = '<p>I. EIC Users Group: <ul><li><b>'+num_mem+'</b> members</li><li><b>'+num_inst+'</b> institutions</li><li><b>'+num_cntr+'</b> countries (<b>'+num_reg+'</b> world regions)</li></ul> </p>';
            selects += '<p>Experiment Scientists: <b>' + num_experiment + '</b>, Theory Scientists: <b>' + num_theory + '</b>, Accelerator Scientists: <b>' + num_accel + '</b>, Support: <b>' + num_support + '</b>, Other: <b>'+num_other+'</b></p>';
			selects += '<p>II. Please select desired GRAPH options:</p>';
			selects += '<select name="stat-type_id" id="stat-type" class="mod_select" style="display: inline-block; margin-left: 20px;">';
			selects += '<option value="">--- Select Type ---</option>';
			selects += '<option value="t_1">Institutions</option>';
			selects += '<option value="t_2">Members</option>';
			selects += '<option value="t_3">Board Members</option>';
			selects += '</select>';
			selects	+= '<select name="stat-param_id" id="stat-param" style="display: inline-block; margin-left: 20px;">';
			selects += '<option value="">--- Select Parameter ---</option>';
			selects += '<option value="p_1" class="t_1">Region of the World</option>';
			selects += '<option value="p_2" class="t_1">Country</option>';
			selects += '<option value="p_3" class="t_2">Gender</option>';
			selects += '<option value="p_4" class="t_2">Region of the World</option>';
			selects += '<option value="p_5" class="t_2">Country</option>';
			selects += '<option value="p_6" class="t_2">Area</option>';
			selects += '<option value="p_7" class="t_3">Gender</option>';
			selects += '<option value="p_8" class="t_3">Area</option>';
			selects += '</select>';
			selects	+= '<select name="stat-plot_id" id="stat-plot" style="display: inline-block; margin-left: 20px;">';
			selects += '<option value="">--- Select Plot Type ---</option>';
			selects += '<option value="bar" class="p_1 p_2 p_4 p_5 p_8" >Bar Chart</option>';
			selects += '<option value="pie" class="p_1 p_2 p_3 p_4 p_5 p_6 p_7 p_8">Pie Chart</option>';
			selects += '</select>';
		$('#system-statistics-dialog').html(selects);
		$( "#system-statistics-dialog" ).dialog({
			modal: true,
			autoOpen: true,
			height: 400,
			width:  800,
			buttons: {
				Ok: function() {
					service.display_chart($('#stat-type :selected').val(), $('#stat-param :selected').val(), $('#stat-plot :selected').val());
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
		});
		$('#stat-param').chained('#stat-type');
		$('#stat-plot').chained('#stat-param');
	},

	display_confirmation_dialog: function(message, callback_success) {
		if ($("#system-confirmation-dialog").length > 0) {
			$('#system-confirmation-dialog').remove();
		}
		$('.ui-layout-center').append('\
			<div id="system-confirmation-dialog" title="">\
				<p>\
					<span class="ui-icon ui-icon-alert" style="float: left; margin: 0 7px 50px 0;"></span>\
					'+message+'\
				</p>\
			</div>\
		');
		$( "#system-confirmation-dialog" ).dialog({
			modal: true,
			buttons: {
				Ok: function() {
					$( this ).dialog( "close" );
					callback_success();
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
		});
	},

	display_notification_dialog: function(message) {
		if ($("#system-notification-dialog").length > 0) {
			$('#system-notification-dialog').remove();
		}
		$('.ui-layout-center').append('\
			<div id="system-notification-dialog" title="Notification">\
				<p>\
					<span class="ui-icon ui-icon-alert" style="float: left; margin: 0 7px 50px 0;"></span>\
					'+message+'\
				</p>\
			</div>\
		');
		$( "#system-notification-dialog" ).dialog({
			modal: true,
			buttons: {
				Ok: function() {
					$( this ).dialog( "close" );
				}
			}
		});
	},

	display_institution_fields: function() {
		var service = this;
        var label = 'Manage: institution fields';
        var tabid = service.addTab(label);
        $('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
		$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtinstfields-'+service.tabCounter+'-'+tabid+'"></table>');

		var header = [ {"sTitle": "id", "sClass": "td_align_center"}, {"sTitle": "weight", "sClass": "td_align_center"}, {"sTitle": "Fixed name"}, {"sTitle": "Description"}, {"sTitle": "Group", "sClass": "td_align_center"}, 
				{"sTitle": "is required?", "sClass": "td_align_center"}, {"sTitle": "is enabled?", "sClass": "td_align_center"}, {'sTitle': 'Privacy mode', 'sClass': 'td_align_center'} ];
		var mdata = [];
		var values = [];
		for (var m = 0; m < service.institutions_fields_ordered.length; m++) {
			var i = service.institutions_fields_ordered[m];
			var fields = service.institutions_fields[i];
			var is_required = fields["is_required"] == 'y' ? '<span class="green">Yes</span>' : '<span class="red">No</span>';
			var is_enabled = fields["is_enabled"] == 'y' ? '<span class="green">Yes</span>' : '<span class="red">No</span>';
			mdata.push([ fields["id"], fields["weight"], fields["name_fixed"], fields["name_desc"], service.institutions_fields_groups[fields["group"]]["name_full"], 
				is_required, is_enabled, fields['privacy'] 
			]);
		}
		var dtable = $('#dtinstfields-'+service.tabCounter+'-'+tabid).dataTable({
			"bJQueryUI": true, 
			"bSort": false,
			"bProcessing": true,
			"bPaginate": false,
			"sScrollY": $('#'+tabid).height() - 90,
			"aaData": mdata,
			"aoColumns": header
		});
		$('<button id="dtinstfieldsadd-'+service.tabCounter+'-'+tabid+'" style="margin-right: 20px;"><img src="images/icons/add.png" border=0 style="vertical-align: middle;"> ADD FIELD</button>').prependTo('#dtinstfields-'+service.tabCounter+'-'+tabid+'_filter');
		$('#dtinstfieldsadd-'+service.tabCounter+'-'+tabid).button()
			.click(function( event ) {
				if ($("#addfield-institution-dialog").length > 0) {
					$('#addfield-institution-dialog').remove();
				}
				$('.ui-layout-center').append('\
						<div id="addfield-institution-dialog" title="Add field to Institution object">\
						<form>\
						<fieldset id="addfield-institution-fieldset">\
						</fieldset>\
						</form>\
						</div>\
				');
				var fields = service.institution_fields;
				var sOut = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
				var fields = service.institutions_fields[1]
				for (j in fields) {
					switch (j) {
						case 'id':
							break;
						case 'group':
							sOut += '<tr><td>'+j+'</td><td><select name="addfield-inst-'+service.tabCounter+'-'+tabid+'-'+j+'">';
							var groups = service.institutions_fields_groups;
							for (var j in groups) {
								sOut += '<option value="'+groups[j]['id']+'">'+groups[j]['name_full']+'</option>';
							}
							sOut += '</select></td></tr>';
							break;
						case 'type':
							sOut += '<tr><td>'+j+'</td><td><select name="addfield-inst-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="string">String</option><option value="int">Int</option><option value="date">Date</option></select></td></tr>';
							break;
						case 'is_required':
						case 'is_enabled':
							sOut += '<tr><td>'+j+'</td><td><select name="addfield-inst-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="y">Yes</option><option value="n">No</option></select></td></tr>';
							break;
						case 'privacy':
							sOut += '<tr><td>'+j+'</td><td><select name="addfield-inst-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="public">Public</option><option value="users_auth">Authenticated Only</option><option value="users_admin">Admins Only</option></select></td></tr>';
							break;
						default:
							sOut += '<tr><td>'+j+'</td><td><input name="addfield-inst-'+service.tabCounter+'-'+tabid+'-'+j+'" type="edit" value=""></td></tr>';
							break;
					}
				}
				sOut += '</table>';
				$('#addfield-institution-fieldset').append(sOut);
				$('#addfield-institution-dialog').dialog({
					autoOpen: true,
					height: 520,
					width: 400,
					modal: true,
					buttons: {
						"Create Institution Field": function() {
							// scan fields, compare with existing values, prepare POST request, close member tab, open new member tab
							var fields = service.institutions_fields[1];
							var result = {};
								result["data"] = {};
							var missing_fields = [];
							for (var j in fields) {
								if (j == 'id' || j == 'options') { continue; }
								var value = $('[name="addfield-inst-'+service.tabCounter+'-'+tabid+'-'+j+'"]').val();
								if (value == undefined || value == '') { missing_fields.push(j); }
								result["data"][j] = value;
							}
							if (missing_fields.length != 0) {
								service.display_notification_dialog('All fields are required to be filled in!<br><br>Please fill the following fields: <span class="red"><b>'+missing_fields.join(", ")+'</b></span>');
							} else {
							$.ajax({
								url: service.service_url+'?q=/service/create/object:fields/type:institutions',
								type: 'POST',
								processData: false,
								data: JSON.stringify(result),
								contentType: 'application/json; charset=utf-8',
								dataType: 'json',
								success: function(data) {
									service.get_institutions_fields(function() { 
										$('li[aria-controls="'+tabid+'"]').remove();
										$('#'+tabid).remove();
										$("#tabs").tabs( "refresh" );
										service.display_institution_fields();
									});
								}
							});
							$(this).dialog( "close" );
							}
						},
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
						
					}
				});
				event.preventDefault();
			});

		$('#dtinstfields-'+service.tabCounter+'-'+tabid+' tbody').delegate("tr", "click", function() {
			var pos = dtable.fnGetPosition( this );
			var host = this;
			if ($(this).attr('details-data') == undefined || $(this).attr('details-data') != "1") {
				if (pos != null) {
					var aData = dtable.fnGetData(pos);
					var sOut = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
						var fields = service.institutions_fields[aData[0]]
						for (j in fields) {
							switch (j) {
								case 'group':
									sOut += '<tr><td>'+j+'</td><td>'+service.institutions_fields_groups[fields[j]]['name_full']+'</td></tr>';
									break;
								case 'id':
								case 'type':
									sOut += '<tr><td>'+j+'</td><td>'+fields[j]+'</td></tr>';
									break;
								case 'is_required':
								case 'is_enabled':
									sOut += '<tr><td>'+j+'</td><td><select id="instfields-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="y" '+( (fields[j] == 'y') ? 'selected=selected': '' )+'>Yes</option><option value="n" '+( (fields[j] == 'n') ? 'selected=selected': '' )+'>No</option></select></td></tr>';
									break;
								case 'privacy':
									sOut += '<tr><td>'+j+'</td><td><select id="instfields-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="public" '+( (fields[j] == 'public') ? 'selected=selected': '' )+'>Public</option><option value="users_auth" '+( (fields[j] == 'users_auth') ? 'selected=selected': '' )+'>Authenticated Users</option><option value="users_admin" '+( (fields[j] == 'users_admin') ? 'selected=selected': '' )+'>Admins Only</option></select></td></tr>';
									break;
								default:
									sOut += '<tr><td>'+j+'</td><td><input id="instfields-'+service.tabCounter+'-'+tabid+'-'+j+'" type="edit" value="'+fields[j]+'"></td></tr>';
									break;
							}
						}
						sOut += '<tr align="center"><td colspan="2"><button id="instfields-update-'+service.tabCounter+'-'+tabid+'">UPDATE FIELDS</button> <button id="instfields-cancel-'+service.tabCounter+'-'+tabid+'">CANCEL</button></td></tr>';
						sOut += '</table>';
					dtable.fnOpen( this, sOut, 'details');
					$('#instfields-update-'+service.tabCounter+'-'+tabid).click(function() {
						var fields_updated = {};
						fields_updated["data"] = {};
						fields_updated["data"][aData[0]] = {};
						var fields = service.institutions_fields[aData[0]]
						for (j in fields) {
							if (j != 'group' && j != 'id' && j != 'type') {
								var value_old = fields[j];
								var value_new = $('#instfields-'+service.tabCounter+'-'+tabid+'-'+j).val();
								if (value_old != value_new) {
									fields_updated["data"][aData[0]][j] = value_new;
								}
							}
						}
						$.ajax({
							url: service.service_url+'?q=/service/modify/object:fields/type:institutions',
							type: 'POST',
							processData: false,
							data: JSON.stringify(fields_updated),
							contentType: 'application/json; charset=utf-8',
							dataType: 'json',
							success: function(data) {
								service.get_institutions_fields(function() { 
									$('li[aria-controls="'+tabid+'"]').remove();
									$('#'+tabid).remove();
									$("#tabs").tabs( "refresh" );
									service.display_institution_fields();
								});
							}
						})
					});
					$('#instfields-cancel-'+service.tabCounter+'-'+tabid).click(function() {
						dtable.fnClose(host);
					});

				}
				$(this).attr('details-data', '1');
			} else {
				$(this).attr('details-data', '0');
				dtable.fnClose(this);
			}
		});

	},

	display_institution_fieldgroups: function() {
		var service = this;
        var label = 'Manage: institution fieldgroups';
        var tabid = service.addTab(label);
        $('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
		$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtinstgroups-'+service.tabCounter+'-'+tabid+'"></table>');

		var header = [ {"sTitle": "id", "sClass": "td_align_center"}, {"sTitle": "Short name"}, {"sTitle": "Full Name"}, 
			{'sTitle': 'is enabled?', 'sClass': 'td_align_center'}, {"sTitle": "weight", "sClass": "td_align_center"} ];
		var mdata = [];
		var values = [];
		for (var m = 0; m < service.institutions_fields_groups_ordered.length; m++) {
			var i = service.institutions_fields_groups_ordered[m];
			var fields = service.institutions_fields_groups[i];
			var is_enabled = '';
			if (fields['is_enabled'] == 'y') {
				is_enabled = '<span class="green">Yes</span>';
			} else {
				is_enabled = '<span class="red">No</span>';
			}
			mdata.push([ fields["id"], fields["name_short"], fields["name_full"], is_enabled, fields["weight"] ]);
		}
		var dtable = $('#dtinstgroups-'+service.tabCounter+'-'+tabid).dataTable({
			"bJQueryUI": true, 
			"bSort": false,
			"bPaginate": false,
			"sScrollY": $('#'+tabid).height() - 90,
			"aaData": mdata,
			"aoColumns": header
		});
		$('<button id="dtinstfieldsgroupsadd-'+service.tabCounter+'-'+tabid+'" style="margin-right: 20px;"><img src="images/icons/add.png" border=0 style="vertical-align: middle;"> ADD GROUP</button>').prependTo('#dtinstgroups-'+service.tabCounter+'-'+tabid+'_filter');
		$('#dtinstfieldsgroupsadd-'+service.tabCounter+'-'+tabid).button()
			.click(function( event ) {
				if ($("#addfieldgroup-institution-dialog").length > 0) {
					$('#addfieldgroup-institution-dialog').remove();
				}
				$('.ui-layout-center').append('\
						<div id="addfieldgroup-institution-dialog" title="Add field group to Institution object">\
						<form>\
						<fieldset id="addfieldgroup-institution-fieldset">\
						</fieldset>\
						</form>\
						</div>\
				');
				var fields = service.institution_fields_groups;
				var sOut = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
				var fields = service.institutions_fields_groups[1]
				for (j in fields) {
					switch (j) {
						case 'id':
							break;
						case 'is_enabled':
							sOut += '<tr><td>'+j+'</td><td><select name="addfieldgroup-inst-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="y">Yes</option><option value="n">No</option></select></td></tr>';
							break;
						default:
							sOut += '<tr><td>'+j+'</td><td><input name="addfieldgroup-inst-'+service.tabCounter+'-'+tabid+'-'+j+'" type="edit" value=""></td></tr>';
							break;
					}
				}
				sOut += '</table>';
				$('#addfieldgroup-institution-fieldset').append(sOut);
				$('#addfieldgroup-institution-dialog').dialog({
					autoOpen: true,
					height: 320,
					width: 400,
					modal: true,
					buttons: {
						"Create Institution FieldGroup": function() {
							// scan fields, compare with existing values, prepare POST request, close member tab, open new member tab
							var fields = service.institutions_fields_groups[1];
							var result = {};
								result["data"] = {};
							var missing_fields = [];
							for (var j in fields) {
								if (j == 'id') { continue; }
								var value = $('[name="addfieldgroup-inst-'+service.tabCounter+'-'+tabid+'-'+j+'"]').val();
								if (value == undefined || value == '') { missing_fields.push(j); }
								result["data"][j] = value;
							}
							if (missing_fields.length != 0) {
								service.display_notification_dialog('All fields are REQUIRED to be filled in.<br><br>Please fill in the following fields: <span class="red"><b>'+missing_fields.join(', ')+'</b></span>');
							} else {
							$.ajax({	
								url: service.service_url+'?q=/service/create/object:fieldgroups/type:institutions',
								type: 'POST',
								processData: false,
								data: JSON.stringify(result),
								contentType: 'application/json; charset=utf-8',
								dataType: 'json',
								success: function(data) {
									service.get_institutions_fields_groups(function() { 
										$('li[aria-controls="'+tabid+'"]').remove();
										$('#'+tabid).remove();
										$("#tabs").tabs( "refresh" );
										service.display_institution_fieldgroups();
									});
								}
							});
							$(this).dialog( "close" );
							}
						},
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
						
					}
				});

				event.preventDefault();
			});
		$('#dtinstgroups-'+service.tabCounter+'-'+tabid+' tbody').delegate("tr", "click", function() {
			var pos = dtable.fnGetPosition( this );
			var host = this;
			if ($(this).attr('details-data') == undefined || $(this).attr('details-data') != "1") {
				if (pos != null) {
					var aData = dtable.fnGetData(pos);
					var sOut = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
						var fields = service.institutions_fields_groups[aData[0]]
						for (j in fields) {
							switch (j) {
								case 'id':
									sOut += '<tr><td>'+j+'</td><td>'+fields[j]+'</td></tr>';
									break;
								case 'is_enabled':
									sOut += '<tr><td>'+j+'</td><td><select id="instgroups-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="y" '+( (fields[j] == 'y') ? 'selected=selected': '' )+'>Yes</option><option value="n" '+( (fields[j] == 'n') ? 'selected=selected': '' )+'>No</option></select></td></tr>';
									break;
								default:
									sOut += '<tr><td>'+j+'</td><td><input id="instgroups-'+service.tabCounter+'-'+tabid+'-'+j+'" type="edit" value="'+fields[j]+'"></td></tr>';
									break;
							}
						}
						sOut += '<tr align="center"><td colspan="2"><button id="instgroups-update-'+service.tabCounter+'-'+tabid+'">UPDATE GROUP</button> <button id="instgroups-cancel-'+service.tabCounter+'-'+tabid+'">CANCEL</button></td></tr>';
						sOut += '</table>';
					dtable.fnOpen( this, sOut, 'details');
					$('#instgroups-update-'+service.tabCounter+'-'+tabid).click(function() {
						var fields_updated = {};
						fields_updated["data"] = {};
						fields_updated["data"][aData[0]] = {};
						var fields = service.institutions_fields_groups[aData[0]]
						for (j in fields) {
							if (j != 'group' && j != 'id' && j != 'type') {
								var value_old = fields[j];
								var value_new = $('#instgroups-'+service.tabCounter+'-'+tabid+'-'+j).val();
								if (value_old != value_new) {
									fields_updated["data"][aData[0]][j] = value_new;
								}
							}
						}
						console.log(fields_updated);
						$.ajax({
							url: service.service_url+'?q=/service/modify/object:fieldgroups/type:institutions',
							type: 'POST',
							processData: false,
							data: JSON.stringify(fields_updated),
							contentType: 'application/json; charset=utf-8',
							dataType: 'json',
							success: function(data) {
								service.get_institutions_fields_groups(function() { 
									$('li[aria-controls="'+tabid+'"]').remove();
									$('#'+tabid).remove();
									$("#tabs").tabs( "refresh" );
									service.display_institution_fieldgroups();
								});
							}
						})
					});
					$('#instgroups-cancel-'+service.tabCounter+'-'+tabid).click(function() {
						dtable.fnClose(host);
					});
				}
				$(this).attr('details-data', '1');
			} else {
				$(this).attr('details-data', '0');
				dtable.fnClose(this);
			}
		});
	},

	display_member_fieldgroups: function() {
		var service = this;
        var label = 'Manage: member fieldgroups';
        var tabid = service.addTab(label);
        $('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
		$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtmemgroups-'+service.tabCounter+'-'+tabid+'"></table>');

		var header = [ {"sTitle": "id", "sClass": "td_align_center"}, {"sTitle": "Short name"}, {"sTitle": "Full Name"}, 
					{'sTitle': 'is enabled?', 'sClass': 'td_align_center'}, {"sTitle": "weight", "sClass": "td_align_center"} ];
		var mdata = [];
		var values = [];
		for (var m = 0; m < service.members_fields_groups_ordered.length; m++) {
			var i = service.members_fields_groups_ordered[m];
			var fields = service.members_fields_groups[i];
			if (fields['is_enabled'] == 'y') {
				is_enabled = '<span class="green">Yes</span>';
			} else {
				is_enabled = '<span class="red">No</span>';
			}
			mdata.push([ fields["id"], fields["name_short"], fields["name_full"], is_enabled, fields["weight"] ]);
		}
		var dtable = $('#dtmemgroups-'+service.tabCounter+'-'+tabid).dataTable({
			"bJQueryUI": true, 
			"bSort": false,
			"bPaginate": false,
			"sScrollY": $('#'+tabid).height() - 90,
			"aaData": mdata,
			"aoColumns": header
		});
		$('<button id="dtmemfieldsgroupsadd-'+service.tabCounter+'-'+tabid+'" style="margin-right: 20px;"><img src="images/icons/add.png" border=0 style="vertical-align: middle;"> ADD GROUP</button>').prependTo('#dtmemgroups-'+service.tabCounter+'-'+tabid+'_filter');
		$('#dtmemfieldsgroupsadd-'+service.tabCounter+'-'+tabid).button()
			.click(function( event ) {
				if ($("#addfieldgroup-member-dialog").length > 0) {
					$('#addfieldgroup-member-dialog').remove();
				}
				$('.ui-layout-center').append('\
						<div id="addfieldgroup-member-dialog" title="Add field group to Member object">\
						<form>\
						<fieldset id="addfieldgroup-member-fieldset">\
						</fieldset>\
						</form>\
						</div>\
				');
				var sOut = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
				var fields = service.members_fields_groups[1]
				for (j in fields) {
					switch (j) {
						case 'id':
							break;
						case 'is_enabled':
							sOut += '<tr><td>'+j+'</td><td><select name="addfieldgroup-mem-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="y">Yes</option><option value="n">No</option></select></td></tr>';
							break;
						default:
							sOut += '<tr><td>'+j+'</td><td><input name="addfieldgroup-mem-'+service.tabCounter+'-'+tabid+'-'+j+'" type="edit" value=""></td></tr>';
							break;
					}
				}
				sOut += '</table>';
				$('#addfieldgroup-member-fieldset').append(sOut);
				$('#addfieldgroup-member-dialog').dialog({
					autoOpen: true,
					height: 320,
					width: 400,
					modal: true,
					buttons: {
						"Create Member FieldGroup": function() {
							// scan fields, compare with existing values, prepare POST request, close member tab, open new member tab
							var fields = service.institutions_fields_groups[1];
							var result = {};
								result["data"] = {};
							var missing_fields = [];
							for (var j in fields) {
								if (j == 'id') { continue; }
								var value = $('[name="addfieldgroup-mem-'+service.tabCounter+'-'+tabid+'-'+j+'"]').val();
								if (value == undefined || value == '') { missing_fields.push(j); }
								result["data"][j] = value;
							}
							if (missing_fields.length != 0) {
								service.display_notification_dialog('All fields are required to be filled in.<br><br>Please fill in the following fields: <span class="red"><b>'+missing_fields.join(", ")+'</b></span>');
							} else {
							$.ajax({
								url: service.service_url+'?q=/service/create/object:fieldgroups/type:members',
								type: 'POST',
								processData: false,
								data: JSON.stringify(result),
								contentType: 'application/json; charset=utf-8',
								dataType: 'json',
								success: function(data) {
									service.get_members_fields_groups( function() { 
										$('li[aria-controls="'+tabid+'"]').remove();
										$('#'+tabid).remove();
										$("#tabs").tabs( "refresh" );
										service.display_member_fieldgroups();
									} );
								}
							});
							$(this).dialog( "close" );
							}
						},
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
						
					}
				});

				event.preventDefault();
			});

		$('#dtmemgroups-'+service.tabCounter+'-'+tabid+' tbody').delegate("tr", "click", function() {
			var pos = dtable.fnGetPosition( this );
			var host = this;
			if ($(this).attr('details-data') == undefined || $(this).attr('details-data') != "1") {
				if (pos != null) {
					var aData = dtable.fnGetData(pos);
					var sOut = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
						var fields = service.members_fields_groups[aData[0]]
						for (j in fields) {
							switch (j) {
								case 'id':
									sOut += '<tr><td>'+j+'</td><td>'+fields[j]+'</td></tr>';
									break;
								case 'is_enabled':
									sOut += '<tr><td>'+j+'</td><td><select id="memgroups-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="y" '+( (fields[j] == 'y') ? 'selected=selected': '' )+'>Yes</option><option value="n" '+( (fields[j] == 'n') ? 'selected=selected': '' )+'>No</option></select></td></tr>';
									break;
								default:
									sOut += '<tr><td>'+j+'</td><td><input id="memgroups-'+service.tabCounter+'-'+tabid+'-'+j+'" type="edit" value="'+fields[j]+'"></td></tr>';
									break;
							}
						}
						sOut += '<tr align="center"><td colspan="2"><button id="memgroups-update-'+service.tabCounter+'-'+tabid+'">UPDATE GROUP</button> <button id="memgroups-cancel-'+service.tabCounter+'-'+tabid+'">CANCEL</button></td></tr>';
						sOut += '</table>';
					dtable.fnOpen( this, sOut, 'details');
					$('#memgroups-update-'+service.tabCounter+'-'+tabid).click(function() {
						var fields_updated = {};
						fields_updated["data"] = {};
						fields_updated["data"][aData[0]] = {};
						var fields = service.members_fields_groups[aData[0]]
						for (j in fields) {
							if (j != 'group' && j != 'id' && j != 'type') {
								var value_old = fields[j];
								var value_new = $('#memgroups-'+service.tabCounter+'-'+tabid+'-'+j).val();
								if (value_old != value_new) {
									fields_updated["data"][aData[0]][j] = value_new;
								}
							}
							console.log(fields_updated);
						}
						$.ajax({
							url: service.service_url+'?q=/service/modify/object:fieldgroups/type:members',
							type: 'POST',
							processData: false,
							data: JSON.stringify(fields_updated),
							contentType: 'application/json; charset=utf-8',
							dataType: 'json',
							success: function(data) {
								service.get_members_fields_groups(function() { 
									$('li[aria-controls="'+tabid+'"]').remove();
									$('#'+tabid).remove();
									$("#tabs").tabs( "refresh" );
									service.display_member_fieldgroups();
								});
							}
						})
					});
					$('#memfields-cancel-'+service.tabCounter+'-'+tabid).click(function() {
						dtable.fnClose(host);
					});
				}
				$(this).attr('details-data', '1');
			} else {
				$(this).attr('details-data', '0');
				dtable.fnClose(this);
			}
		});

	},

	display_member_fields: function() {
		var service = this;
        var label = 'Manage: member fields';
        var tabid = service.addTab(label);
        $('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
		$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtmemfields-'+service.tabCounter+'-'+tabid+'"></table>');

		var header = [ {"sTitle": "id", "sClass": "td_align_center"}, {"sTitle": "weight", "sClass": "td_align_center"}, {"sTitle": "Fixed name"}, {"sTitle": "Description"}, {"sTitle": "Group", "sClass": "td_align_center"}, 
				{"sTitle": "is required?", "sClass": "td_align_center"}, {"sTitle": "is enabled?", "sClass": "td_align_center"}, {'sTitle': 'Privacy mode', 'sClass':'td_align_center'} ];
		var mdata = [];
		var values = [];
		for (var m = 0; m < service.members_fields_ordered.length; m++) {
			var i = service.members_fields_ordered[m];
			var fields = service.members_fields[i];
			var is_required = fields["is_required"] == 'y' ? '<span class="green">Yes</span>' : '<span class="red">No</span>';
			var is_enabled = fields["is_enabled"] == 'y' ? '<span class="green">Yes</span>' : '<span class="red">No</span>';
			mdata.push([ fields["id"], fields["weight"], fields["name_fixed"], fields["name_desc"], service.members_fields_groups[fields["group"]]["name_full"], is_required, is_enabled, fields['privacy'] ]);
		}
		var dtable = $('#dtmemfields-'+service.tabCounter+'-'+tabid).dataTable({
			"bJQueryUI": true, 
			"bSort": false,
			"bPaginate": false,
			"sScrollY": $('#'+tabid).height() - 90,
			"aaData": mdata,
			"aoColumns": header
		});
		$('<button id="dtmemfieldsadd-'+service.tabCounter+'-'+tabid+'" style="margin-right: 20px;"><img src="images/icons/add.png" border=0 style="vertical-align: middle;"> ADD FIELD</button>').prependTo('#dtmemfields-'+service.tabCounter+'-'+tabid+'_filter');
		$('#dtmemfieldsadd-'+service.tabCounter+'-'+tabid).button()
			.click(function( event ) {
				if ($("#addfield-member-dialog").length > 0) {
					$('#addfield-member-dialog').remove();
				}
				$('.ui-layout-center').append('\
						<div id="addfield-member-dialog" title="Add field to Member object">\
						<form>\
						<fieldset id="addfield-member-fieldset">\
						</fieldset>\
						</form>\
						</div>\
				');
				var sOut = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
				var fields = service.members_fields[1]
				for (j in fields) {
					switch (j) {
						case 'id':
							break;
						case 'group':
							sOut += '<tr><td>'+j+'</td><td><select name="addfield-mem-'+service.tabCounter+'-'+tabid+'-'+j+'">';
							var groups = service.members_fields_groups;
							for (var j in groups) {
								sOut += '<option value="'+groups[j]['id']+'">'+groups[j]['name_full']+'</option>';
							}
							sOut += '</select></td></tr>';
							break;
						case 'type':
							sOut += '<tr><td>'+j+'</td><td><select name="addfield-mem-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="string">String</option><option value="int">Int</option><option value="date">Date</option></select></td></tr>';
							break;
						case 'is_required':
						case 'is_enabled':
							sOut += '<tr><td>'+j+'</td><td><select name="addfield-mem-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="y">Yes</option><option value="n">No</option></select></td></tr>';
							break;
						case 'privacy':
							sOut += '<tr><td>'+j+'</td><td><select name="addfield-mem-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="public">Public</option><option value="users_auth">Authenticated Users</option><option value="users_user">Owner Only</option><option value="users_admins">Admins Only</option></select></td></tr>';
							break;
						default:
							sOut += '<tr><td>'+j+'</td><td><input name="addfield-mem-'+service.tabCounter+'-'+tabid+'-'+j+'" type="edit" value=""></td></tr>';
							break;
					}
				}
				sOut += '</table>';
				$('#addfield-member-fieldset').append(sOut);
				$('#addfield-member-dialog').dialog({
					autoOpen: true,
					height: 520,
					width: 400,
					modal: true,
					buttons: {
						"Create Member Field": function() {
							// scan fields, compare with existing values, prepare POST request, close member tab, open new member tab
							var fields = service.institutions_fields[1];
							var result = {};
								result["data"] = {};
							var missing_fields = [];
							for (var j in fields) {
								if (j == 'id' || j == 'options') { continue; }
								var value = $('[name="addfield-mem-'+service.tabCounter+'-'+tabid+'-'+j+'"]').val();
								if (value == undefined || value == '') { missing_fields.push(j); }
								result["data"][j] = value;
							}
							if (missing_fields.length != 0) {
								service.display_notification_dialog('All fields are REQUIRED to be filled in.<br><br>Please fill in the following fields: <span class="red"><b>'+missing_fields.join(', ')+'</b></span>');
							} else {
							$.ajax({
								url: service.service_url+'?q=/service/create/object:fields/type:members',
								type: 'POST',
								processData: false,
								data: JSON.stringify(result),
								contentType: 'application/json; charset=utf-8',
								dataType: 'json',
								success: function(data) {
									service.get_members_fields( function() { 
										$('li[aria-controls="'+tabid+'"]').remove();
										$('#'+tabid).remove();
										$("#tabs").tabs( "refresh" );
										service.display_member_fields();
									} );
								}
							});
							$(this).dialog( "close" );
							}
						},
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
						
					}
				});


				event.preventDefault();
			});

		$('#dtmemfields-'+service.tabCounter+'-'+tabid+' tbody').delegate("tr", "click", function() {
			var pos = dtable.fnGetPosition( this );
			var host = this;
			if ($(this).attr('details-data') == undefined || $(this).attr('details-data') != "1") {
				if (pos != null) {
					var aData = dtable.fnGetData(pos);
					var sOut = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
						var fields = service.members_fields[aData[0]]
						for (j in fields) {
							switch (j) {
								case 'group':
									sOut += '<tr><td>'+j+'</td><td>'+service.members_fields_groups[fields[j]]['name_full']+'</td></tr>';
									break;
								case 'id':
								case 'type':
									sOut += '<tr><td>'+j+'</td><td>'+fields[j]+'</td></tr>';
									break;
								case 'is_required':
								case 'is_enabled':
									sOut += '<tr><td>'+j+'</td><td><select id="memfields-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="y" '+( (fields[j] == 'y') ? 'selected=selected': '' )+'>Yes</option><option value="n" '+( (fields[j] == 'n') ? 'selected=selected': '' )+'>No</option></select></td></tr>';
									break;
								case 'privacy':
									sOut += '<tr><td>'+j+'</td><td><select id="memfields-'+service.tabCounter+'-'+tabid+'-'+j+'"><option value="public" '+( (fields[j] == 'public') ? 'selected=selected': '' )+'>Public</option><option value="users_auth" '+( (fields[j] == 'users_auth') ? 'selected=selected': '' )+'>Authenticated users</option><option value="users_user" '+( (fields[j] == 'users_user') ? 'selected=selected': '' )+'>Owner Only</option><option value="users_admin" '+( (fields[j] == 'users_admin') ? 'selected=selected': '' )+'>Admins Only</option></select></td></tr>';
									break;
								default:
									sOut += '<tr><td>'+j+'</td><td><input id="memfields-'+service.tabCounter+'-'+tabid+'-'+j+'" type="edit" value="'+fields[j]+'"></td></tr>';
									break;
							}
						}
						sOut += '<tr align="center"><td colspan="2"><button id="memfields-update-'+service.tabCounter+'-'+tabid+'">UPDATE FIELDS</button> <button id="memfields-cancel-'+service.tabCounter+'-'+tabid+'">CANCEL</button></td></tr>';
						sOut += '</table>';
					dtable.fnOpen( this, sOut, 'details');
					$('#memfields-update-'+service.tabCounter+'-'+tabid).click(function() {
						var fields_updated = {};
						fields_updated["data"] = {};
						fields_updated["data"][aData[0]] = {};
						var fields = service.members_fields[aData[0]]
						for (j in fields) {
							if (j != 'group' && j != 'id' && j != 'type') {
								var value_old = fields[j];
								var value_new = $('#memfields-'+service.tabCounter+'-'+tabid+'-'+j).val();
								if (value_old != value_new) {
									fields_updated["data"][aData[0]][j] = value_new;
								}
							}
						}
						$.ajax({
							url: service.service_url+'?q=/service/modify/object:fields/type:members',
							type: 'POST',
							processData: false,
							data: JSON.stringify(fields_updated),
							contentType: 'application/json; charset=utf-8',
							dataType: 'json',
							success: function(data) {
								service.get_members_fields(function() { 
									$('li[aria-controls="'+tabid+'"]').remove();
									$('#'+tabid).remove();
									$("#tabs").tabs( "refresh" );
									service.display_member_fields();
								});
							}
						})
					});
					$('#memfields-cancel-'+service.tabCounter+'-'+tabid).click(function() {
						dtable.fnClose(host);
					});
				}
				$(this).attr('details-data', '1');
			} else {
				$(this).attr('details-data', '0');
				dtable.fnClose(this);
			}
		});

	},

    geocode_locate_address: function(address) {
        req = 'http://geocode-maps.yandex.ru/1.x/?geocode=' + encodeURIComponent(address) + '&lang=en-US&format=json';
        var res = jQuery.parseJSON( jQuery.ajax({ type: "GET", url: req, async:false }).responseText );
        if ( res['response']['GeoObjectCollection']['featureMember'][0] != undefined ) {
            var pts = res['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']['Point']['pos'].split(' ');
            var geotext = res['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']['metaDataProperty']['GeocoderMetaData']['text'];
            var lattitude = pts[1];
            var longitude = pts[0];
            return ({lat: lattitude, lon: longitude, desc: geotext});
        }
        return undefined;
    },

    display_worldmap: function() {
        var service = this;
        $('#worldmapdialog').remove();
        $('body').append('<div id="worldmapdialog"><div id="worldmap" style="height: 100%; width: 100%"></div></div>');
        $('#worldmapdialog').dialog({
            autoOpen: true,
            height: 768,
            width: 1024,
            modal: true,
            buttons: {
                "Close": function() {
                    $( this ).dialog( "close" );
                }
            },
            resizeStop: function(event, ui) {
                $('#worldmap').width( $('#worldmapdialog').width() - 20 );
                $('#worldmap').height( $('#worldmapdialog').height() - 20 );
            }
        });
        service.map = new L.Map('worldmap', { center: new L.LatLng(36.7528852,3.0245384), zoom: 2 });
        var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 1, maxZoom: 20, attribution: 'Map data  <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'});
        var google = new L.Google('ROADMAP');
        var google_sat = new L.Google('SATELLITE');
        var yandex = new L.Yandex();
        var yandex_hybrid = new L.Yandex('hybrid');
        service.map.addLayer(google);
        service.map.addControl(new L.Control.Layers( {'Google RoadMap': google, 'Google Satellite': google_sat, 'Open Street Map': osm, 'Yandex': yandex, 'Yandex Hybrid': yandex_hybrid }, {}));
        var lat_id = service.find_field_id_institutions('geo_lattitude');
        var lon_id = service.find_field_id_institutions('geo_longitude');
        for (var i in service.institutions) {
            inst = service.institutions[i];
            if ( inst['status'] != 'active' ) { continue; } // only check active institutions
            if ( inst['fields'][lat_id] == undefined || inst['fields'][lon_id] == undefined ) { continue; }
            var desc = '<nobr><div style="cursor: pointer; display: inline-block;" onClick="client.map.setView({lat: \''+inst['fields'][lat_id]+'\', lon: \''+inst['fields'][lon_id]+'\'},(client.map.getZoom()+3),{reset: false, animate: true});"><img src="images/zoom-in.png" border=0 alt="Zoom In"></div>&nbsp;';
            desc += '<span style="color: #1D78C8; font-size: 16px; font-family: verdana;">'+inst['fields'][1]+'</nobr></span></nobr><hr style="margin: 0; padding: 0; color: #CCC;"><span style="font-family: verdana; font-size: 14px;">';
            if (inst['fields'][10] != undefined && inst['fields'][10] != '') { desc += inst['fields'][10] + '<br>'; }
            if (inst['fields'][11] != undefined && inst['fields'][11] != '') { desc += inst['fields'][11] + '<br>'; }
            if (inst['fields'][12] != undefined && inst['fields'][13] != undefined) { desc += inst['fields'][12] +', ' + inst['fields'][13] + '<br>'; }
            if (inst['fields'][14] != undefined) { desc += '<img src="images/flags_iso_3166/16/'+inst['fields'][34].toLowerCase()+'.png" border=0 style="vertical-align: bottom;"> '+inst['fields'][14] + '<br>'; }
            desc += '</span>';
            L.marker([parseFloat(inst['fields'][lat_id]), parseFloat(inst['fields'][lon_id]) ]).bindPopup(desc, {maxWidth: 500}).addTo(service.map);
        }
    },

    display_geocode_dialog: function(pt, desc, search) {
        var service = this;
        $('#geocodedialog').remove();
        $('body').append('<div id="geocodedialog"><div id="geocodemap" style="height: 440px; width: 100%;"></div><input type="text" id="geocodeaddress" style="width: 600px;"><input type="button" id="geocodetry" value="Try this address"></div>');
		$('#geocodemap').disableSelection();
        $('#geocodeaddress').val(search);
        $('#geocodedialog').dialog({
            autoOpen: true,
            height: 600,
            width: 800,
            modal: true,
            buttons: {
                "Yeah, close enough": function() {
                    $('[name="instedit-geo_lattitude"]').val(pt[0]);
                    $('[name="instedit-geo_longitude"]').val(pt[1]);
                    $( this ).dialog( "close" );
                },
                "Cancel": function() {
                    $( this ).dialog( "close" );
                }
            }
        });
        var map = new L.Map('geocodemap', {center: new L.LatLng(pt[0], pt[1]), zoom: 13});
        var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 1, maxZoom: 20, attribution: 'Map data  <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'});
        map.addLayer(osm);
        var google = new L.Google('ROADMAP');
        var google_sat = new L.Google('SATELLITE');
        var yandex = new L.Yandex();
        map.addControl(new L.Control.Layers( {'Open Street Map': osm, 'Google RoadMap': google, 'Google Satellite': google_sat, 'Yandex': yandex}, {}));
        L.marker([pt[0], pt[1]]).bindPopup(desc).addTo(map);
        $('#geocodetry').click(function() {
            var update = service.geocode_locate_address( $('#geocodeaddress').val() );
            if (update == undefined) { alert('bad address, cannot locate anything like this..'); }
            else {
                $('#geocodemap').remove();
                $('#geocodedialog').prepend('<div id="geocodemap" style="height: 440px; width: 100%;"></div>');
                var map = new L.Map('geocodemap', {center: new L.LatLng(pt[0], pt[1]), zoom: 13});
                var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 1, maxZoom: 20, attribution: 'Map data  <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'});
                map.addLayer(osm);
                var google = new L.Google('ROADMAP');
                var google_sat = new L.Google('SATELLITE');
                var yandex = new L.Yandex();
                map.addControl(new L.Control.Layers( {'Open Street Map': osm, 'Google RoadMap': google, 'Google Satellite': google_sat, 'Yandex': yandex}, {}));
                L.marker([update.lat, update.lon]).bindPopup(update.desc).addTo(map);
                pt[0] = update.lat;
                pt[1] = update.lon;
            }
        });
    },

	display_filter_members: function() {
		var service = this;
		if ($("#filter-members-dialog").length > 0) {
			$('#filter-members-dialog').dialog('open');
		} else {
			var search_form = '<div id="filter-members-dialog" title="Filter members">';
			search_form += '<fieldset><legend>Filters</legend><p><input type="radio" name="filter_andor" class="filter_andor" value="0" checked=checked id="filter_andor1"><label for="filter_andor1">Match all criteria</label>';
			search_form += '<input type="radio" name="filter_andor" class="filter_andor" value="1" id="filter_andor2"><label for="filter_andor2">Match any criteria</label></p>';

			search_form += '<p class="member_filter_item"><select name="filter-members-field" id="filter-members-field">';
	        for (var i in service.members_fields) {
                var hint = [], tmp;
                if ( service.members_fields[i]['options'] && service.members_fields[i]['options'].length > 0 ) {
                  tmp = service.members_fields[i]['options'].split(',');
                  for ( var h = 0; h < tmp.length; h++ ) { hint.push( tmp[h].split(':')[0] ); }
                }
                if ( hint.length > 0 ) { hint = ' (= '+hint.join(' / ')+')'; } else { hint = ''; }
				search_form += '<option value="'+service.members_fields[i].id+'_m">M: '+service.members_fields[i].name_desc+hint+'</option>';
      		}
	        for (var j in service.institutions_fields) {
                var hint = [], tmp;
                if ( service.institutions_fields[j]['options'] && service.institutions_fields[j]['options'].length > 0 ) {
                  tmp = service.institutions_fields[j]['options'].split(',');
                  for ( var h = 0; h < tmp.length; h++ ) { hint.push( tmp[h].split(':')[0] ); }
                }
                if ( hint.length > 0 ) { hint = ' (= '+hint.join(' / ')+')'; } else { hint = ''; }
				search_form += '<option value="'+service.institutions_fields[j].id+'_i">I: '+service.institutions_fields[j].name_desc+hint+'</option>';
      		}

			search_form += '</select>';
			search_form += '<select name="filter-members-filter-type" id="filter-members-filter-type">\
			<option value="equals" selected=selected>equals to</option>\
			<option value="notequals">does not equal to</option>\
			<option value="contains">contains</option>\
			<option value="notcontains">does not contain</option>\
			<option value="startswith">starts with</option>\
			<option value="endswith">ends with</option>\
			<option value="empty">is empty</option>\
			<option value="notempty">is not empty</option>\
			</select>\
			<input id="filter-members-input" type="text" name="cvalue">\
			<button data-op="+" class="btn_click_filter">+</button> <button data-op="-" class="btn_click_filter">-</button>\
			</fieldset>\
			<table width="100%"><tr><td valign="top" width="50%">\
			<fieldset><legend>Display Fields</legend>';

            search_form += '<p class="member_display_item"><select name="filter-members-field-display" id="filter-members-field-display">';
            for (var i in service.members_fields) {
                search_form += '<option value="'+service.members_fields[i].id+'_m" '+(i == 1 ? 'selected=selected': '')+'>M: '+service.members_fields[i].name_desc+'</option>';
            }
            for (var j in service.institutions_fields) {
                search_form += '<option value="'+service.institutions_fields[j].id+'_i">I: '+service.institutions_fields[j].name_desc+'</option>';
            }
            search_form += '</select>';
            search_form += ' <button data-op="+" class="btn_click_filter_display">+</button> <button data-op="-" class="btn_click_filter_display">-</button></p>';

            search_form += '<p class="member_display_item"><select name="filter-members-field-display" id="filter-members-field-display">';
            for (var i in service.members_fields) {
                search_form += '<option value="'+service.members_fields[i].id+'_m" '+(i == 3 ? 'selected=selected': '')+'>M: '+service.members_fields[i].name_desc+'</option>';
            }
            for (var j in service.institutions_fields) {
                search_form += '<option value="'+service.institutions_fields[j].id+'_i">I: '+service.institutions_fields[j].name_desc+'</option>';
            }
            search_form += '</select>';
            search_form += ' <button data-op="+" class="btn_click_filter_display">+</button> <button data-op="-" class="btn_click_filter_display">-</button></p>';

            search_form += '<p class="member_display_item"><select name="filter-members-field-display" id="filter-members-field-display">';
            for (var i in service.members_fields) {
                search_form += '<option value="'+service.members_fields[i].id+'_m" '+(i == 20 ? 'selected=selected': '')+'>M: '+service.members_fields[i].name_desc+'</option>';
            }
            for (var j in service.institutions_fields) {
                search_form += '<option value="'+service.institutions_fields[j].id+'_i">I: '+service.institutions_fields[j].name_desc+'</option>';
            }
            search_form += '</select>';
            search_form += ' <button data-op="+" class="btn_click_filter_display">+</button> <button data-op="-" class="btn_click_filter_display">-</button></p>';

            search_form += '<p class="member_display_item"><select name="filter-members-field-display" id="filter-members-field-display">';
            for (var i in service.members_fields) {
                search_form += '<option value="'+service.members_fields[i].id+'_m">M: '+service.members_fields[i].name_desc+'</option>';
            }
            for (var j in service.institutions_fields) {
                search_form += '<option value="'+service.institutions_fields[j].id+'_i" '+(j == 1 ? 'selected=selected': '')+'>I: '+service.institutions_fields[j].name_desc+'</option>';
            }
            search_form += '</select>';
            search_form += ' <button data-op="+" class="btn_click_filter_display">+</button> <button data-op="-" class="btn_click_filter_display">-</button></p>';


			search_form += '</fieldset>\
            </td><td valign="top" width="50%">\
            <fieldset><legend>Sort By Fields (order matters)</legend>';

            search_form += '<p class="member_sort_item"><select name="filter-members-field-sort" id="filter-members-field-sort">';
            for (var i in service.members_fields) {
                search_form += '<option value="'+service.members_fields[i].id+'_m">M: '+service.members_fields[i].name_desc+'</option>';
            }
            for (var j in service.institutions_fields) {
                search_form += '<option value="'+service.institutions_fields[j].id+'_i" '+(j == 1 ? 'selected=selected': '')+'>I: '+service.institutions_fields[j].name_desc+'</option>';
            }
            search_form += '</select>';
            search_form += ' <button data-op="+" class="btn_click_filter_sort">+</button> <button data-op="-" class="btn_click_filter_sort">-</button></p>';

            search_form += '<p class="member_sort_item"><select name="filter-members-field-sort" id="filter-members-field-sort">';
            for (var i in service.members_fields) {
                search_form += '<option value="'+service.members_fields[i].id+'_m" '+(i == 3 ? 'selected=selected': '')+'>M: '+service.members_fields[i].name_desc+'</option>';
            }
            for (var j in service.institutions_fields) {
                search_form += '<option value="'+service.institutions_fields[j].id+'_i">I: '+service.institutions_fields[j].name_desc+'</option>';
            }
            search_form += '</select>';
            search_form += ' <button data-op="+" class="btn_click_filter_sort">+</button> <button data-op="-" class="btn_click_filter_sort">-</button></p>';

            search_form += '<p class="member_sort_item"><select name="filter-members-field-sort" id="filter-members-field-sort">';
            for (var i in service.members_fields) {
                search_form += '<option value="'+service.members_fields[i].id+'_m" '+(i == 1 ? 'selected=selected': '')+'>M: '+service.members_fields[i].name_desc+'</option>';
            }
            for (var j in service.institutions_fields) {
                search_form += '<option value="'+service.institutions_fields[j].id+'_i">I: '+service.institutions_fields[j].name_desc+'</option>';
            }
            search_form += '</select>';
            search_form += ' <button data-op="+" class="btn_click_filter_sort">+</button> <button data-op="-" class="btn_click_filter_sort">-</button></p>';

            search_form += '</fieldset>\
            </td></tr></table>\
            <p style="text-align: center;"><button id="filter-members-button">Search</button></p>\
            </div>';

			$('.ui-layout-center').append(search_form);
			$('#filter-members-dialog').dialog({
				modal: true,
				height: 'auto',
				width: 'auto'
			});
			$('.btn_click_filter').off('click').on('click', function( e ) {
				var btn = $(e.target);
				if ( btn.data('op') === '+' ) {
				  var item = btn.parent().clone( true, true );
				  item.find('input[name="cvalue"]').val('');
				  btn.parent().after( item );
				} else if ( btn.data('op') === '-' ) {
				  btn.parent().remove();
				}
			});
            $('.btn_click_filter_display').off('click').on('click', function( e ) {
                var btn = $(e.target);
                if ( btn.data('op') === '+' ) {
                  var item = btn.parent().clone( true, true );
                  btn.parent().after( item );
                } else if ( btn.data('op') === '-' ) {
                  btn.parent().remove();
                }
            });
            $('.btn_click_filter_sort').off('click').on('click', function( e ) {
                var btn = $(e.target);
                if ( btn.data('op') === '+' ) {
                  var item = btn.parent().clone( true, true );
                  btn.parent().after( item );
                } else if ( btn.data('op') === '-' ) {
                  btn.parent().remove();
                }
            });
		}

			$('#filter-members-input').keypress(function (e) {
			  if (e.which == 13) {
			    $('#filter-members-button').click();
			    return false;
			  }
			});

			$('#filter-members-button').off('click').on('click', function() {
				var matchandor = $("input[name=filter_andor]:checked").val();
				console.log( 'match: ' + matchandor );

                var display_fields = [];
                $('select[name=filter-members-field-display]').each( function() {
                  var field_id = $(this).val();
                  display_fields.push( field_id.split('_') );
                });

                var sort_fields = [];
                $('select[name=filter-members-field-sort]').each( function() {
                  var field_id = $(this).val();
                  sort_fields.push( field_id.split('_') );
                });

				var filters = [];
				$('.member_filter_item').each( function() {
  				  var keyword = $(this).find('#filter-members-input').val();
	  			  var type = $(this).find('#filter-members-filter-type').val();
				  var field = $(this).find('#filter-members-field').val();
				  filters.push([ field.split('_'), type, keyword ]);
				});
				let mem, mem_fields, inst, inst_fields, results = [], cvalue, collect = false, collect_test = false;
				let parent_inst_field = service.find_field_id_members('institution_id');
				for ( var i in service.members ) {
				  mem = service.members[i];
				  if (mem['status'] != 'active') { continue; } // only check active members
				  mem_fields = mem.fields;
				  inst_fields = null;
				  if ( mem_fields[ parent_inst_field ] && service.institutions[ mem_fields[ parent_inst_field ] ] ) {
					inst = service.institutions[ mem_fields[ parent_inst_field ] ];
					inst_fields = inst.fields;
				  }
				  collect = false;
  				  for ( var j = 0; j < filters.length; j++ ) {
  					collect_test = false;
  					if ( filters[j][0][1] === 'm' ) {
					  cvalue = mem_fields[ filters[j][0][0] ];
					  filters[j][0].push( 'M: '+ service.members_fields[ filters[j][0][0] ].name_desc );
						if ( service.members_fields[ filters[j][0][0] ].name_desc === 'Join date' ) {
							cvalue = mem['join_date'];
						}
					} else if ( filters[j][0][1] === 'i' ) {
					  cvalue = inst_fields[ filters[j][0][0] ];
					  filters[j][0].push( 'I: ' + service.institutions_fields[ filters[j][0][0] ].name_desc );
					} else {
					  if ( matchandor === "0" ) { break; }
					  else { continue; }
					}
					cvalue = String(cvalue);

					switch( filters[j][1] ) {
					  case 'equals':
						collect_test = ( cvalue.toLowerCase() === filters[j][2].toLowerCase() );
						break;
					  case 'notequals':
						collect_test = ( cvalue.toLowerCase() !== filters[j][2].toLowerCase() );
						break;
					  case 'contains':
						collect_test = ( cvalue.toLowerCase().indexOf( filters[j][2].toLowerCase() ) !== -1 );
						break;
					  case 'notcontains':
						collect_test = ( cvalue.toLowerCase().indexOf( filters[j][2].toLowerCase() ) === -1 );
						break;
					  case 'startswith':
						collect_test = cvalue.toLowerCase().startsWith( filters[j][2].toLowerCase() );
						break;
					  case 'endswith':
						collect_test = cvalue.toLowerCase().endsWith( filters[j][2].toLowerCase() );
						break;
                      case 'empty':
                        collect_test = ( cvalue === 'undefined' || ( cvalue !== 'undefined' && cvalue.length === 0 ) );
                        break;
                      case 'notempty':
                        collect_test = ( cvalue !== 'undefined' && cvalue.length > 0 );
                        break;
					  default:
						break;
					}
					if ( matchandor === "0" && collect_test === false ) {
					  collect = false; break;
					} else if ( matchandor === "1" && collect_test === true ) {
					  collect = true; break;
					}
					collect |= collect_test;
				  }
				  if ( collect ) {
					results.push( i );
				  }
				}
				console.log( results );

                // sort results
                var sorted_members = [], sorted_item;
                for ( var i = 0, ilen = results.length; i < ilen; i++ ) {
                  sorted_item = [ results[i] ];
                  mem_fields = service.members[ results[i] ] ? service.members[ results[i] ].fields : null;
                  inst_fields = mem_fields[ parent_inst_field ] ? service.institutions[ mem_fields[ parent_inst_field ] ].fields : null;
                  for ( var j = 0, jlen = sort_fields.length; j < jlen; j++ ) {
                    if ( mem_fields && sort_fields[j][1] === 'm' ) {
	                  sorted_item.push( String( mem_fields[ sort_fields[j][0] ] ) );
                    } else if ( inst_fields && sort_fields[j][1] === 'i' ) {
                      sorted_item.push( String( inst_fields[ sort_fields[j][0] ] ) );
                    }
                  }
                  sorted_members.push( sorted_item );
                }

                sorted_members.sort( function (a,b) {
                  for ( var i = 1, ilen = a.length; i < ilen; i++ ) {
                      if ( a[i].toLowerCase() < b[i].toLowerCase() ) { return -1; }
                      else if ( a[i].toLowerCase() > b[i].toLowerCase() ) { return 1; }
                  }
                  return 0;
                } );
                results = [];
                for ( var i = 0, ilen = sorted_members.length; i < ilen; i++ ) {
                    results.push( sorted_members[i][0] );
                }

				// process results:

				var label = 'Filtered results: members';
				var tabid = service.addTab(label);
				$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());

                var header = [ {"bVisible": false} ];
                for ( var hi = 0, hilen = display_fields.length; hi < hilen; hi++ ) {
                  if ( display_fields[hi][1] === 'm' ) {
                    header.push( { "sTitle": service.members_fields[ display_fields[hi][0] ].name_desc, "sClass": "td_align_center" } );
                  } else if ( display_fields[hi][1] === 'i' ) {
                    header.push( { "sTitle": service.institutions_fields[ display_fields[hi][0] ].name_desc, "sClass": "td_align_center" } );
                  }
                }

                var mdata = [];
                for( var m = 0; m < results.length; m++ ) {
                  var mdataarr = [ results[m] ];
                  for ( hi = 0, hilen = display_fields.length; hi < hilen; hi++ ) {
                    if ( display_fields[hi][1] === 'm' ) {
						if ( service.members_fields[ display_fields[hi][0] ].name_desc === 'Join date' ) {
							mdataarr.push( service.members[ results[m] ].join_date );
						} else {
	                      mdataarr.push( service.members[ results[m] ].fields[ display_fields[hi][0] ] );
						}
                    } else if ( display_fields[hi][1] === 'i' ) {
                      mdataarr.push( service.institutions[ service.members[ results[m] ].fields[17] ].fields[ display_fields[hi][0] ] );
                    }
                  }
  	              for ( var hii = 0; hii < mdataarr.length; hii++ ) {
	                if ( mdataarr[hii] === undefined || mdataarr[hii] === null ) { mdataarr[hii] = ''; }
                  }
                  mdata.push( mdataarr );
                }
                var filter_conditions = [];
                for ( var i = 0, ilen = filters.length; i < ilen; i++ ) {
				  if ( !filters[i][0][2] ) { continue; }
                  filter_conditions.push( filters[i][0][2] + ' <i>' + filters[i][1] + '</i> "' + ( filters[i][2] || '' ) + '"' );
                }

				var cond = ' <b>'+( matchandor === 1 ? 'OR' : 'AND' )+'</b> ';
				$('#'+tabid).html('<p><b>Filters:</b></p><p>'+filter_conditions.join( cond )+'</p> <table cellpadding="0" cellspacing="0" border="0" class="display" id="dtmem-'+service.tabCounter+'-'+tabid+'"></table>');
				var dtable = $('#dtmem-'+service.tabCounter+'-'+tabid).dataTable({
					"sDom": 'T<"clear">lfrtip',
					"bJQueryUI": true, 
					"bSort": false,
					"bDeferRender": false,
					"bProcessing": true,
					"bPaginate": false,
					"sScrollY": $('#'+tabid).height() - 90,
					"aaData": mdata,
					"aoColumns": header
				});
				$('#dtmem-'+service.tabCounter+'-'+tabid+' tbody').delegate("tr", "click", function() {
					var pos = dtable.fnGetPosition( this );
					if (pos != null) {
					  var aData = dtable.fnGetData(pos);
					  service.display_member_details(aData[0]);
					}
				});

			  if ( mdata.length > 0 ) {

                $('<button id="export-xls-filtered-' + service.tabCounter + '" style="margin-right: 20px;"><img src="images/icons/excel.png" border=0 style="vertical-align: middle;"> Export to Excel</button>')
                  .prependTo('#dtmem-' + service.tabCounter + '-tabs-' + service.tabCounter + '_filter')
                  .on('click', function() {
                    var wb = new Workbook(), ws = sheet_from_array_of_arrays(mdata), ws_name = "phonebook";
                    wb.SheetNames.push(ws_name);
                    wb.Sheets[ws_name] = ws;
                    var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
                    saveAs( new Blob([s2ab(wbout)],{type:"application/octet-stream"}), ws_name+( Date.now() / 1000 | 0 )+".xlsx" );
                  });

/*
                $('<button data-memlist="'+ results.join(',')+'" id="export-mail-filtered-' + service.tabCounter + '" style="margin-right: 20px;"><img src="images/icons/list.png" border=0 style="vertical-align: middle;"> Mass-Email</button>')
                  .prependTo('#dtmem-' + service.tabCounter + '-tabs-' + service.tabCounter + '_filter')
                  .on('click', function() {
                      var memlist = String( $(this).data('memlist') );
                      service.display_email_members_filtered( memlist.split(',') );
                  });
*/
			  }

				$('#filter-members-dialog').dialog("close");
			});
	},

	display_search_members: function() {
		var service = this;
		if ($("#search-members-dialog").length > 0) {
			$('#search-members-dialog').dialog('open');
		} else {
			var search_form = '<div id="search-members-dialog" title="Search members">';
			search_form += '<select name="search-members-field" id="search-members-field">';
			search_form += '<option value="0" selected=selected>Any Field</option>'
	        for (var i in service.members_fields) {
				search_form += '<option value="'+service.members_fields[i].id+'">'+service.members_fields[i].name_desc+'</option>';
      		}
			search_form += '</select>';
			search_form += '<select name="search-members-filter-type" id="search-members-filter-type">\
			<option value="combined">filter: combined</option>\
			<option value="damlev">filter: fuzzy</option>\
			<option value="equals">filter: equals</option>\
			<option value="starts_with">filter: starts with</option>\
			<option value="ends_with">filter: ends with</option>\
			<option value="soundex">filter: similar sounding</option>\
			<option value="empty">filter: empty field</option>\
			</select>\
			<input id="search-members-input" type="text"><button id="search-members-button">Search</button>\
			</div>'
			$('.ui-layout-center').append(search_form);
			$('#search-members-dialog').dialog({
				modal: true,
				height: 100,
				width: 'auto'
			});
		}
			//var search_cache_members = {};
			$( "#search-members-input" ).autocomplete({
				minLength: 3,
				source: function( request, response ) {
					var term = request.term;
					var type = $('#search-members-filter-type').val();
					var field = $('#search-members-field').val();
					$.getJSON(service.service_url+'?q=/service/search/object:members/type:'+type+'/field:'+field+'/keyword:'+encodeURIComponent(request.term)+'/autocomplete:yes/date:'+Date.now(), request, function( data, status, xhr ) {
						response( data );
					});
				}
			});
			$('#search-members-button').unbind('click');
			$('#search-members-button').click(function() {
				var keyword = $('#search-members-input').val();
				var type = $('#search-members-filter-type').val();
				var field = $('#search-members-field').val();
				$('#search-members-dialog').dialog('close');
				$.getJSON(service.service_url+'?q=/service/search/object:members/type:'+type+'/field:'+field+'/keyword:'+encodeURIComponent(keyword)+'/autocomplete:no/date:'+Date.now(), function( data, status, xhr ) {
					// if just 1 object found - display details about member, if 2+ objects - list them in a table
					var length = data.length;
					if (length <= 0) {
						service.display_notification_dialog("NO members found!<br><br>You have typed: <b>"+keyword+'</b>');
					} else if (length == 1) {
						service.display_member_details(data[0].members_id);					
					} else {
						var label = 'Search results: members';
						var tabid = service.addTab(label);
						$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
				
						var header = [ {"bVisible": false}, {"sTitle": service.members_fields["1"]["name_desc"]}, 
						{"sTitle": service.members_fields["3"]["name_desc"]},
						{"sTitle": "Institution"},
						{"sTitle":service.members_fields["20"]["name_desc"], "sClass":"td_align_right"},
						{"sTitle": "Status", "sClass": "td_align_center"} ];
						var mdata = [];
						for (var i = 0; i < data.length; i++) {
							var field = service.members[data[i].members_id]['fields'];
							var name_first = field[1], name_last = field[3], email = field[20];
							if (field[40] == 'y') {
								name_first = '<span style="color: blue;">'+name_first+'</span>';
								name_last = '<span style="color: blue;">'+name_last+'</span>';
							}
							if (field[43] == 'y') {
								name_first = '<b>'+name_first+'</b>';
								name_last = '<b>'+name_last+'</b>';
							}
							if (field[44] == 'y') {
								name_first = '<u>'+name_first+'</u>';
								name_last = '<u>'+name_last+'</u>';
							}
							if (email == undefined) {
								email = '';
							}
							var name_institution = '';
							if (field[17] == undefined || field[17] == '') { 
								name_institution = 'N/A';
							} else {
								name_institution = service.institutions[field[17]]['fields'][1];
							}
							mdata.push([data[i].members_id, name_first, name_last, name_institution , email, service.members[data[i].members_id]['status']]);
						}
						$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtmem-'+service.tabCounter+'-'+tabid+'"></table>');
						var dtable = $('#dtmem-'+service.tabCounter+'-'+tabid).dataTable({
							"sDom": 'T<"clear">lfrtip',
							"bJQueryUI": true, 
							"bSort": false,
							"bDeferRender": false,
							"bProcessing": true,
							"bPaginate": false,
						    "sScrollY": $('#'+tabid).height() - 90,
							"aaData": mdata,
							"aoColumns": header
						});
						$('#dtmem-'+service.tabCounter+'-'+tabid+' tbody').delegate("tr", "click", function() {
							var pos = dtable.fnGetPosition( this );
							if (pos != null) {
							    var aData = dtable.fnGetData(pos);
								service.display_member_details(aData[0]);
							}
						});
					}
				});
			});	
	},

	display_search_institutions: function() {
		var service = this;
		if ($("#search-institutions-dialog").length > 0) {
			$('#search-institutions-dialog').dialog('open');
		} else {

			var search_form = '<div id="search-institutions-dialog" title="Search institutions">';
			search_form += '<select name="search-institutions-field" id="search-institutions-field">';
			search_form += '<option value="0" selected=selected>Any Field</option>'
	        for (var i in service.institutions_fields) {
				search_form += '<option value="'+service.institutions_fields[i].id+'">'+service.institutions_fields[i].name_desc+'</option>';
      		}
			search_form += '</select>';
			search_form += '<select name="search-institutions-filter" id="search-institutions-filter">\
			<option value="combined">filter: combined</option>\
			<option value="contains">filter: contains</option>\
			<option value="damlev">filter: fuzzy</option>\
			<option value="equals">filter: equals</option>\
			<option value="starts_with">filter: starts with</option>\
			<option value="ends_with">filter: ends with</option>\
			<option value="soundex">filter: similar sounding</option>\
			<option value="empty">filter: empty field</option>\
			</select>\
			<input id="search-institutions-input" type="text"><button id="search-institutions-button">Search</button>\
			</div>';
			$('.ui-layout-center').append(search_form);
			
			/*
			$('.ui-layout-center').append('<div id="search-institutions-dialog" title="Seach institutions">\
			<select name="search-institutions-filter" id="search-institutions-filter">\
			<option value="combined">filter: combined</option>\
			<option value="contains">filter: contains</option>\
			<option value="damlev">filter: fuzzy</option>\
			<option value="equals">filter: equals</option>\
			<option value="starts_with">filter: starts with</option>\
			<option value="ends_with">filter: ends with</option>\
			<option value="soundex">filter: similar sounding</option>\
			</select>\
			<input id="search-institutions-input" type="text"><button id="search-institutions-button">Search</button>\
			</div>');
			*/
			$('#search-institutions-dialog').dialog({
				modal: true,
				height: 100,
				width: 'auto'
			});
		}
		var service = this;
		$("#search-institutions-input").autocomplete({
			minLength: 3,
			source: function( request, response ) {
				var term = request.term;
				var type = $('#search-institutions-filter').val();
				var field = $('#search-institutions-field').val();
				$.getJSON(service.service_url + '?q=/service/search/object:institutions/type:'+type+'/field:'+field+'/keyword:'+encodeURIComponent(request.term)+'/autocomplete:yes/date:'+Date.now(), request, function( data, status, xhr ) {
					response( data );
				});
			}
		});
		$('#search-institutions-button').unbind('click');
		$('#search-institutions-button').click(function() {
			var keyword = $('#search-institutions-input').val();
			var type = $('#search-institutions-filter').val();
			var field = $('#search-institutions-field').val();
			$('#search-institutions-dialog').dialog("close");
			$.getJSON(service.service_url+'?q=/service/search/object:institutions/type:'+type+'/field:'+field+'/keyword:'+encodeURIComponent(keyword)+'/autocomplete:no/date:'+Date.now(), function( data, status, xhr ) {
				var length = data.length;
				// if just 1 object found - display details about institution, if 2+ objects - list them in a table
				if (length <= 0) {
					service.display_notification_dialog("NO institutions found!<br><br>You have typed: <b>"+keyword+'</b>');
				} else if (length == 1) {
					service.display_institution_details(data[0].institutions_id);					
				} else {
					var label = 'Search results: institutions';
					var tabid = service.addTab(label);
					$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());

					var header = [ {"bVisible": false}, {"sTitle": service.institutions_fields["1"]["name_desc"]}, 
							{"sTitle":service.institutions_fields["2"]["name_desc"], "sClass": "td_align_right"}, 
							{"sTitle":service.institutions_fields["3"]["name_desc"], "sClass": "td_align_center"}, 
							{"sTitle":service.institutions_fields["14"]["name_desc"]}, 	
							{"sTitle": "Status","sClass": "td_align_center"} ];
					var idata = [];
					for (var i = 0; i < data.length; i++) {
						var field = service.institutions[data[i].institutions_id]['fields'];
						var country = '<nobr>'+field[14]+'</nobr>';
						if (field[34] != undefined && typeof (field[34]) != undefined && field[34] != '') {
							country = '<img src="images/flags_iso_3166/16/'+field[34].toLowerCase()+'.png" style="vertical-align: middle;"> ' + country;
						}
						var acro = field[2];
						if (acro == undefined) { acro = ''; }
						var group = field[3];
						if (group == undefined) { group = ''; }
						idata.push([data[i].institutions_id, field[1], acro, group, country, service.institutions[data[i].institutions_id]['status']]);
					}
					$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtinst-'+service.tabCounter+'-'+tabid+'"></table>');
					var dtable = $('#dtinst-'+service.tabCounter+'-'+tabid).dataTable({
						"bJQueryUI": true, 
						"bSort": false,
						"bPaginate": false,
						"sScrollY": $('#'+tabid).height() - 90,
						"aaData": idata,
						"aoColumns": header
					});
					$('#dtinst-'+service.tabCounter+'-'+tabid+' tbody').delegate("tr", "click", function() {
						var pos = dtable.fnGetPosition( this );
						if (pos != null) {
							var aData = dtable.fnGetData(pos);
							service.display_institution_details(aData[0]);
						}
					});
				}
			});
		});
	},

	display_institution_details: function(id) {
		var service = this;
		var fields = service.institutions[id]['fields'];
		var label = 'Institution: '+fields[1];
		var tabid = service.addTab(label);
		$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
		var header = [ {"sTitle": "Field", "sClass": "td_align_right"}, {"sTitle":"Value", "sClass": "td_align_left"}, {'sTitle': 'Group', 'sClass': 'td_align_left' } ];
		var idata = [];
		var value = '';
		var inst_status = service.institutions[id]['status'];
		if (inst_status != 'active') { inst_status = '<span class="red">'+inst_status+'</span>'; } 
		else { inst_status = '<span class="green">'+inst_status+'</span>'; }
		idata.push([ '<b>STATUS</b>', '<b>'+inst_status+'</b>', '']);

		for( m = 0; m < service.institutions_fields_ordered.length; m++) {
			var i = service.institutions_fields_ordered[m];
			value = service.institutions[id]["fields"][i];
			if (service.institutions_fields[i]['is_enabled'] != 'y') { continue; }
			if ( service.institutions_fields[i]['options'] != undefined && typeof(service.institutions_fields[i]['options']) !== undefined && service.institutions_fields[i]['options'] != '' ) {
				// options: 
				var opts = service.institutions_fields[i]['options'];
				opts = opts.split(',');
				var results = {};
				var value_default = '';
				for (j in opts) {
					var kv = opts[j].split(':');
					results[kv[0]] = kv[1];
					if (value_default == '') { value_default = kv[1]; }
				}
				if (value == undefined || typeof (value) === undefined) {
					idata.push([ service.institutions_fields[i]['name_desc'], value_default, service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full'] ]);
				} else {
					idata.push([ service.institutions_fields[i]['name_desc'], results[value], service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full'] ]);
				}
			} else if (typeof (value) !== undefined && value != undefined) {
				if ( service.institutions_fields[i]['name_fixed'] == 'council_representative') {
					if (service.members[value] == undefined || typeof(service.members[value]) === undefined) {
						idata.push([ service.institutions_fields[i]['name_desc'], "", service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full']]);
					} else {
						idata.push([ service.institutions_fields[i]['name_desc'], '<span onClick="client.display_member_details('+value+')">'+service.members[value]['fields'][1]+' '+service.members[value]['fields'][3]+'</span>', service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full'] ]);
					}
				} else if ( service.institutions_fields[i]['name_fixed'] == 'alt_council_representative') {
					if (service.members[value] == undefined || typeof(service.members[value]) === undefined) {
						idata.push([ service.institutions_fields[i]['name_desc'], "", service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full']]);
					} else {
						idata.push([ service.institutions_fields[i]['name_desc'], '<span onClick="client.display_member_details('+value+')">'+service.members[value]['fields'][1]+' '+service.members[value]['fields'][3]+'</span>', service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full'] ]);
					}
				} else if ( service.institutions_fields[i]['name_fixed'] == 'exofficio_council_representative1') {
					if (service.members[value] == undefined || typeof(service.members[value]) === undefined) {
						idata.push([ service.institutions_fields[i]['name_desc'], "", service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full']]);
					} else {
						idata.push([ service.institutions_fields[i]['name_desc'], '<span onClick="client.display_member_details('+value+')">'+service.members[value]['fields'][1]+' '+service.members[value]['fields'][3]+'</span>', service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full'] ]);
					}
				} else if ( service.institutions_fields[i]['name_fixed'] == 'exofficio_council_representative2') {
					if (service.members[value] == undefined || typeof(service.members[value]) === undefined) {
						idata.push([ service.institutions_fields[i]['name_desc'], "", service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full']]);
					} else {
						idata.push([ service.institutions_fields[i]['name_desc'], '<span onClick="client.display_member_details('+value+')">'+service.members[value]['fields'][1]+' '+service.members[value]['fields'][3]+'</span>', service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full'] ]);
					}
				} else if (service.institutions_fields[i]['name_fixed'] == 'associated_id') {
					if (service.institutions[value] == undefined || typeof(service.institutions[value]) === undefined) {
						idata.push([ service.institutions_fields[i]['name_desc'], "", service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full']]);
					} else {
						idata.push([ service.institutions_fields[i]['name_desc'], service.institutions[value]['fields'][1], service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full'] ]);
					}
				} else {
					idata.push([ service.institutions_fields[i]['name_desc'], value, service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full'] ]);
				}
			} else {
				idata.push([ service.institutions_fields[i]['name_desc'], '', service.institutions_fields_groups[service.institutions_fields[i]['group']]['name_full'] ]);
			}
		}
		$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtinst-'+service.tabCounter+'-'+id+'"></table>');
		$('#dtinst-'+service.tabCounter+'-'+id).dataTable({
			"bJQueryUI": true, 
			"bSort": false,
			"bPaginate": false,
			"sScrollY": $('#'+tabid).height() - 90,
			"aaData": idata,
			"aoColumns": header
		});
		$('<button id="edit-institution-'+service.tabCounter+'-'+id+'" style="margin-right: 20px;"><img src="images/icons/edit.png" border=0 style="vertical-align: middle;"> Edit</button>').prependTo('#dtinst-'+service.tabCounter+'-'+id+'_filter');
		$('<button id="list-members-'+service.tabCounter+'-'+id+'" style="margin-right: 20px;"><img src="images/icons/list.png" border=0 style="vertical-align: middle;">List Members</button>').prependTo('#dtinst-'+service.tabCounter+'-'+id+'_filter');
		$('<button id="add-members-'+service.tabCounter+'-'+id+'" style="margin-right: 20px;"><img src="images/icons/add.png" border=0 style="vertical-align: middle;"> Add New Member</button>').prependTo('#dtinst-'+service.tabCounter+'-'+id+'_filter');
		$('<button id="view-history-'+service.tabCounter+'-'+id+'" style="margin-right: 20px;"><img src="images/icons/list.png" border=0 style="vertical-align: middle;"> View History</button>').prependTo('#dtinst-'+service.tabCounter+'-'+id+'_filter');
		$('#edit-institution-'+service.tabCounter+'-'+id).button()
			.click(function( event ) {
				if ($("#edit-institution-dialog").length > 0) {
					$('#edit-institution-dialog').remove();
				}
				var edit_fields;
				$('.ui-layout-center').append('\
						<div id="edit-institution-dialog" title="Edit institution">\
						<form>\
						<fieldset id="edit-institution-fieldset">\
						</fieldset>\
						</form>\
						</div>\
				');
				var cur_group = -1;
				var fields = service.institutions[id]['fields'];
				var buttons = '';
				var has_country_autocomplete = false;
				var date_field_ids = [];

				for( m = 0; m < service.institutions_fields_ordered.length; m++) {
					var i = service.institutions_fields_ordered[m];
					if (service.institutions_fields[i]['is_enabled'] != 'y') { continue; }
					if (service.institutions_fields[i]['type'] == 'date') { date_field_ids.push('instedit-'+service.institutions_fields[i]['name_fixed']); }
					var value = fields[i];
					buttons = '';
					if (cur_group != service.institutions_fields[i]['group']) {
						cur_group = service.institutions_fields[i]['group'];
						buttons += '<h2>'+service.institutions_fields_groups[cur_group]['name_full']+'</h2>';
					}

					if (service.institutions_fields[i]['is_required'] == 'y') {
						buttons += '<label for="memedit-'+service.institutions_fields[i]['name_fixed']+'" style="display:block; margin-top: 7px; font-size: 12px; color: red;"><b>* '+service.institutions_fields[i]['name_desc']+'</b> <i>(required field)</i></label>';
					} else {
						buttons += '<label for="memedit-'+service.institutions_fields[i]['name_fixed']+'" style="display:block; margin-top: 7px; font-size: 12px; color: black;">'+service.institutions_fields[i]['name_desc']+'</label>';
					}


					var opts = service.institutions_fields[i]['options'];
					if (service.institutions_fields[i]['name_fixed'] == 'country') {
						if (fields[i] == 'undefined' || fields[i] == undefined) {
							value = '';
						}
						buttons += '<input type="text" maxlength="'+service.institutions_fields[i]['size_max']+'" name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;" class="text ui-widget-content ui-corner-all" value="'+value+'"/>';
						has_country_autocomplete = 'instedit-'+service.institutions_fields[i]['name_fixed'];
					} else if (service.institutions_fields[i]['name_fixed'] == 'country_code') {
						buttons += '<select name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="">*** please select country ***</option>';
						for (var k in service.countries) {
							buttons += '<option value="'+k+'" ';
							if (value == k) { buttons += 'selected=selected'; }
							buttons += '>'+service.countries[k]+'</option>';
						}
						buttons += '</select>';
					} else if (service.institutions_fields[i]['name_fixed'] == 'council_representative') {
						// scan associated institutions
						var dep_inst = [ parseInt(id) ];
						for ( var assoc in service.institutions ) {
							if ( service.institutions[assoc]['fields'][45] == id ) { dep_inst.push( parseInt(assoc) ); }
						}
						var local_members = new Array();
						for (var k in service.members) {
							var field = service.members[k]['fields'];
							//if (value == undefined || field[17] != id || service.members[k]['status'] != 'active') { continue; }
							if ( ( field[17] != id && $.inArray(field[17], dep_inst) == -1 ) || service.members[k]['status'] != 'active') { continue; }
							field[1000] = k;
							local_members.push(field);
						}
						local_members.sort(ComparatorName);
						console.log(local_members);
						buttons += '<select name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="0">*** not selected ***</option>';
						for (var k = 0; k < local_members.length; k++) {
							var field = local_members[k];
							buttons += '<option value="'+field[1000]+'" ';
							if (value == field[1000]) { buttons += 'selected=selected'; }
							buttons += '>'+field[3]+', '+field[1]+'</option>';	
						}
						buttons += '</select>';
                    } else if ( service.institutions_fields[i]['name_fixed'] == 'alt_council_representative') {
						// scan associated institutions
						var dep_inst = [ parseInt(id) ];
						for ( var assoc in service.institutions ) {
							if ( service.institutions[assoc]['fields'][45] == id ) { dep_inst.push( parseInt(assoc) ); }
						}
						var local_members = new Array();
						for (var k in service.members) {
							var field = service.members[k]['fields'];
							//if (value == undefined || field[17] != id || service.members[k]['status'] != 'active') { continue; }
							if ( ( field[17] != id && $.inArray(field[17], dep_inst) == -1 ) || service.members[k]['status'] != 'active') { continue; }
							field[1000] = k;
							local_members.push(field);
						}
						local_members.sort(ComparatorName);
						console.log(local_members);
						buttons += '<select name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="0">*** not selected ***</option>';
						for (var k = 0; k < local_members.length; k++) {
							var field = local_members[k];
							buttons += '<option value="'+field[1000]+'" ';
							if (value == field[1000]) { buttons += 'selected=selected'; }
							buttons += '>'+field[3]+', '+field[1]+'</option>';	
						}
						buttons += '</select>';
                    } else if ( service.institutions_fields[i]['name_fixed'] == 'exofficio_council_representative1') {
						// scan associated institutions
						var dep_inst = [ parseInt(id) ];
						for ( var assoc in service.institutions ) {
							if ( service.institutions[assoc]['fields'][45] == id ) { dep_inst.push( parseInt(assoc) ); }
						}
						var local_members = new Array();
						for (var k in service.members) {
							var field = service.members[k]['fields'];
							//if (value == undefined || field[17] != id || service.members[k]['status'] != 'active') { continue; }
							if ( ( field[17] != id && $.inArray(field[17], dep_inst) == -1 ) || service.members[k]['status'] != 'active') { continue; }
							field[1000] = k;
							local_members.push(field);
						}
						local_members.sort(ComparatorName);
						console.log(local_members);
						buttons += '<select name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="0">*** not selected ***</option>';
						for (var k = 0; k < local_members.length; k++) {
							var field = local_members[k];
							buttons += '<option value="'+field[1000]+'" ';
							if (value == field[1000]) { buttons += 'selected=selected'; }
							buttons += '>'+field[3]+', '+field[1]+'</option>';	
						}
						buttons += '</select>';
                    } else if ( service.institutions_fields[i]['name_fixed'] == 'exofficio_council_representative2') {
						// scan associated institutions
						var dep_inst = [ parseInt(id) ];
						for ( var assoc in service.institutions ) {
							if ( service.institutions[assoc]['fields'][45] == id ) { dep_inst.push( parseInt(assoc) ); }
						}
						var local_members = new Array();
						for (var k in service.members) {
							var field = service.members[k]['fields'];
							//if (value == undefined || field[17] != id || service.members[k]['status'] != 'active') { continue; }
							if ( ( field[17] != id && $.inArray(field[17], dep_inst) == -1 ) || service.members[k]['status'] != 'active') { continue; }
							field[1000] = k;
							local_members.push(field);
						}
						local_members.sort(ComparatorName);
						console.log(local_members);
						buttons += '<select name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="0">*** not selected ***</option>';
						for (var k = 0; k < local_members.length; k++) {
							var field = local_members[k];
							buttons += '<option value="'+field[1000]+'" ';
							if (value == field[1000]) { buttons += 'selected=selected'; }
							buttons += '>'+field[3]+', '+field[1]+'</option>';	
						}
						buttons += '</select>';
					} else if ( service.institutions_fields[i]['name_fixed'] == 'associated_id' ) {
                        var local_institutions = new Array();
                        for (var k in service.institutions) {
                            var field = service.institutions[k]['fields'];
                            if ( k == id || service.institutions[k]['status'] != 'active' ) { continue; }
                            field[1000] = k;
                            local_institutions.push(field);
                        }
                        local_institutions.sort(ComparatorInst);
                        buttons += '<select name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
                        buttons += '<option value="0">*** not associated ***</option>';
                        for (var k = 0; k < local_institutions.length; k++) {
                            var field = local_institutions[k];
                            buttons += '<option value="'+field[1000]+'" ';
                            if (value == field[1000]) { buttons += 'selected=selected'; }
                            buttons += '>'+field[1]+'</option>';
                        }
                        buttons += '</select>';
					} else if ( !opts || 0 === opts.length ) {
						if (fields[i] == 'undefined' || fields[i] == undefined) {
							value = '';
						}
						buttons += '<input type="text" maxlength="'+service.institutions_fields[i]['size_max']+'" name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;" class="text ui-widget-content ui-corner-all" value="'+value+'"/>';
					} else {
						buttons += '<select name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						opts = opts.split(',');
						for (j in opts) {
							var kv = opts[j].split(':');
							buttons += '<option value="'+kv[0]+'" ';
							if (kv[0] == fields[i]) { buttons += 'selected=selected'; }
							buttons += '>'+kv[1]+'</option>';
						}
						buttons += '</select>';
					}
					buttons += '<span style="font-size: 10px;"><i>'+service.institutions_fields[i]['hint_full']+'</i></span>';
					$('#edit-institution-fieldset').append(buttons);

				} 

				if (has_country_autocomplete !== false) {
					$('[name="'+has_country_autocomplete+'"]').autocomplete({
						minLength: 3,
						source: function( request, response ) {
							var term = request.term;
							$.getJSON(service.service_url+'?q=/countries/search/autocomplete:yes/keyword:'+encodeURIComponent(request.term)+'/date:'+Date.now(), request, function( data, status, xhr ) {
								response( data );
							});
						}
					});
				}
				$('select[name="instedit-country_code"]').change(function() {
					if ($('select[name="instedit-country_code"] option:selected').val() != '') {
						$('input[name="instedit-country"]').val($('select[name="instedit-country_code"] option:selected').text());
					}
				});

				$( "#edit-institution-dialog" ).dialog({
					autoOpen: true,
					height: 500,
					width: 560,
					modal: true,
                    open: function( event, ui ) {
                        for (var i = 0; i < date_field_ids.length; i++) {
                            $('[name="'+date_field_ids[i]+'"]').datepicker({
                                changeMonth: true,
                                changeYear: true,
                                dateFormat: 'yy-mm-dd'
                            });
                        }
                    },
					buttons: {
                        "Geocode": function() {
                            //address_line_1, address_line_2, city, state, country, postcode
                            var req = $('[name="instedit-address_line_1"]').val() + ',';
                                req += $('[name="instedit-address_line_2"]').val() + ',';
                                req += $('[name="instedit-city"]').val() + ',';
                                req += $('[name="instedit-state"]').val() + ',';
                                req += $('[name="instedit-country"]').val() + ',';
                                req += $('[name="instedit-postcode"]').val();
                            var res = service.geocode_locate_address(req);
                            if (res == undefined) {
                                req = $('[name="instedit-city"]').val() + ',';
                                req += $('[name="instedit-state"]').val() + ',';
                                req += $('[name="instedit-country"]').val() + ',';
                                req += $('[name="instedit-postcode"]').val();
                                res = service.geocode_locate_address(req);
                            }
                            if (res == undefined) {
                                alert('Geocoding failed, please verify institution address and retry..');
                                console.log(req);
                                console.log(res);
                            } else {
                                service.display_geocode_dialog([res.lat, res.lon], res.desc, req);
                            }
                        },
						"Toggle Status": function() {
							var edit_institution_dialog = this;
							var status_from = service.institutions[id]['status'];
							var status_to = '';
							switch(status_from) {
								case 'active':
									status_to = 'inactive';
									break;
								case 'inactive':
									status_to = 'active';
									break;
								case 'onhold':
									status_to = 'active';
									break;
								default:
									break;
							}
							var fields = service.institutions[id]['fields'];
							
							// confirmation dialog:
							service.display_confirmation_dialog('Do you really want to change status for <b>'+fields[1]+'</b> from <span class="red"><b>'+status_from+'</b> to <b>'+status_to+'</b></span>?', function() {
								$.ajax({
									url: service.service_url+'?q=/institutions/toggle/id:'+id+'/date:'+Date.now(),
									type: 'GET',
									dataType: 'json',
									success: function(data) {
										$(edit_institution_dialog).dialog("close");
										// do institution modify request here..
										service.get_institutions('all', function() { 
											$('li[aria-controls="'+tabid+'"]').remove();
											$('#'+tabid).remove();
											$("#tabs").tabs( "refresh" );
											service.display_institution_details(id);
										});
									}
								});
							});
						},

						"Update information": function() {
							// scan fields, compare with existing values, prepare POST request, close member tab, open new member tab
							var fields = service.institutions[id]['fields'];
							var result = {};
								result["data"] = {};
								result["data"][id] = {};
							var missed_fields = [];
							for( i in service.institutions_fields) {
								var value_old = fields[i];
								var value_new = $('[name="instedit-'+service.institutions_fields[i]["name_fixed"]+'"]').val();
								if (service.institutions_fields[i]["is_required"] == 'y' && service.institutions_fields[i]["is_enabled"] == 'y' && ( value_new == undefined || value_new == '') ) {
									missed_fields.push(service.institutions_fields[i]["name_desc"]);
								}
								if (value_new != undefined && value_new != "undefined" && value_old != value_new) {
									if (value_old == undefined && value_new == '') {
										// skip empty entry..
									} else {
										result["data"][id][i] = value_new;
									}
								}
							}
							if (missed_fields.length != 0) {
								service.display_notification_dialog('There are REQUIRED fields to be filled in: <span class="red"><b>'+missed_fields.join(", ")+'</b></span><br><br>Please complete form before submission.');
							} else {
							  if ( result['data'] && result['data'][id] && result['data'][id][2] ) {
							  for (var i in service.institutions) {
								inst = service.institutions[i];
								if (inst['status'] != 'active' || i == id) { continue; } // only check active institutions
								if ( inst['fields'][2] && ( inst['fields'][2].toLowerCase() == result["data"][id][2].toLowerCase() ) ) {
									alert('Institution Acronym is identical to some other institution, please change it to unique one');
									return;
								}
							  }
							  }
							$.ajax({
								url: service.service_url+'?q=/institutions/update',
								type: 'POST',
								processData: false,
								data: JSON.stringify(result),
								contentType: 'application/json; charset=utf-8',
								dataType: 'json',
								success: function(data) {
									service.get_institutions('all', function() { 
										$('li[aria-controls="'+tabid+'"]').remove();
										$('#'+tabid).remove();
										$("#tabs").tabs( "refresh" );
										service.display_institution_details(id);
									}, 'all', 'full');
								}
							});
							$(this).dialog( "close" );
							}
						},
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
						
					}
				});

				event.preventDefault();
			});
		$('#list-members-'+service.tabCounter+'-'+id).button()
			.click(function( event ) {
				service.display_members(id);
				event.preventDefault();
			});
		$('#add-members-'+service.tabCounter+'-'+id).button()
			.click(function( event ) {
				if ($("#create-member-dialog").length > 0) {
					$('#create-member-dialog').remove();
				}
				var create_fields;
				$('.ui-layout-center').append('\
						<div id="create-member-dialog" title="Create new member">\
						<form>\
						<fieldset id="create-member-fieldset">\
						</fieldset>\
						</form>\
						</div>\
				');
				
				var cur_group = -1;
				var buttons = '';
				var has_country_autocomplete = false;
				var date_field_ids = [];

				for( i in service.members_fields) {
					if (service.members_fields[i]['is_enabled'] != 'y') { continue; }
					if (service.members_fields[i]['type'] == 'date') { date_field_ids.push('memcreate-'+service.members_fields[i]['name_fixed']); }

					buttons = '';
					if (cur_group != service.members_fields[i]['group']) {
						cur_group = service.members_fields[i]['group'];
						buttons += '<h2>'+service.members_fields_groups[cur_group]['name_full']+'</h2>';
					}
					if (service.members_fields[i]['is_required'] == 'y') {
						buttons += '<label for="memcreate-'+service.members_fields[i]['name_fixed']+'" style="display:block; margin-top: 7px; font-size: 12px; color: red;"><b>* '+service.members_fields[i]['name_desc']+'</b> <i>(required field)</i></label>';
					} else {
						buttons += '<label for="memcreate-'+service.members_fields[i]['name_fixed']+'" style="display:block; margin-top: 7px; font-size: 12px; color: black;">'+service.members_fields[i]['name_desc']+'</label>';
					}
					var opts = service.members_fields[i]['options'];

					if (service.members_fields[i]['name_fixed'] == 'country') {
						buttons += '<input type="text" maxlength="'+service.members_fields[i]['size_max']+'" name="memcreate-'+service.members_fields[i]['name_fixed']+'" style="display: block; width: 450px;" class="text ui-widget-content ui-corner-all" value=""/>';
						has_country_autocomplete = 'memcreate-'+service.members_fields[i]['name_fixed'];
					} else if (service.members_fields[i]['name_fixed'] == 'institution_id') {
						buttons += '<select name="memcreate-'+service.members_fields[i]['name_fixed']+'">';
						for (j in service.institutions) {
							buttons += '<option value="'+j+'" ';
							if (j == id) { buttons += 'selected=selected'; }
							buttons +='>'+service.institutions[j]['fields'][1]+'</option>';
						}
						buttons += '</select>';
					} else if ( !opts || 0 === opts.length ) {
						buttons += '<input type="text" maxlength="'+service.members_fields[i]['size_max']+'" name="memcreate-'+service.members_fields[i]['name_fixed']+'" style="display: block; width: 450px;" class="text ui-widget-content ui-corner-all" value=""/>';
					} else {
						buttons += '<select name="memcreate-'+service.members_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						opts = opts.split(',');
						for (j in opts) {
							var kv = opts[j].split(':');
							buttons += '<option value="'+kv[0]+'">'+kv[1]+'</option>';
						}
						buttons += '</select>';
					}
					buttons += '<span style="font-size: 10px;"><i>'+service.members_fields[i]['hint_full']+'</i></span>';

					$('#create-member-fieldset').append(buttons);
					if (has_country_autocomplete !== false) {
						$('[name="'+has_country_autocomplete+'"]').autocomplete({
							minLength: 3,
							source: function( request, response ) {
								var term = request.term;
								$.getJSON(service.service_url+'?q=/countries/search/autocomplete:yes/keyword:'+encodeURIComponent(request.term)+'/date:'+Date.now(), request, function( data, status, xhr ) {
									response( data );
								});
							}
						});
					}
				}
				$('[name^="memcreate-name_"]').focusout(function() {
					return;
					var name_last = $(this).val();
					$.getJSON(service.service_url+'?q=/service/search/object:members/type:combined/field:3/keyword:'+encodeURIComponent(name_last)+'/date:'+Date.now(), function( data, status, xhr ) {
						console.log(data);
						var persons = [];
						for (var i in data) {
							var mem = service.members[data[i]['members_id']];
							if (mem['fields'][17] == undefined || typeof(mem['fields'][17]) == undefined || mem['fields'][17] <= 0) { continue; }
							persons.push([
								data[i]['members_id'], 
								mem['fields'][1]+' '+mem['fields'][3],
								service.institutions[mem['fields'][17]]['fields'][1]
							]);
						}
						if (persons.length > 0) {
							if ($("#alert-member-dialog").length > 0) {
								$('#alert-member-dialog').remove();
							}
							$('.ui-layout-center').append('\
								<div id="alert-member-dialog" title="Similar members found!">\
								<p><span class="ui-icon ui-icon-alert" style="float: left; margin: 0 7px 20px 0;"></span>The following members already exist in phonebook. Please confirm that new member is not amongst them already, or click on members name to edit this member.</p>\
								<script>\
								function select_member(id) {\
									$("#alert-member-dialog").dialog("close");\
									$("#create-member-dialog").dialog("close");\
									client.display_member_details(id);\
								}\
								</script>\
								</div>\
							');
							for (var k in persons) {
								$('#alert-member-dialog').append('<p style="cursor: pointer; color: red;" onClick="select_member('+persons[k][0]+')">'+persons[k][1]+', <i>'+persons[k][2]+'</i></p>');
							}
							$( "#alert-member-dialog" ).dialog({
								autoOpen: true,
								height: 500,
								width: 560,
								modal: true,
								buttons: {
									"Nope, member is not in the list": function() {
										$( this ).dialog( "close" );
									}
								}
							});			
						}
					});
				});

				$( "#create-member-dialog" ).dialog({
					autoOpen: true,
					height: 500,
					width: 560,
					modal: true,
                    open: function( event, ui ) {
                        for (var i = 0; i < date_field_ids.length; i++) {
                            $('[name="'+date_field_ids[i]+'"]').datepicker({
                                changeMonth: true,
                                changeYear: true,
                                dateFormat: 'yy-mm-dd'
                            });
                        }
                    },
					buttons: {
						"Create member": function() {
							var result = {};
								result['data'] = {};
								result['data']['status'] = "active";
								result['data']['fields'] = {};
							var missed_fields = [];
							for( i in service.members_fields) {
								var value_new = $('[name="memcreate-'+service.members_fields[i]["name_fixed"]+'"]').val();
								if (service.members_fields[i]["is_required"] == 'y' && service.members_fields[i]['is_enabled'] == 'y' && (value_new == undefined || value_new == '') ) {
									missed_fields.push(service.members_fields[i]["name_desc"]);
								}
								if (value_new != undefined && value_new != "undefined" && value_new != '') {
									result['data']['fields'][i] = value_new;
								}
							}
							if (missed_fields.length != 0) {
								service.display_notification_dialog('There are REQUIRED fields to be filled in: <span class="red"><b>'+missed_fields.join(", ")+'</b></span><br><br>Please complete form before submission.');
							} else {
							$.ajax({
								url: service.service_url+'?q=/members/create',
								type: 'POST',
								processData: false,
								data: JSON.stringify(result),
								contentType: 'application/json; charset=utf-8',
								dataType: 'json',
								success: function(data) {
									service.get_members(function() { 
										$('li[aria-controls="'+tabid+'"]').remove();
										$('#'+tabid).remove();
										$("#tabs").tabs( "refresh" );
										service.display_institution_details(id);
									}, 'all', 'full');
								}
							});
							$(this).dialog( "close" );
							}
						},
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
						
					}
				});

				event.preventDefault();
			});
		$('#view-history-'+service.tabCounter+'-'+id).button()
			.click(function( event ) {
				$.ajax({
					url: service.service_url+'?q=/institutions/history/id:'+id+'/date:'+Date.now(),
						type: 'GET',
						dataType: 'json',
						success: function(data) {
							var label = 'History for '+service.institutions[id]['fields'][1];
							var tabid = service.addTab(label);
							$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
							var header = [ {"sTitle": "Date", "sClass": "td_align_center"}, {"sTitle": "Field name"},
									{"sTitle":"Old Value", "sClass": "td_align_right"},
									{"sTitle": "", "sClass": "td_align_center"}, {"sTitle": "New Value", "sClass": "td_align_left"} ];
							var idata = [];
							for (i in data) {
								var data_from = '', data_to = '';
								switch (service.institutions_fields[data[i]['institutions_fields_id']]['type']) {
									case 'string':
										data_from = data[i]['value_from_string'];
										data_to = data[i]['value_to_string'];
										break;
									case 'int':
										data_from = data[i]['value_from_int'];
										data_to = data[i]['value_to_int'];
										break;
									case 'date':
										data_from = data[i]['value_from_date'];
										data_to = data[i]['value_to_date'];
										break;
									default:
										data_from = 'unknown type';
										data_to = 'unknown type';
										break;
								}
								if ( service.institutions_fields[data[i]['institutions_fields_id']]['name_fixed'] == 'council_representative' && service.members[data_to] != undefined ) {
									var fields = service.members[data_to]['fields'];
									data_to = fields[1]+' '+fields[3];
									data_to = fields[1]+' '+fields[3];
									if (data_from != undefined && typeof(data_from) !== undefined && data_from != '' && data_from != 0) {
										fields = service.members[data_from]['fields'];
										data_from = fields[1]+' '+fields[3];
										data_from = fields[1]+' '+fields[3];
									}
									if (data_from == 0) { data_from = ''; }
								} else if ( service.institutions_fields[data[i]['institutions_fields_id']]['name_fixed'] == 'alt_council_representative' && service.members[data_to] != undefined ) {
									var fields = service.members[data_to]['fields'];
									data_to = fields[1]+' '+fields[3];
									data_to = fields[1]+' '+fields[3];
									if (data_from != undefined && typeof(data_from) !== undefined && data_from != '' && data_from != 0) {
										fields = service.members[data_from]['fields'];
										data_from = fields[1]+' '+fields[3];
										data_from = fields[1]+' '+fields[3];
									}
									if (data_from == 0) { data_from = ''; }
								} else if ( service.institutions_fields[data[i]['institutions_fields_id']]['name_fixed'] == 'exofficio_council_representative1' && service.members[data_to] != undefined ) {
									var fields = service.members[data_to]['fields'];
									data_to = fields[1]+' '+fields[3];
									data_to = fields[1]+' '+fields[3];
									if (data_from != undefined && typeof(data_from) !== undefined && data_from != '' && data_from != 0) {
										fields = service.members[data_from]['fields'];
										data_from = fields[1]+' '+fields[3];
										data_from = fields[1]+' '+fields[3];
									}
									if (data_from == 0) { data_from = ''; }
								} else if ( service.institutions_fields[data[i]['institutions_fields_id']]['name_fixed'] == 'exofficio_council_representative2' && service.members[data_to] != undefined ) {
									var fields = service.members[data_to]['fields'];
									data_to = fields[1]+' '+fields[3];
									data_to = fields[1]+' '+fields[3];
									if (data_from != undefined && typeof(data_from) !== undefined && data_from != '' && data_from != 0) {
										fields = service.members[data_from]['fields'];
										data_from = fields[1]+' '+fields[3];
										data_from = fields[1]+' '+fields[3];
									}
									if (data_from == 0) { data_from = ''; }
								}
								idata.push([ data[i]['date'], service.institutions_fields[data[i]['institutions_fields_id']]['name_desc'], data_from, '=>', data_to]);
							}
							$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtinsthist-'+service.tabCounter+'-'+tabid+'"></table>');
							var oTable = $('#dtinsthist-'+service.tabCounter+'-'+tabid).dataTable({
								"bJQueryUI": true, 
								"bSort": false,
								"bPaginate": false,
								"sScrollY": $('#'+tabid).height() - 72,
								"aaData": idata,
								"aoColumns": header
							});
							$('<span style="margin-right: 30px;"><input type="checkbox" id="insthist-rep-'+service.tabCounter+'-'+tabid+'"> Display Council Representative changes only</span>').prependTo('#dtinsthist-'+service.tabCounter+'-'+tabid+'_filter');
							$.fn.dataTableExt.afnFiltering.push (
								function( settings, aData, iDataIndex ) {	
								    if ( settings.nTable.id != ('dtinsthist-'+service.tabCounter+'-'+tabid) ) { return true; } // wrong table..
									if ( $('#insthist-rep-'+service.tabCounter+'-'+tabid).is(':checked') ) {
										if (aData[1] == 'Council representative') { return true; } else { return false; }
									} else {
										return true; // not checked!
									}
							  	}
							);
							$('#insthist-rep-'+service.tabCounter+'-'+tabid).change( function() { oTable.fnDraw(); } );
						}
				});

				event.preventDefault();
			});
	},

	display_member_details: function(id) {
		var service = this;
		var fields = service.members[id]['fields'];
		var label = 'Member: '+fields[1]+' '+fields[3];
		tabid = service.addTab(label);
		$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());

		var header = [ {"sTitle": "Field", "sClass": "td_align_right"}, {"sTitle":"Value", "sClass": "td_align_left"},{"sTitle": "Group", "sClass": "td_align_left"} ];
		var mdata = [];
		var value = '';
		var mem_status = service.members[id]['status'];
		if (mem_status != 'active') { mem_status = '<span class="red">'+mem_status+'</span>'; } 
		else { mem_status = '<span class="green">'+mem_status+'</span>'; }
		mdata.push([ '<b>STATUS</b>', '<b>'+mem_status+'</b>', '']);
		for (var m = 0; m < service.members_fields_ordered.length; m++) {
			var i = service.members_fields_ordered[m];
			value = service.members[id]["fields"][i];
			if (service.members_fields[i]['is_enabled'] != 'y') { continue; }
			if (service.members_fields[i]['name_fixed'] == 'institution_id' && value != undefined && value != '') {
				mdata.push(
					[ 	
						service.members_fields[i]['name_desc'], 
						'<span onClick="client.display_institution_details('+value+')">'+service.institutions[value]['fields'][1]+'</span>',
						service.members_fields_groups[service.members_fields[i]['group']]['name_full']
					]);
			} else if ( service.members_fields[i]['options'] != undefined && typeof(service.members_fields[i]['options']) !== undefined && service.members_fields[i]['options'] != '' ) {
				// options: 
				var opts = service.members_fields[i]['options'];
				opts = opts.split(',');
				var results = {};
				var value_default = '';
				for (j in opts) {
					var kv = opts[j].split(':');
					results[kv[0]] = kv[1];
					if (value_default == '') { value_default = kv[1]; }
				}
				if (value == undefined || typeof (value) === undefined) {
					mdata.push([ service.members_fields[i]['name_desc'], value_default ,service.members_fields_groups[service.members_fields[i]['group']]['name_full'] ]);
				} else {
					mdata.push([ service.members_fields[i]['name_desc'], results[value], service.members_fields_groups[service.members_fields[i]['group']]['name_full'] ]);
				}
			} else if (typeof (value) !== undefined && value != undefined) {
				mdata.push([ service.members_fields[i]['name_desc'], value, service.members_fields_groups[service.members_fields[i]['group']]['name_full'] ]);
			} else {
				mdata.push([ service.members_fields[i]['name_desc'], '', service.members_fields_groups[service.members_fields[i]['group']]['name_full'] ]);
			}
		}
		$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtmem-'+service.tabCounter+'-'+id+'"></table>');
		$('#dtmem-'+service.tabCounter+'-'+id).dataTable({
			"bJQueryUI": true, 
			"bSort": false,
			"bPaginate": false,
			"sScrollY": $('#'+tabid).height() - 90,
			"aaData": mdata,
			"aoColumns": header
		});
		$('<button id="edit-member-'+service.tabCounter+'-'+id+'" style="margin-right: 20px;"><img src="images/icons/edit.png" border=0 style="vertical-align: middle;"> Edit</button>').prependTo('#dtmem-'+service.tabCounter+'-'+id+'_filter');
		$('<button id="view-member-history-'+service.tabCounter+'-'+id+'" style="margin-right: 20px;"><img src="images/icons/list.png" border=0 style="vertical-align: middle;"> View History</button>').prependTo('#dtmem-'+service.tabCounter+'-'+id+'_filter');
		$('#edit-member-'+service.tabCounter+'-'+id).button()
			.click(function( event ) {
				if ($("#edit-member-dialog").length > 0) {
					$('#edit-member-dialog').remove();
				}
				var edit_fields;
				$('.ui-layout-center').append('\
						<div id="edit-member-dialog" title="Edit member">\
						<form>\
						<fieldset id="edit-member-fieldset">\
						</fieldset>\
						</form>\
						</div>\
				');
				var fields = service.members[id]['fields'];
				var cur_group = -1;
				var buttons = '';
				var has_country_autocomplete = false;
				var date_field_ids = [];

				for( m = 0; m < service.members_fields_ordered.length; m++) {
					var i = service.members_fields_ordered[m];
					if (service.members_fields[i]['is_enabled'] != 'y') { continue; }
					if (service.members_fields[i]['type'] == 'date') { date_field_ids.push('memedit-'+service.members_fields[i]['name_fixed']); }
					buttons = '';
					if (cur_group != service.members_fields[i]['group']) {
						cur_group = service.members_fields[i]['group'];
						buttons += '<h2>'+service.members_fields_groups[cur_group]['name_full']+'</h2>';
					}
					if (service.members_fields[i]['is_required'] == 'y') {
						buttons += '<label for="memedit-'+service.members_fields[i]['name_fixed']+'" style="display:block; margin-top: 7px; font-size: 12px; color: red;"><b>* '+service.members_fields[i]['name_desc']+'</b> <i>(required field)</i></label>';
					} else {
						buttons += '<label for="memedit-'+service.members_fields[i]['name_fixed']+'" style="display:block; margin-top: 7px; font-size: 12px; color: black;">'+service.members_fields[i]['name_desc']+'</label>';
					}
					var opts = service.members_fields[i]['options'];
					if (service.members_fields[i]['name_fixed'] == 'country') {
						var value = fields[i];
						if ( value == undefined ) { value = ''; }
						buttons += '<input type="text" maxlength="'+service.members_fields[i]['size_max']+'" name="memedit-'+service.members_fields[i]['name_fixed']+'" style="display: block; width: 450px;" class="text ui-widget-content ui-corner-all" value="'+value+'"/>';
						has_country_autocomplete = 'memedit-'+service.members_fields[i]['name_fixed'];
					} else if (service.members_fields[i]['name_fixed'] == 'institution_id') {
						var local_institutions = new Array();
						for (j in service.institutions) {
							if (service.institutions[j]['status'] != 'active') continue;
							var inst = service.institutions[j]['fields'];
							inst[1000] = j;
							local_institutions.push(inst);
						}
						local_institutions.sort(ComparatorInst);					
						buttons += '<select name="memedit-'+service.members_fields[i]['name_fixed']+'">';
						for (j = 0; j < local_institutions.length; j++) {
							var inst = local_institutions[j];
							buttons += '<option value="'+inst[1000]+'" ';
							if (inst[1000] == fields[i]) { buttons += 'selected=selected'; }
							buttons +='>'+inst[1]+'</option>';
						}
						buttons += '</select>';
					} else if ( !opts || 0 === opts.length ) {
						var value = fields[i];
						if (fields[i] == 'undefined' || fields[i] == undefined) {
							value = '';
						}
						buttons += '<input type="text" maxlength="'+service.members_fields[i]['size_max']+'" name="memedit-'+service.members_fields[i]['name_fixed']+'" style="display: block; width: 450px;" class="text ui-widget-content ui-corner-all" value="'+value+'"/>';
					} else {
						buttons += '<select name="memedit-'+service.members_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						opts = opts.split(',');
						for (j in opts) {
							var kv = opts[j].split(':');
							buttons += '<option value="'+kv[0]+'" ';
							if (kv[0] == fields[i]) { buttons += 'selected=selected'; }
							buttons += '>'+kv[1]+'</option>';
						}
						buttons += '</select>';
					}
					buttons += '<span style="font-size: 10px;"><i>'+service.members_fields[i]['hint_full']+'</i></span>';
					$('#edit-member-fieldset').append(buttons);
					if (has_country_autocomplete !== false) {
						$('[name="'+has_country_autocomplete+'"]').autocomplete({
							minLength: 3,
							source: function( request, response ) {
								var term = request.term;
								$.getJSON(service.service_url+'?q=/countries/search/autocomplete:yes/keyword:'+encodeURIComponent(request.term)+'/date:'+Date.now(), request, function( data, status, xhr ) {
									response( data );
								});
							}
						});
					}
				}
				
				$( "#edit-member-dialog" ).dialog({
					autoOpen: true,
					height: 500,
					width: 560,
					modal: true,
					open: function( event, ui ) {
						for (var i = 0; i < date_field_ids.length; i++) {
							$('[name="'+date_field_ids[i]+'"]').datepicker({
								changeMonth: true,
								changeYear: true,
								dateFormat: 'yy-mm-dd'
							});
						}
					},
					buttons: {
						"Toggle Status": function() {
							var edit_member_dialog = this;
							var status_from = service.members[id]['status'];
							var status_to = '';
							switch(status_from) {
								case 'active':
									status_to = 'inactive';
									break;
								case 'inactive':
									status_to = 'active';
									break;
								case 'onhold':
									status_to = 'active';
									break;
								default:
									break;
							}
							var fields = service.members[id]['fields'];
							
							// confirmation dialog:
							service.display_confirmation_dialog('Do you really want to change status for <b>'+fields[1]+' '+fields[3]+'</b> from <span class="red"><b>'+status_from+'</b> to <b>'+status_to+'</b></span>?', function() {
								$.ajax({
									url: service.service_url+'?q=/members/toggle/id:'+id+'/date:'+Date.now(),
									type: 'GET',
									dataType: 'json',
									success: function(data) {
										$(edit_member_dialog).dialog("close");
										// do member modify request here..
										service.get_members(function() { 
											$('li[aria-controls="'+tabid+'"]').remove();
											$('#'+tabid).remove();
											$("#tabs").tabs( "refresh" );
											service.display_member_details(id);
										}, 'all', 'full');
									}
								});
							});
						},
						"Update Information": function() {
							// scan fields, compare with existing values, prepare POST request, close member tab, open new member tab
							var fields = service.members[id]['fields'];
							var result = {};
								result["data"] = {};
								result["data"][id] = {};
							var missed_fields = [];
							for( i in service.members_fields) {
								var value_old = fields[i];
								var value_new = $('[name="memedit-'+service.members_fields[i]["name_fixed"]+'"]').val();
								if (service.members_fields[i]["is_required"] == 'y' && service.members_fields[i]["is_enabled"] == 'y' && (value_new == undefined || value_new == '')) {
									missed_fields.push(service.members_fields[i]["name_desc"]);
								}
								if (value_new != undefined && value_new != "undefined" && value_old != value_new) {
									if (value_old == undefined && value_new == '') {
										// skip empty entry..
									} else {				
										result["data"][id][i] = value_new;
									}
								}
							}
							if (missed_fields.length != 0) {
								service.display_notification_dialog('There are REQUIRED fields to be filled in: <span class="red"><b>'+missed_fields.join(", ")+'</b></span><br><br>Please complete form before submission.');
							} else {
							$.ajax({
								url: service.service_url+'?q=/members/update',
								type: 'POST',
								processData: false,
								data: JSON.stringify(result),
								contentType: 'application/json; charset=utf-8',
								dataType: 'json',
								success: function(data) {
									service.get_members(function() { 
										$('li[aria-controls="'+tabid+'"]').remove();
										$('#'+tabid).remove();
										$("#tabs").tabs( "refresh" );
										service.display_member_details(id);
									}, 'all', 'full');
								}
							});
							$(this).dialog( "close" );
							}
						},
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
						
					}
				});

				event.preventDefault();
			});
		$('#view-member-history-'+service.tabCounter+'-'+id).button()
			.click(function( event ) {
				$.ajax({
					url: service.service_url+'?q=/members/history/id:'+id+'/date:'+Date.now(),
						type: 'GET',
						dataType: 'json',
						success: function(data) {
							var label = 'History for '+service.members[id]['fields'][1]+' '+service.members[id]['fields'][3];
							var tabid = service.addTab(label);
							$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
							var header = [ {"sTitle": "Date", "sClass": "td_align_center"}, {"sTitle": "Field name"},
									{"sTitle":"Old Value", "sClass": "td_align_right"},
									{"sTitle": "", "sClass": "td_align_center"}, {"sTitle": "New Value", "sClass": "td_align_left"} ];
							var idata = [];
							for (i in data) {
								var data_from = '', data_to = '';
								switch (service.members_fields[data[i]['members_fields_id']]['type']) {
									case 'string':
										data_from = data[i]['value_from_string'];
										data_to = data[i]['value_to_string'];
										break;
									case 'int':
										data_from = data[i]['value_from_int'];
										data_to = data[i]['value_to_int'];
										break;
									case 'date':
										data_from = data[i]['value_from_date'];
										data_to = data[i]['value_to_date'];
										break;
									default:
										data_from = 'unknown type';
										data_to = 'unknown type';
										break;
								}
								if (service.members_fields[data[i]['members_fields_id']]['name_fixed'] == 'institution_id') {
									if (data_from != undefined && data_from != '') {
										data_from = service.institutions[data_from]['fields'][1];
									}
									if (data_to != undefined && data_to != '') {
										data_to = service.institutions[data_to]['fields'][1];
									}
								}
								idata.push([ data[i]['date'], service.members_fields[data[i]['members_fields_id']]['name_desc'], data_from, '=>', data_to]);
							}
							$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtmemhist-'+service.tabCounter+'-'+tabid+'"></table>');
							$('#dtmemhist-'+service.tabCounter+'-'+tabid).dataTable({
								"bJQueryUI": true, 
								"bSort": false,
								"bPaginate": false,
								"sScrollY": $('#'+tabid).height() - 72,
								"aaData": idata,
								"aoColumns": header
							});
						}
				});

				event.preventDefault();
			});
	},

	addTab: function(label) {
		this.tabCounter++;
		var id = "tabs-" + this.tabCounter;
		var li = $( this.tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );
		this.tabs.find( ".ui-tabs-nav" ).append( li );
		this.tabs.append( "<div id='" + id + "'></div>" );
		this.tabs.tabs( "refresh" );
		var theight = $('#tabs').height() - $('ul.ui-tabs-nav').height() - 10;
    	$('#'+id).css({
    	    'padding': 0,
        	'min-height': theight,
	        'overflow': 'auto'
	    });
		return id;
	},

	display_institutions: function() {
		var service = this;
		var header = [ {"bVisible": false}, {"sTitle": this.institutions_fields["1"]["name_desc"]}, 
			{"sTitle":this.institutions_fields["2"]["name_desc"], "sClass": "td_align_center"}, 
			{"sTitle":this.institutions_fields["41"]["name_desc"], "sClass": "td_align_center"}, 
			//{"sTitle":this.institutions_fields["3"]["name_desc"], "sClass": "td_align_right"}, 
			{"sTitle":this.institutions_fields["14"]["name_desc"]},
			{"sTitle":this.institutions_fields["40"]["name_desc"], "sClass": "td_align_center"}
			//{"sTitle": "Status","sClass": "td_align_center"}
			];
		var data = [];
		var reg = service.find_field_options_by_id_institutions(40);
		for (var i in this.institutions) {
			if (this.institutions[i]['status'] != 'active') { continue; } // only display active institutions
			var field = this.institutions[i]['fields'];
			var country = field[14];
			if (field[34] != undefined && typeof (field[34]) != undefined && field[34] != '') {
				country = '<img src="images/flags_iso_3166/16/'+field[34].toLowerCase()+'.png" style="vertical-align: middle;"> ' + country;
			}
			country = '<nobr>'+country+'</nobr>';
			var region = '';
			if (field[40] != undefined) {
				region = reg[field[40]];
			}
			var name_short = '';
			var name_group = '';
			if (field[2] != undefined) { name_short = field[2]; }
			if (field[41] != undefined) { join_date = field[41]; }
			if (field[3] != undefined) { name_group = field[3]; }
			data.push([ i, field[1], name_short, join_date, country, region ]);
		}
		var label = 'Institutions';
		var tabid = service.addTab(label);
		$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());

		$('#'+tabid).html('<p style="color: red; text-decoration: blink; font-size: 20px;"> Loading data, please wait..</p>');
		$('#'+tabid).delay(200).fadeIn(function() {


		$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtinst-'+tabid+'"></table>');
		var dtable = $('#dtinst-'+tabid).dataTable({
			"bJQueryUI": true, 
			"bProcessing": true,
			"bPaginate": false,
		    "sScrollY": $('#'+tabid).height() - 110,
			"aaSorting": [[ 1, "asc" ]],
			"aaData": data,
			"aoColumns": header
		});
		$('#dtinst-'+tabid+' tbody').delegate("tr", "click", function() {
			var pos = dtable.fnGetPosition( this );
			if (pos != null) {
		    	var aData = dtable.fnGetData(pos);
				service.display_institution_details(aData[0]);
			}
		});

		/*
		$('<span style="margin-right: 30px;"><input type="checkbox" id="inst-rep-'+tabid+'" checked> Display ACTIVE institutions only</span>').prependTo('#dtinst-'+tabid+'_filter');
		$.fn.dataTableExt.afnFiltering.push (
			function( settings, aData, iDataIndex ) {	
				if ( settings.nTable.id != ('dtinst-'+tabid) ) { return true; } // wrong table..
				if ( $('#inst-rep-'+tabid).is(':checked') ) {
					if (aData[6] == 'active') { return true; } else { return false; }
				} else {
					return true; // not checked!
				}
			}
		);
		*/
		$('#inst-rep-'+tabid).change( function() { dtable.fnDraw(); dtable.fnAdjustColumnSizing(); } );
		dtable.fnDraw();

		var adjust_table_columns = function() {
		  dtable.fnAdjustColumnSizing();
		};
		var column_sizing_timeout;

		$(window).resize(function() {
		  clearTimeout(column_sizing_timeout);
		  column_sizing_timeout = setTimeout( adjust_table_columns, 500 );
		});

		$('<button id="create-institution-'+tabid+'" style="margin-right: 20px;"><img src="images/icons/add.png" border=0 style="vertical-align: middle;"> Create Institution</button>').prependTo('#dtinst-'+tabid+'_filter');
		$('#create-institution-'+tabid).button()
			.click(function( event ) {
				if ($("#create-institution-dialog").length > 0) {
					$('#create-institution-dialog').remove();
				}
				var create_fields;
				$('.ui-layout-center').append('\
						<div id="create-institution-dialog" title="Create new institution">\
						<form>\
						<fieldset id="create-institution-fieldset">\
						</fieldset>\
						</form>\
						</div>\
				');
				var cur_group = -1;
				var buttons = '';
				var has_country_autocomplete = false;
				var date_field_ids = [];

				for( m = 0; m < service.institutions_fields_ordered.length; m++) {
					var i = service.institutions_fields_ordered[m];

					buttons = '';
					if (service.institutions_fields[i]['name_fixed'] == 'council_representative') { continue; }
					if (service.institutions_fields[i]['name_fixed'] == 'alt_council_representative') { continue; }
					if (service.institutions_fields[i]['name_fixed'] == 'exofficio_council_representative1') { continue; }
					if (service.institutions_fields[i]['name_fixed'] == 'exofficio_council_representative2') { continue; }
					if (service.institutions_fields[i]['type'] == 'date') { date_field_ids.push('instcreate-'+service.institutions_fields[i]['name_fixed']); }

					if (cur_group != service.institutions_fields[i]['group']) {
						cur_group = service.institutions_fields[i]['group'];
						buttons += '<h2>'+service.institutions_fields_groups[cur_group]['name_full']+'</h2>';
					}

					if (service.institutions_fields[i]['is_required'] == 'y') {
						buttons += '<label for="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display:block; margin-top: 7px; font-size: 12px; color: red;"><b>* '+service.institutions_fields[i]['name_desc']+'</b> <i>(required field)</i></label>';
					} else {
						buttons += '<label for="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display:block; margin-top: 7px; font-size: 12px; color: black;">'+service.institutions_fields[i]['name_desc']+'</label>';
					}

					var opts = service.institutions_fields[i]['options'];					
					if (service.institutions_fields[i]['name_fixed'] == 'country') {
						buttons += '<input type="text" maxlength="'+service.institutions_fields[i]['size_max']+'" name="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;" class="text ui-widget-content ui-corner-all" value=""/>';
						has_country_autocomplete = 'instcreate-'+service.institutions_fields[i]['name_fixed'];
					} else if (service.institutions_fields[i]['name_fixed'] == 'country_code') {
						buttons += '<select name="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="">*** please select country ***</option>';
						for (var k in service.countries) {
							buttons += '<option value="'+k+'">'+service.countries[k]+'</option>';
						}
						buttons += '</select>';
					} else if (service.institutions_fields[i]['name_fixed'] == 'council_representative') {
						buttons += '<select name="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="0">*** Please select Council Representative ***</option>';
						for (var k in service.members) {
							var field = service.members[k]['fields'];
							buttons += '<option value="'+k+'">'+field[3]+', '+field[1]+'</option>';	
						}
						buttons += '</select>';
					} else if ( service.institutions_fields[i]['name_fixed'] == 'alt_council_representative') {
						buttons += '<select name="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="0">*** Please select Alt. Council Representative ***</option>';
						for (var k in service.members) {
							var field = service.members[k]['fields'];
							buttons += '<option value="'+k+'">'+field[3]+', '+field[1]+'</option>';	
						}
						buttons += '</select>';
					} else if ( service.institutions_fields[i]['name_fixed'] == 'exofficio_council_representative1') {
						buttons += '<select name="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="0">*** Please select Ex-officio Council Representative 1 ***</option>';
						for (var k in service.members) {
							var field = service.members[k]['fields'];
							buttons += '<option value="'+k+'">'+field[3]+', '+field[1]+'</option>';	
						}
						buttons += '</select>';
					} else if ( service.institutions_fields[i]['name_fixed'] == 'exofficio_council_representative2') {
						buttons += '<select name="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						buttons += '<option value="0">*** Please select Ex-officio Council Representative 1 ***</option>';
						for (var k in service.members) {
							var field = service.members[k]['fields'];
							buttons += '<option value="'+k+'">'+field[3]+', '+field[1]+'</option>';	
						}
						buttons += '</select>';
					} else if ( !opts || 0 === opts.length ) {
						buttons += '<input type="text" maxlength="'+service.institutions_fields[i]['size_max']+'" name="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;" class="text ui-widget-content ui-corner-all" value=""/>';
					} else {
						buttons += '<select name="instcreate-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
						opts = opts.split(',');
						for (j in opts) {
							var kv = opts[j].split(':');
							buttons += '<option value="'+kv[0]+'">'+kv[1]+'</option>';
						}
						buttons += '</select>';
					}
					buttons += '<span style="font-size: 10px;"><i>'+service.institutions_fields[i]['hint_full']+'</i></span>';
					$('#create-institution-fieldset').append(buttons);
					if (has_country_autocomplete !== false) {
						$('[name="'+has_country_autocomplete+'"]').autocomplete({
							minLength: 3,
							source: function( request, response ) {
								var term = request.term;
								$.getJSON(service.service_url+'?q=/countries/search/autocomplete:yes/keyword:'+encodeURIComponent(request.term)+'/date:'+Date.now(), request, function( data, status, xhr ) {
									response( data );
								});
							}
						});
					}

				}
				$('select[name="instcreate-country_code"]').change(function() {
					if ($('select[name="instcreate-country_code"] option:selected').val() != '') {
						$('input[name="instcreate-country"]').val($('select[name="instcreate-country_code"] option:selected').text());
					}
				});
				$( "#create-institution-dialog" ).dialog({
					autoOpen: true,
					height: 500,
					width: 560,
					modal: true,
                    open: function( event, ui ) {
                        for (var i = 0; i < date_field_ids.length; i++) {
                            $('[name="'+date_field_ids[i]+'"]').datepicker({
                                changeMonth: true,
                                changeYear: true,
                                dateFormat: 'yy-mm-dd'
                            });
                        }
                    },
					buttons: {
						"Store Institution Information": function() {
							var result = {};
								result['data'] = {};
								result['data']['status'] = 'active';
								result['data']['fields'] = {};
							missed_fields = [];
							for( i in service.institutions_fields) {
								var value_new = $('[name="instcreate-'+service.institutions_fields[i]["name_fixed"]+'"]').val();
								if ( service.institutions_fields[i]["is_required"] == 'y' && service.institutions_fields[i]["is_enabled"] == 'y' && (value_new == "undefined" || value_new == '') ) {
									missed_fields.push(	service.institutions_fields[i]['name_desc'] );
								}  
								if (value_new != undefined && value_new != "undefined" && value_new != '') {
									result['data']['fields'][i] = value_new;
								}
							}
							if (missed_fields.length != 0) {
								service.display_notification_dialog('There are REQUIRED fields to be filled in: <span class="red"><b>'+missed_fields.join(", ")+'</b></span><br><br>Please complete form before submission.');
							} else {
							$.ajax({
								url: service.service_url+'?q=/institutions/create',
								type: 'POST',
								processData: false,
								data: JSON.stringify(result),
								contentType: 'application/json; charset=utf-8',
								dataType: 'json',
								success: function(data) {
									service.get_institutions('all', function() { 
										$('li[aria-controls="'+tabid+'"]').remove();
										$('#'+tabid).remove();
										$("#tabs").tabs( "refresh" );
										service.display_institutions();
									}, 'all', 'full');
								}
							});
							$(this).dialog( "close" );
							}
						},
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
						
					}
				});
				event.preventDefault();
			});
		});			
	},

	display_board: function() {
		var service = this;
		var label = 'EIC UG Institutional Board';
		var tabid = service.addTab(label);
		$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
		var header = [ {"bVisible": false},
			{"sTitle": this.members_fields["1"]["name_desc"], "sClass": "td_align_right"},
			{"sTitle":this.members_fields["3"]["name_desc"], "sClass": "td_align_left"},
			{"sTitle":this.members_fields["20"]["name_desc"], "sClass":"td_align_right"},
			{"sTitle": "Institution", "sClass": "td_align_center"},
			{"sTitle": "Country", "sClass": "td_align_left"},
			{"sTitle": "Area", "sClass": "td_align_right"},
			{"sTitle": "Notes", "sClass": "td_align_center"}
			];
		var data = [];
		// scan institutions to find representatives:
		for (var i in this.institutions) {
			if (this.institutions[i]['status'] != 'active') { continue; } // only display active institutions
			var field = this.institutions[i]['fields'];
			var rep1 = field[9] || 0;
			var rep2 = field[46] || 0;
			var exrep1 = field[47] || 0;
			var exrep2 = field[48] || 0;
			if ( rep1 > 0 && this.members[rep1] ) {
				var mfield = this.members[rep1]['fields'];
				var country = '';
				if (this.institutions[mfield[17]] != undefined) {
					country = '<nobr>'+this.institutions[mfield[17]]['fields'][14]+'</nobr>';
					var code = this.institutions[mfield[17]]['fields'][34];
					if (code != undefined && typeof (code) != undefined && code != '') {
						country = '<img src="images/flags_iso_3166/16/'+code.toLowerCase()+'.png" style="vertical-align: middle;"> ' + country;
					}
				}
				var name_first = mfield[1], name_last = mfield[3], email = mfield[20] || '';
            	var area = '';
	            if ( mfield[89] != undefined ) {
    	            if ( mfield[89] == 't' ) { area = "Theory"; }
        	        else if ( mfield[89] == 'e' ) { area = "Experiment"; }
            	    else if ( mfield[89] == 'a' ) { area = "Accelerator"; }
                	else if ( mfield[89] == 's' ) { area = "Support"; }
	            }
				data.push([ rep1, name_first, name_last, email,
					this.institutions[mfield[17]] ? '<span onClick="client.display_institution_details('+mfield[17]+')">'+this.institutions[mfield[17]]['fields'][1]+'</span>' : 'N/A',
					country, area, '' ]);
			}
			if ( rep2 > 0 && this.members[rep2] ) {
				var mfield = this.members[rep2]['fields'];
				var country = '';
				if (this.institutions[mfield[17]] != undefined) {
					country = '<nobr>'+this.institutions[mfield[17]]['fields'][14]+'</nobr>';
					var code = this.institutions[mfield[17]]['fields'][34];
					if (code != undefined && typeof (code) != undefined && code != '') {
						country = '<img src="images/flags_iso_3166/16/'+code.toLowerCase()+'.png" style="vertical-align: middle;"> ' + country;
					}
				}
				var name_first = mfield[1], name_last = mfield[3], email = mfield[20] || '';
            	var area = '';
	            if ( mfield[89] != undefined ) {
    	            if ( mfield[89] == 't' ) { area = "Theory"; }
        	        else if ( mfield[89] == 'e' ) { area = "Experiment"; }
            	    else if ( mfield[89] == 'a' ) { area = "Accelerator"; }
                	else if ( mfield[89] == 's' ) { area = "Support"; }
	            }
				data.push([ rep2, name_first, name_last, email,
					this.institutions[mfield[17]] ? '<span onClick="client.display_institution_details('+mfield[17]+')">'+this.institutions[mfield[17]]['fields'][1]+'</span>' : 'N/A',
					country, area, '' ]);
			}
			if ( exrep1 > 0 && this.members[exrep1] ) {
				var mfield = this.members[exrep1]['fields'];
				var country = '';
				if (this.institutions[mfield[17]] != undefined) {
					country = '<nobr>'+this.institutions[mfield[17]]['fields'][14]+'</nobr>';
					var code = this.institutions[mfield[17]]['fields'][34];
					if (code != undefined && typeof (code) != undefined && code != '') {
						country = '<img src="images/flags_iso_3166/16/'+code.toLowerCase()+'.png" style="vertical-align: middle;"> ' + country;
					}
				}
				var name_first = mfield[1], name_last = mfield[3], email = mfield[20] || '';
            	var area = '';
	            if ( mfield[89] != undefined ) {
    	            if ( mfield[89] == 't' ) { area = "Theory"; }
        	        else if ( mfield[89] == 'e' ) { area = "Experiment"; }
            	    else if ( mfield[89] == 'a' ) { area = "Accelerator"; }
                	else if ( mfield[89] == 's' ) { area = "Support"; }
	            }
				data.push([ exrep1, name_first, name_last, email,
					this.institutions[mfield[17]] ? '<span onClick="client.display_institution_details('+mfield[17]+')">'+this.institutions[mfield[17]]['fields'][1]+'</span>' : 'N/A',
					country, area, 'Ex-Officio' ]);
			}
			if ( exrep2 > 0 && this.members[exrep2] ) {
				var mfield = this.members[exrep2]['fields'];
				var country = '';
				if (this.institutions[mfield[17]] != undefined) {
					country = '<nobr>'+this.institutions[mfield[17]]['fields'][14]+'</nobr>';
					var code = this.institutions[mfield[17]]['fields'][34];
					if (code != undefined && typeof (code) != undefined && code != '') {
						country = '<img src="images/flags_iso_3166/16/'+code.toLowerCase()+'.png" style="vertical-align: middle;"> ' + country;
					}
				}
				var name_first = mfield[1], name_last = mfield[3], email = mfield[20] || '';
            	var area = '';
	            if ( mfield[89] != undefined ) {
    	            if ( mfield[89] == 't' ) { area = "Theory"; }
        	        else if ( mfield[89] == 'e' ) { area = "Experiment"; }
            	    else if ( mfield[89] == 'a' ) { area = "Accelerator"; }
                	else if ( mfield[89] == 's' ) { area = "Support"; }
	            }
				data.push([ exrep2, name_first, name_last, email,
					this.institutions[mfield[17]] ? '<span onClick="client.display_institution_details('+mfield[17]+')">'+this.institutions[mfield[17]]['fields'][1]+'</span>' : 'N/A',
					country, area, 'Ex-Officio' ]);
			}
		}

		$('#'+tabid).html('<p style="color: red; text-decoration: blink; font-size: 20px;"> Loading data, please wait..</p>');
		$('#'+tabid).delay(200).fadeIn(function() {

		$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtboa-'+tabid+'"></table>');
		var dtable = $('#dtboa-'+tabid).dataTable({
			"bJQueryUI": true, 
			"bProcessing": true,
			"bPaginate": false,
			"aaSorting": [[ 2, "asc" ]],
		    "sScrollY": $('#'+tabid).height() - 96,
			"aaData": data,
			"aoColumns": header
		});
		$('#dtboa-'+tabid+' tbody').delegate("tr", "click", function() {
			var pos = dtable.fnGetPosition( this );
			if (pos != null) {
		    	var aData = dtable.fnGetData(pos);
				service.display_member_details(aData[0]);
			}
		});

		dtable.fnDraw();
		var adjust_table_columns_members = function() {
          dtable.fnAdjustColumnSizing();
        };
        var member_column_sizing_timeout;

        $(window).resize(function() {
          clearTimeout(member_column_sizing_timeout);
          member_column_sizing_timeout = setTimeout( adjust_table_columns_members, 500 );
        });

		}); // fadein 

	},


	display_members:function(id) {
		var service = this;
		var label = 'Members';
		if (id != undefined) {
			label += ': '+this.institutions[id]['fields'][1];
		}
		var tabid = service.addTab(label);
		$('#tabs').tabs('option', 'active', $('#'+tabid+'Selector').index());
		
		var header = [ {"bVisible": false}, {"sTitle": this.members_fields["1"]["name_desc"], "sClass": "td_align_right"}, 
			{"sTitle":this.members_fields["3"]["name_desc"], "sClass": "td_align_left"}, 
			{"sTitle":this.members_fields["20"]["name_desc"], "sClass":"td_align_right"}, 
			{"sTitle": "Institution", "sClass": "td_align_center"},
			{"sTitle": "Country", "sClass": "td_align_left"},
			{"sTitle": "Area", "sClass": "td_align_center"}
			];
		var data = [];
		for (var i in this.members) {
			if ( this.members[i]['status'] != 'active' ) { continue; }
			var field = this.members[i]['fields'];
			if (id != undefined && field[17] != id) { continue; }

			var country = '';
			if (this.institutions[field[17]] != undefined) {
				country = '<nobr>'+this.institutions[field[17]]['fields'][14]+'</nobr>';
				var code = this.institutions[field[17]]['fields'][34];
				if (code != undefined && typeof (code) != undefined && code != '') {
					country = '<img src="images/flags_iso_3166/16/'+code.toLowerCase()+'.png" style="vertical-align: middle;"> ' + country;
				}
			}
			var name_first = field[1], name_last = field[3], email = '';
			if (field[40] == 'y') {
				name_first = '<span style="color: blue;">'+name_first+'</span>';
				name_last = '<span style="color: blue;">'+name_last+'</span>';
			}
			if (field[43] == 'y') {
				name_first = '<b>'+name_first+'</b>';
				name_last = '<b>'+name_last+'</b>';
			}
			if (field[44] == 'y') {
				name_first = '<u>'+name_first+'</u>';
				name_last = '<u>'+name_last+'</u>';
			}
			if (field[20] != undefined) { email = field[20]; }
            var physicist = "";
            if ( field[89] != undefined ) {
                if ( field[89] == 't' ) { physicist = "Theory"; }
                else if ( field[89] == 'e' ) { physicist = "Experiment"; }
                else if ( field[89] == 'a' ) { physicist = "Accelerator"; }
                else if ( field[89] == 's' ) { physicist = "Support"; }
            }

			data.push([ i, name_first, name_last, 
				email, 
				this.institutions[field[17]] ? '<span onClick="client.display_institution_details('+field[17]+')">'+this.institutions[field[17]]['fields'][1]+'</span>' : 'N/A', 
				country, physicist ]);
		}
		$('#'+tabid).html('<p style="color: red; text-decoration: blink; font-size: 20px;"> Loading data, please wait..</p>');
		$('#'+tabid).delay(200).fadeIn(function() {

		$('#'+tabid).html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="dtmem-'+tabid+'"></table>');
		var dtable = $('#dtmem-'+tabid).dataTable({
			"bJQueryUI": true, 
			"bProcessing": true,
			"bPaginate": false,
			"aaSorting": [[ 2, "asc" ]],
		    "sScrollY": $('#'+tabid).height() - 96,
			"aaData": data,
			"aoColumns": header
		});
		$('#dtmem-'+tabid+' tbody').delegate("tr", "click", function() {
			var pos = dtable.fnGetPosition( this );
			if (pos != null) {
		    	var aData = dtable.fnGetData(pos);
				service.display_member_details(aData[0]);
			}
		});

		/*
		$('<span style="margin-right: 30px;"><input type="checkbox" id="mem-rep-'+tabid+'" checked> Display ACTIVE members only</span>').prependTo('#dtmem-'+tabid+'_filter');
		$.fn.dataTableExt.afnFiltering.push (
			function( settings, aData, iDataIndex ) {	
				if ( settings.nTable.id != ('dtmem-'+tabid) ) { return true; } // wrong table..
				if ( $('#mem-rep-'+tabid).is(':checked') ) {
					if (aData[6] == 'active') { return true; } else { return false; }
				} else {
					return true; // not checked!
				}
			}
		);
		*/
		$('#mem-rep-'+tabid).change( function() { dtable.fnDraw(); } );
		dtable.fnDraw();

		var adjust_table_columns_members = function() {
          dtable.fnAdjustColumnSizing();
        };
        var member_column_sizing_timeout;

        $(window).resize(function() {
          clearTimeout(member_column_sizing_timeout);
          member_column_sizing_timeout = setTimeout( adjust_table_columns_members, 500 );
        });


		});
	},

	get_institutions_fields: function(callback) {
		var req = '/service/list/object:fields/type:institutions';
		var service = this;
		$.get(this.service_url+'/?q='+req, function(data) {
			service.institutions_fields = data;
			service.institutions_fields_ordered = orderKeys(data, function(a, b) {
				  if (a.group == b.group) { return a.weight - b.weight; }
				  return service.institutions_fields_groups[a.group].weight - service.institutions_fields_groups[b.group].weight;
			});
			if (typeof callback === 'function') {
				callback();
			}
		}, "json");
	},

	get_institutions_fields_groups: function(callback) {
		var req = '/service/list/object:fieldgroups/type:institutions';
		var service = this;
		$.get(this.service_url+'/?q='+req, function(data) {
			service.institutions_fields_groups = data;
			service.institutions_fields_groups_ordered = orderKeys(data, function(a, b) {
				  return a.weight - b.weight;
			});	
			if (typeof callback === 'function') {
				callback();
			}
		}, "json");		
	},

	get_institutions: function(status, callback)  {
		var req = '/institutions/list';
		if (typeof status != 'undefined') { req += '/status:'+status; }
		var service = this;
		$.get(this.service_url+'/?q='+req, function(data) {
			service.institutions = data;
			if (typeof callback === 'function') {
				callback();
			}
		}, "json");
	},

	get_members_fields: function(callback) {
		var req = '/service/list/object:fields/type:members';
		var service = this;
		$.get(this.service_url+'/?q='+req, function(data) {
			service.members_fields = data;
			service.members_fields_ordered = orderKeys(data, function(a, b) {
				  if (a.group == b.group) { return a.weight - b.weight; }
				  return service.members_fields_groups[a.group].weight - service.members_fields_groups[b.group].weight;
			});	
			if (typeof callback === 'function') {
				callback();
			}
		}, "json");		
	},

	get_members_fields_groups: function(callback) {
		var req = '/service/list/object:fieldgroups/type:members';
		var service = this;
		$.get(this.service_url+'/?q='+req, function(data) {
			service.members_fields_groups = data;
			service.members_fields_groups_ordered = orderKeys(data, function(a, b) {
				  return a.weight - b.weight;
			});
			if (typeof callback === 'function') {
				callback();
			}
		}, "json");		
	},

	get_members: function(callback, status, details, institution_id) {
		var req = '/members/list';
		if (typeof status != 'undefined') { req += '/status:'+status; }
		if (typeof details != 'undefined') { req += '/details:'+details; }
		if (typeof institution_id != 'undefined') { req += '/institution:'+institution_id; }
		var service = this;
		$.get(this.service_url+'/?q='+req, function(data) {
			service.members = data;
			if (typeof callback === 'function') {
				callback();
			}

		}, "json");
	},

	get_countries: function(callback) {
		var req = '/countries/list';
		var service = this;
		$.get(this.service_url+'/?q='+req, function(data) {
			service.countries = data;
			if (typeof callback === 'function') {
				callback();
			}
		}, "json");
	},

	confirm_mass_email: function() {
	  var service = this;
	  var r = confirm("Do you want to send out notifications containing PhoneBook information?");
	  if (r == true) {
    	$.ajax({
      	  url: service.service_url+'?q=/mail/send&rnd='+Math.random(),
          type: 'GET',
          processData: false,
          dataType: 'json',
          success: function(data) {
			alert('Notifications were sent out successfully');
          },
		  error: function(e) {
			alert('Failed to send notification.. Please retry later.');
		  }
        });
	  } else {
		alert('Notifications were canceled by administrator');
	  }
	}
}
