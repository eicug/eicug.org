<!DOCTYPE HTML>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Electron-Ion Collider Users Group</title>

<link rel="stylesheet" type="text/css" href="css/jquery.layout.css" >
<link rel="stylesheet" type="text/css" href="css/redmond/jquery.ui.min.css" > 
<link rel="stylesheet" type="text/css" href="css/jquery.dataTables.css" >
<link rel="stylesheet" type="text/css" href="css/styles.css" >
<link rel="stylesheet" type="text/css" href="css/jquery.jqplot.css" >
<link rel="stylesheet" type="text/css" href="css/leaflet.css" >

<script type="text/javascript" src="js/jquery.min.js"></script>
<script type="text/javascript" src="js/jquery.ui.min.js"></script>
<script type="text/javascript" src="js/jquery.layout.min.js"></script>
<script type="text/javascript" src="js/jquery.dataTables.min.js"></script>
<script type="text/javascript" src="js/jquery.chained.min.js"></script>
<script type="text/javascript" src="js/Blob.js"></script>
<script type="text/javascript" src="js/FileSaver.js"></script>
<script type="text/javascript" src="js/xlsx.core.min.js"></script>
<script type="text/javascript" src="js/strtotime.js"></script>
<script type="text/javascript" src="js/download2.js"></script>
<script type="text/javascript" src="js/leaflet.js"></script>
<script src="http://maps.google.com/maps/api/js?v=3&sensor=false"></script>
<script type="text/javascript" src="js/Google.js"></script>
<script src="http://api-maps.yandex.ru/2.0/?load=package.map&lang=ru-RU" type="text/javascript"></script>
<script type="text/javascript" src="js/Yandex.js"></script>

<!--[if lt IE 9]><script language="javascript" type="text/javascript" src="js/excanvas.min.js"></script><![endif]-->
<script type="text/javascript" src="js/jquery.jqplot.js"></script>
<SCRIPT type="text/javascript" src="js/plugins/jqplot.pieRenderer.min.js"></SCRIPT>
<SCRIPT type="text/javascript" src="js/plugins/jqplot.barRenderer.min.js"></SCRIPT>
<SCRIPT type="text/javascript" src="js/plugins/jqplot.categoryAxisRenderer.min.js"></SCRIPT>
<SCRIPT type="text/javascript" src="js/plugins/jqplot.pointLabels.min.js"></SCRIPT>
<SCRIPT type="text/javascript" src="js/plugins/jqplot.canvasAxisLabelRenderer.min.js"></SCRIPT>
<SCRIPT type="text/javascript" src="js/plugins/jqplot.canvasAxisTickRenderer.min.js"></SCRIPT>
<SCRIPT type="text/javascript" src="js/plugins/jqplot.canvasTextRenderer.min.js"></SCRIPT>

<script type="text/javascript" src="js/restful-client.js"></script>

<script type="text/javascript">
  var client = new RCLIENT.Phonebook();

  var myLayout;
  $(document).ready(function() { 
  	myLayout = $('body').layout({
    	applyDefaultStyles: true,
		north__spacing_open: 0,
		south__spacing_open: 0,
		east__spacing_open: 2,
		west__spacing_open: 2,
        west__size: 260,
        east__size: 0.2,
        center__onresize: function (pane, $Pane, paneState) {}
	});
	client.tabs = $('#tabs').tabs({ "active": 0 }).css({
		// 'min-height': $('.ui-layout-center').height() - $('ul.ui-tabs-nav').height(),
   		'min-height': $('.ui-layout-center').height() - 10,
   		'overflow': 'auto'
	});
	var theight = $('#tabs').height() - $('ul.ui-tabs-nav').height();
	$('#tabs-1').css({
		'padding': 0,
   		'min-height': theight,
   		'overflow': 'auto'
	});
	$('#tabs').delegate( "span.ui-icon-close", "click", function() {
		var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
		$( "#" + panelId ).remove();
		$('#tabs').tabs("refresh");
	});
 	client.initialize();
  });

</script>

</head>
<body>
 
  <div class="ui-layout-west">
	<div class="ui-layout-content ui-widget-content">
		<h2>Phonebook</h2>
		<ul style="list-style-type: none;">
			<li onClick="client.display_institutions()" style="cursor: pointer"><img src="images/icons/list.png" border=0 style="vertical-align: middle;"> Institutions</li>
			<li onClick="client.display_members()" style="cursor: pointer"><img src="images/icons/list.png" border=0 style="vertical-align: middle;"> Members</li>
			<li onClick="client.display_board()" style="cursor: pointer"><img src="images/icons/list.png" border=0 
