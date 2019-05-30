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

        this.service_url = 'http://www.eicug.org/pnb/service/index.php';

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
}

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
			service.get_members_fields(function() {
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

	export_excel: function() {
		var service = this;
		if ($("#export-excel-dialog").length > 0) {
			$('#export-excel-dialog').remove();
		}
		$('.ui-layout-center').append('\
			<div id="export-excel-dialog" title="Export members data into Excel format">\
				<form>\
					<fieldset id="export-excel-fieldset"><legend>Please mark desired fields</legend>\
					</fieldset>\
				</form>\
			</div>\
		');
		var max_line = 3;
		var out = '';
		var cnt = 0;
		var sort1 = '<p>Sort by <SELECT id="sort_1" style="display: inline-block;"><OPTION value="">FIRST SORTING FIELD</OPTION>', sort2 = '<SELECT id="sort_2"><OPTION value="">SECOND SORTING FIELD</OPTION>';
		for (var m = 0; m < service.members_fields_ordered.length; m++) {
			var i = service.members_fields_ordered[m];
			var fields = service.members_fields[i];
			sort1 += '<OPTION value="'+fields['id']+'" ';
			if (fields['name_fixed'] == 'institution_id') { sort1 += 'selected=selected'; }
			sort1 += '>'+fields['name_desc']+'</OPTION>';
			sort2 += '<OPTION value="'+fields['id']+'" ';
			if (fields['name_fixed'] == 'name_last') { sort2 += 'selected=selected'; }
			sort2 += '>'+fields['name_desc']+'</OPTION>';
			var checked = '';
			if (fields['name_fixed'] == 'name_first' || fields['name_fixed'] == 'name_last' 
				|| fields['name_fixed'] == 'email' || fields['name_fixed'] == 'institution_id' || fields['name_fixed'] == 'is_author'
				|| fields['name_fixed'] == 'date_joined' || fields['name_fixed'] == 'date_leave') {
				checked = ' checked=checked';
			}
			out += '<div style="width: 180px; display: inline-block; border-bottom: 1px dashed silver; border-left: 1px dashed silver;"><label for="id_'+fields['id']+'"><input type="checkbox" id="id_'+fields['id']+'" '+checked+' /> '+fields['name_desc']+'</label></div>'; 
			cnt += 1;
			if (cnt >= max_line) {
				out += '<br>';
				cnt = 0;
			}
		}
		sort1 += '</SELECT>, then by ';
		sort2 += '</SELECT></p>';
		
		$('#export-excel-fieldset').append(out);
		$('#export-excel-fieldset').append(sort1+sort2);
		$('#export-excel-dialog').dialog({
			autoOpen: true,
			height: 500,
			width: 640,
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
					var url = service.service_url+'?q=/members/excel/fields:'+ids;
					url += '/sort:'+$('#sort_1 option:selected').val();
					url += ','+$('#sort_2 option:selected').val();
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
		var titles = { "p_1" : 'Institutions - Region of the World', 'p_2': 'Institutions - Country' , 'p_3': 'Members - Gender', 'p_4': 'Members - Region of the World', 'p_5': 'Members - Country', 'p_6': 'Members - Area', 'p_7': 'Board Members - Gender', 'p_8': 'Board Members - Area of Expertise' };
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
					//$('#chart-plot').attr('download', 'image.png');
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
						if (mem['fields'][field_id] == undefined) {
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
			if ( service.members[i]['fields'][85] != undefined && service.members[i]['fields'][85] != '0000-00-00 00:00:00'
			  && strtotime(service.members[i]['fields'][85]) < now ) { continue; }
			if ( service.members[i]['fields'][17] == undefined || service.members[i]['fields'][17] == 0
			  ) { continue; }
			if ( service.institutions[ service.members[i]['fields'][17] ]['status'] != 'active' ) { continue; }
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

		var selects = '<p>I. EIC User Group: <ul><li><b>'+num_mem+'</b> members</li><li><b>'+num_inst+'</b> institutions</li><li><b>'+num_cntr+'</b> countries (<b>'+num_reg+'</b> world regions)</li></ul> </p>';
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
			selects += '<option value="bar" class="p_1 p_2 p_3 p_4 p_5 p_6 p_8" >Bar Chart</option>';
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
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
							$( this ).dialog( "close" );
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
						Cancel: function() {
							$( this ).dialog( "close" );
						}
					},
					close: function() {
							$( this ).dialog( "close" );
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
        $('body').append('<div id="worldmapdialog" title="EIC Collaboration, Institution Locations over the World"><div id="worldmap" style="height: 100%; width: 100%"></div></div>');
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

	display_search_members: function() {
		var service = this;
		if ($("#search-members-dialog").length > 0) {
			$('#search-members-dialog').dialog('open');
		} else {
			$('.ui-layout-center').append('<div id="search-members-dialog" title="Seach members">\
			<select name="search-members-filter-type" id="search-members-filter-type">\
			<option value="combined">filter: combined</option>\
			<option value="damlev">filter: fuzzy</option>\
			<option value="equals">filter: equals</option>\
			<option value="starts_with">filter: starts with</option>\
			<option value="ends_with">filter: ends with</option>\
			<option value="soundex">filter: similar sounding</option>\
			</select>\
			<input id="search-members-input" type="text"><button id="search-members-button">Search</button>\
			</div>');
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
					$.getJSON(service.service_url+'?q=/service/search/object:members/type:'+type+'/keyword:'+encodeURIComponent(request.term)+'/autocomplete:yes', request, function( data, status, xhr ) {
						response( data );
					});
				}
			});
			$('#search-members-button').unbind('click');
			$('#search-members-button').click(function() {
				var keyword = $('#search-members-input').val();
				var type = $('#search-members-filter-type').val();
				$('#search-members-dialog').dialog('close');
				$.getJSON(service.service_url+'?q=/service/search/object:members/type:'+type+'/keyword:'+encodeURIComponent(keyword)+'/autocomplete:no', function( data, status, xhr ) {
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
		if ($("#search-institutions-dialog").length > 0) {
			$('#search-institutions-dialog').dialog('open');
		} else {
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
				$.getJSON(service.service_url + '?q=/service/search/object:institutions/type:'+type+'/keyword:'+encodeURIComponent(request.term)+'/autocomplete:yes', request, function( data, status, xhr ) {
					response( data );
				});
			}
		});
		$('#search-institutions-button').unbind('click');
		$('#search-institutions-button').click(function() {
			var keyword = $('#search-institutions-input').val();
			var type = $('#search-institutions-filter').val();
			$('#search-institutions-dialog').dialog("close");
			$.getJSON(service.service_url+'?q=/service/search/object:institutions/type:'+type+'/keyword:'+encodeURIComponent(keyword)+'/autocomplete:no', function( data, status, xhr ) {
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

		//---------------------------------------------------------------------------------------------------------

		// institution details:

		var inst_full_name = service.institutions[id]["fields"][ this.find_field_id_institutions('name_full') ];
		var inst_addr1 = service.institutions[id]["fields"][ this.find_field_id_institutions('address_line_1') ];
		var inst_addr2 = service.institutions[id]["fields"][ this.find_field_id_institutions('address_line_2') ];
		var inst_city = service.institutions[id]["fields"][ this.find_field_id_institutions('city') ];
		var inst_country = service.institutions[id]["fields"][ this.find_field_id_institutions('country') ];
		var inst_country_code = service.institutions[id]["fields"][ this.find_field_id_institutions('country_code') ];
		var inst_state = service.institutions[id]["fields"][ this.find_field_id_institutions('state') ];
		var inst_zip = service.institutions[id]["fields"][ this.find_field_id_institutions('postcode') ];

		var content = '<p style="padding: 10px;"><img src="images/sectionTitleStar.gif" border=0> <strong>'+inst_full_name+'</strong><br>';
		if (inst_addr1 != undefined && inst_addr1 != '') {
			content += inst_addr1 + '<br>';
		}
		if (inst_addr2 != undefined && inst_addr2 != '') {
			content += inst_addr2 + '<br>';
		}
		if (inst_city != undefined && inst_city != '') {
			content += inst_city;
		}
		if (inst_state != undefined && inst_state != '' && inst_zip != undefined && inst_zip != '') {
			content += ', ' + inst_state +' ' + inst_zip;
		}
		if (inst_country != undefined && inst_country != '') {
			content += '<br>' + inst_country + ' ' + '<img src="images/flags_iso_3166/16/'+inst_country_code.toLowerCase()+'.png" style="vertical-align: middle;"> '+ '<br>';
		}
		content += '</p>';

		// list of members:
		content += '<p style="padding: 10px;"><strong>Collaboration members:</strong><br>';

		// service.display_members(id);
		var inst_members = [];
		var now = Math.round(+new Date()/1000); // unixtime
		for (var i in this.members) {
			var field = this.members[i]['fields'];
			if ( id != undefined && field[17] != id ) { continue; }
			if ( field[17] == undefined || field[17] == 0 ) { continue; }
			if ( this.institutions[field[17]] == undefined ) { continue; }
			if ( this.institutions[ field[17] ]['status'] != 'active' ) { continue; }
		    if ( field[85] != undefined && field[85] != '' && field[85] != '0000-00-00' && field[85] != '0000-00-00 00:00:00' && strtotime(field[85]) < now ) { continue; }

			var name_first = field[1], name_last_unmodified = field[3], name_last = field[3], email = '';
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

			inst_members.push( { 'key': name_last_unmodified, 'val' : name_first + ' ' + name_last, 'id': i } );
		}
		inst_members.sort( function(a, b) {
		  var x = a.key, y = b.key;
		  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		});
		var memlist = [];
		for (var i = 0; i < inst_members.length; i++) {
		  memlist.push('<span style="cursor: pointer;" onClick="client.display_member_details('+inst_members[i].id+')">' + inst_members[i].val + '</span>');
		}
		content += memlist.join(', ');

		content += '</p>';

		var inst_council_rep_id = service.institutions[id]["fields"][ this.find_field_id_institutions('council_representative') ];
		var inst_alt_council_rep_id = service.institutions[id]["fields"][ this.find_field_id_institutions('alt_council_representative') ];
		var exofficio_council_rep_id1 = service.institutions[id]["fields"][ this.find_field_id_institutions('exofficio_council_representative1') ];
		var exofficio_council_rep_id2 = service.institutions[id]["fields"][ this.find_field_id_institutions('exofficio_council_representative2') ];
		content += '<p style="padding: 5px;">Institution representative(s) on EIC User Group Council: ';
		var reps = [];
		if (inst_council_rep_id != undefined && inst_council_rep_id != 0 ) {
			// counsil representative:
			var field = this.members[inst_council_rep_id]['fields'];
			var name_first = field[1], name_last_unmodified = field[3], name_last = field[3];
			reps.push( '<span style="cursor: pointer;" onClick="client.display_member_details('+inst_council_rep_id+')"><strong>' + name_first + ' ' + name_last + '</strong></span>' );
		}
		if ( inst_alt_council_rep_id != undefined && inst_alt_council_rep_id != 0 ) {
			var afield = this.members[inst_alt_council_rep_id]['fields'];
			var aname_first = afield[1], aname_last_unmodified = afield[3], aname_last = afield[3];
			reps.push( '<span style="cursor: pointer;" onClick="client.display_member_details('+inst_alt_council_rep_id+')"><strong>' + aname_first + ' ' + aname_last + '</strong></span>' );
		}
		content += reps.join(', ') + '</p>';

		var exofficioreps = [];
		if (exofficio_council_rep_id1 != undefined && exofficio_council_rep_id1 != 0 ) {
			// counsil representative:
			var field = this.members[exofficio_council_rep_id1]['fields'];
			var name_first = field[1], name_last_unmodified = field[3], name_last = field[3];
			exofficioreps.push( '<span style="cursor: pointer;" onClick="client.display_member_details('+exofficio_council_rep_id1+')"><strong>' + name_first + ' ' + name_last + '</strong></span>' );
		}
		if ( exofficio_council_rep_id2 != undefined && exofficio_council_rep_id2 != 0 ) {
			var afield = this.members[exofficio_council_rep_id2]['fields'];
			var aname_first = afield[1], aname_last_unmodified = afield[3], aname_last = afield[3];
			exofficioreps.push( '<span style="cursor: pointer;" onClick="client.display_member_details('+exofficio_council_rep_id2+')"><strong>' + aname_first + ' ' + aname_last + '</strong></span>' );
		}
		if ( exofficioreps.length > 0 ) {
			content += '<p style="padding: 5px;">Ex-officio representative(s) on EIC User Group Council: ';
			content += exofficioreps.join(', ') + '</p>';
		}

		$('#'+tabid).html(content);

		$('<button id="list-members-'+service.tabCounter+'-'+id+'" style="margin-right: 20px;"><img src="images/icons/list.png" border=0 style="vertical-align: middle;">List Members</button>').prependTo('#dtinst-'+service.tabCounter+'-'+id+'_filter');
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
						var local_members = new Array();
						for (var k in service.members) {
							var field = service.members[k]['fields'];
							if (value == undefined || field[17] != id || service.members[k]['status'] != 'active') { continue; }
							field[1000] = k;
							local_members.push(field);
						}
						local_members.sort(ComparatorName);
						buttons += '<select name="instedit-'+service.institutions_fields[i]['name_fixed']+'" style="display: block; width: 450px;">';
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
							$.getJSON(service.service_url+'?q=/countries/search/autocomplete:yes/keyword:'+encodeURIComponent(request.term), request, function( data, status, xhr ) {
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
									url: service.service_url+'?q=/institutions/toggle/id:'+id,
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
								$.getJSON(service.service_url+'?q=/countries/search/autocomplete:yes/keyword:'+encodeURIComponent(request.term), request, function( data, status, xhr ) {
									response( data );
								});
							}
						});
					}
				}
				$('[name^="memcreate-name_"]').focusout(function() {
					var name_last = $(this).val();
					$.getJSON(service.service_url+'?q=/service/search/object:members/type:combined/field:3/keyword:'+encodeURIComponent(name_last), function( data, status, xhr ) {
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
					url: service.service_url+'?q=/institutions/history/id:'+id,
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
								if ( service.institutions_fields[data[i]['institutions_fields_id']]['name_fixed'] == 'council_representative' ) {
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
		var content = '<p style="padding: 10px;">';
		var inst_id = fields[this.find_field_id_members('institution_id')];

		var inst_full_name = service.institutions[inst_id]["fields"][ this.find_field_id_institutions('name_full') ];
		var inst_addr1 = service.institutions[inst_id]["fields"][ this.find_field_id_institutions('address_line_1') ];
		var inst_addr2 = service.institutions[inst_id]["fields"][ this.find_field_id_institutions('address_line_2') ];
		var inst_city = service.institutions[inst_id]["fields"][ this.find_field_id_institutions('city') ];
		var inst_country = service.institutions[inst_id]["fields"][ this.find_field_id_institutions('country') ];
		var inst_country_code = service.institutions[inst_id]["fields"][ this.find_field_id_institutions('country_code') ];
		var inst_state = service.institutions[inst_id]["fields"][ this.find_field_id_institutions('state') ];
		var inst_zip = service.institutions[inst_id]["fields"][ this.find_field_id_institutions('postcode') ];

		var mem_name_first = fields[ this.find_field_id_members('name_first') ];
		var mem_name_last = fields[ this.find_field_id_members('name_last') ];
		var mem_name_unicode = fields[ this.find_field_id_members('name_unicode') ];

		var mem_addr1 = fields[ this.find_field_id_members('address_line_1') ];
		var mem_addr2 = fields[ this.find_field_id_members('address_line_2') ];
		var mem_addr3 = fields[ this.find_field_id_members('address_line_3') ];
		var mem_city = fields[ this.find_field_id_members('city') ];
		var mem_state = fields[ this.find_field_id_members('state') ];
		var mem_country = fields[ this.find_field_id_members('country') ];
		var mem_postcode = fields[ this.find_field_id_members('postcode') ];
		var mem_email = fields[ this.find_field_id_members('email') ];
		var mem_phone_home = fields[ this.find_field_id_members('phone_home') ];
		var mem_fax = fields[ this.find_field_id_members('fax') ];

		content += '<strong><big>' + mem_name_first + ' ' + mem_name_last + '</big></strong><br>';
		if (mem_name_unicode != undefined && mem_name_unicode != '') {
		  content += '<i>( '+mem_name_unicode+' )</i><br>';
		}
		content += '<br><span style="cursor: pointer;" onClick="client.display_institution_details('+inst_id+')"><strong>'+inst_full_name + '</strong></span><br><br>';

		if (mem_addr1 != undefined && mem_addr1 != '' && mem_city != undefined && mem_city != '' && mem_postcode != undefined && mem_postcode != '') {
		  // local address
		  content += mem_addr1 + '<br>';
		  if (mem_addr2 != undefined && mem_addr2 != '') {
			content += mem_addr2 + '<br>';
		  }
		  if (mem_addr3 != undefined && mem_addr3 != '') {
			content += mem_addr3 + '<br>';
		  }
		  content += mem_city + ' ';
		  if (mem_state != undefined && mem_state != '' && mem_postcode != undefined && mem_postcode != '') {
			content += ', ' + mem_state +' '+mem_postcode;
		  }
		  content += '<br>';
		} else {
		  // institution address
  		  if (inst_addr1 != undefined && inst_addr1 != '') {
		  	content += inst_addr1 + '<br>';
		  }
		  if (inst_addr2 != undefined && inst_addr2 != '') {
			content += inst_addr2 + '<br>';
		  }
		  if (inst_city != undefined && inst_city != '') {
			content += inst_city;
		  }
		  if (inst_state != undefined && inst_state != '' && inst_zip != undefined && inst_zip != '') {
			content += ', ' + inst_state +' ' + inst_zip;
		  }
		  if (inst_country != undefined && inst_country != '') {
			content += '<br>' + inst_country + ' ' + '<img src="images/flags_iso_3166/16/'+inst_country_code.toLowerCase()+'.png" style="vertical-align: middle;"> '+ '<br>';
		  }
		}
		content += '<br>';
		if (mem_email != undefined && mem_email != '') { content += 'Email: <a href="mailto:'+mem_email+'">' + mem_email + '</a><br>'; }
		if (mem_phone_home != undefined && mem_phone_home != '') { content += 'Phone: ' + mem_phone_home + '<br>'; }
		if (mem_fax != undefined && mem_fax != '') { content += 'Fax: ' + mem_fax + '<br>'; }

		content += '</p>';
		$('#'+tabid).html(content);

		/*
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
		$('<button id="view-member-history-'+service.tabCounter+'-'+id+'" style="margin-right: 20px;"><img src="images/icons/list.png" border=0 style="vertical-align: middle;"> View History</button>').prependTo('#dtmem-'+service.tabCounter+'-'+id+'_filter');
		*/

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
								$.getJSON(service.service_url+'?q=/countries/search/autocomplete:yes/keyword:'+encodeURIComponent(request.term), request, function( data, status, xhr ) {
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
									url: service.service_url+'?q=/members/toggle/id:'+id,
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
					url: service.service_url+'?q=/members/history/id:'+id,
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
			{"sTitle":this.institutions_fields["14"]["name_desc"]}, {"sTitle":this.institutions_fields["40"]["name_desc"], "sClass": "td_align_center"} ];
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
			if (field[3] != undefined) { name_group = field[3]; }
			data.push([ i, field[1], name_short, country, region ]);
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
								$.getJSON(service.service_url+'?q=/countries/search/autocomplete:yes/keyword:'+encodeURIComponent(request.term), request, function( data, status, xhr ) {
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
                        country = '<img src="images/flags_iso_3166/16/'+code.toLowerCase()+'.png" style="vertical-align: middle;"> '+country;
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
                        country = '<img src="images/flags_iso_3166/16/'+code.toLowerCase()+'.png" style="vertical-align: middle;"> '+country;
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
                        country = '<img src="images/flags_iso_3166/16/'+code.toLowerCase()+'.png" style="vertical-align: middle;"> '+country;
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
			{"sTitle": "Area", "sClass": "td_align_center"} ];
		var data = [];

		var now = Math.round(+new Date()/1000); // unixtime
		for (var i in this.members) {
			if ( this.members[i]['status'] != 'active' ) { continue; }
			var field = this.members[i]['fields'];
			if ( id != undefined && field[17] != id ) { continue; }
			if ( field[17] == undefined || field[17] == 0 ) { continue; }
			if ( this.institutions[field[17]] == undefined ) { continue; }
			if ( this.institutions[ field[17] ]['status'] != 'active' ) { continue; }
		    if ( field[85] != undefined && field[85] != '' && field[85] != '0000-00-00' && field[85] != '0000-00-00 00:00:00' && strtotime(field[85]) < now ) { continue; }

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
	}
}