style="vertical-align: middle;"> Institutional Board</li>
		</ul>
		<ul style="list-style-type: none;">
			<li onClick="client.display_search_institutions()" style="cursor: pointer"><img src="images/icons/find.png" border=0 style="vertical-align: middle;"> Institutions</li>
			<li onClick="client.display_search_members()" style="cursor: pointer"><img src="images/icons/find.png" border=0 style="vertical-align: middle;"> Members</li>
			<li onClick="client.display_filter_members()" style="cursor: pointer"><img src="images/icons/find.png" border=0 style="vertical-align: middle;"> Filter Members</li>
		</ul>
		<ul style="list-style-type: none;">
			<li onClick="client.display_statistics()" style="cursor: pointer"><img src="images/icons/stat.png" border=0 style="vertical-align: middle;"> Statistics / Graphs</li>
			<li onClick="client.display_worldmap()" style="cursor: pointer"><img src="images/icons/stat.png" border=0 style="vertical-align: middle;"> World Map</li>

			<li onClick="client.export_excel()" style="cursor: pointer"><img src="images/icons/excel.png" border=0 style="vertical-align: middle;"> Data Export</li>
			<li onClick="client.export_excel_board()" style="cursor: pointer"><img src="images/icons/excel.png" border=0 style="vertical-align: middle;"> Board Data Export</li>
			<!-- <li onClick="client.confirm_mass_email()" style="cursor: pointer; margin-top: 10px;"><img src="images/icons/excel.png" border=0 style="vertical-align: middle;"> Mass Email Notifications</li> -->
		</ul>
		<h2>Management</h2>
		<ul style="list-style-type: none;">
			<li onClick="client.display_institution_fields()" style="cursor: pointer"><img src="images/icons/edit.png" border=0 style="vertical-align: middle;"> Institution Fields</li>
			<li onClick="client.display_member_fields()" style="cursor: pointer"><img src="images/icons/edit.png" border=0 style="vertical-align: middle;"> Member Fields</li>
		</ul>
		<ul style="list-style-type: none;">
			<li onClick="client.display_institution_fieldgroups()" style="cursor: pointer"><img src="images/icons/edit.png" border=0 style="vertical-align: middle;"> Institution FieldGroups</li>
			<li onClick="client.display_member_fieldgroups()" style="cursor: pointer"><img src="images/icons/edit.png" border=0 style="vertical-align: middle;"> Member FieldGroups</li>
		</ul>
		<h2>External links</h2>
		<ul style="list-style-type: none;">
			<li><a target="_blank" href="http://www.eicug.org/" style="text-decoration: none;"><img src="images/icons/link-star.png" style="vertical-align: middle;"> EIC-UG WWW</a></li>
			<li><a target="_blank" href="http://www.stonybrook.edu/" style="text-decoration: none;"><img src="images/icons/link-star.png" style="vertical-align: middle;"> SBU WWW</a></li>
			<li><a target="_blank" href="http://www.star.bnl.gov/" style="text-decoration: none;"><img src="images/icons/link-star.png" style="vertical-align: middle;"> STAR WWW</a></li>
		</ul>
	</div>
  </div>

  <div class="ui-layout-south ui-widget-header">
    <h4 class="ui-widget-header" style="font-family: 'Oswald', verdana;">EIC User Group, 2015-2016</h4>
  </div>

  <div class="ui-layout-north">
	<div style="position: absolute; top: 10px; right: 10px;" id="close_all_tabs">[close all tabs]</div>
	<div id="notification" style="position:relative; float:left; color: red;"></div>
    <h3 class="ui-widget-header" style="font-weight: normal; font-size: 24px; color: #FFFF50; font-family: 'Oswald', verdana;">
	<div style="position: absolute; top: 10px; left: 10px; color: #FFF !important;" ><a href="http://www.eicug.org/pnb/"
        style="color: #FFF; text-decoration: none; font-size: 0.8em !important;">[ to PUBLIC version ]</a> :::
		<a href="http://www.eicug.org/" style="color: #FFF; text-decoration: none; font-size: 0.8em !important;" >
 [ back to EICUG WEBSITE ]</a>
		</div>
		<span style="color: #000099;">PhoneBook:</span> Electron-Ion Collider Users Group
		<!-- <img src="images/icons/star.png" border=0 style="vertical-align: middle;"> <span style="color: red; text-shadow: 2px 2px #6666ff;">STAR</span> <span style="color: white; text-shadow: 2px 2px #777;">PhoneBook</span> <sup><span style="font-size: 9px;">2.0</span></sup> -->
	</h3>
  </div>

 <div class="ui-layout-center">
        <div id="tabs">
            <ul>
                <li><a href="#tabs-1">Intro</a></li>
            </ul>
        	<div id="tabs-1">
				<h2 style="color: #F00; text-shadow: none;">NOTE: this is an Administrative Interface for EIC UG</h2>
				<p>If you need client interface, which does not allow modifications of records, please <a href="../../pnb/">click HERE</a>.</p>

				<h2>I. General Information</h2>
				<p>EIC PhoneBook allows one to find out information about EIC institutions and members of each institution, as well as statistical information on the EIC Users Group.
				Menu on the left contains clickable links. Click it, see new tab appear in the central pane. 
				Tabs could be closed by click on the [x] sign at upper-right corner.
				</p>
				<p>Main options:
				<ul>
					<li>List institutions, members</li>
					<li>Search institutions and members using several algorithms including fuzzy match</li>
					<li>Administration tasks: create new institution. Click on "Institutions" first, then click on "create institution" button)</li>
					<li>Administration tasks: create new member. Click on "Institutions", select institution, then click on "add member" button)</li>
				</ul>
				</p>
				<h2>II. Contact Information</h2>
				<p>Please send you comments and suggestions to Site Administrator, <a style="text-decoration: underline" href="mailto:admin@eicug.org?subject:eicug.org issue">admin@eicug.org</a></p>
            </div>
        </div>

 </div>

</body>
</html>
