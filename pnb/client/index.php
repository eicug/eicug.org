<!DOCTYPE HTML>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
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
		</ul>
		<ul style="list-style-type: none;">
			<li onClick="client.display_statistics()" style="cursor: pointer"><img src="images/icons/stat.png" border=0 style="vertical-align: middle;"> Statistics / Graphs</li>
			<li onClick="client.display_worldmap()" style="cursor: pointer"><img src="images/icons/stat.png" border=0 style="vertical-align: middle;"> World Map</li>
		</ul>
	</div>
  </div>

  <div class="ui-layout-south ui-widget-header">
    <h4 class="ui-widget-header" style="font-family: 'Oswald', verdana;">EIC User Group, 2015-2016</h4>
  </div>

  <div class="ui-layout-north">
	<div style="position: absolute; top: 10px; right: 10px; color: silver;" id="close_all_tabs">[close all tabs]</div>
	<div id="notification" style="position:relative; float:left; color: red;"></div>
    <h3 class="ui-widget-header" style="font-weight: normal; font-size: 24px; color: #5CB8E6; font-family: 'Oswald', verdana;">
		<div style="position: absolute; top: 10px; left: 10px; color: #FFF !important;" ><a href="http://www.eicug.org/pnb_admin/"
		style="color: #AAA; text-decoration: none; font-size: 0.8em !important;">[ to ADMIN version ]</a> :::
        <a href="http://www.eicug.org/" style="color: #AAA; text-decoration: none; font-size: 0.8em !important;" > [ back to EICUG WEBSITE ]</a>
		</div>
		<span style="color: #FFFF50;">PhoneBook:</span> Electron-Ion Collider Users Group
		<!-- <img src="images/icons/star.png" border=0 style="vertical-align: middle;"> <span style="color: red; text-shadow: 2px 2px #6666ff;">STAR</span> <span style="color: white; text-shadow: 2px 2px #777;">PhoneBook</span> <sup><span style="font-size: 9px;">2.0</span></sup> -->
	</h3>
  </div>

 <div class="ui-layout-center">
        <div id="tabs">
            <ul>
                <li><a href="#tabs-1">Intro</a></li>
            </ul>
        	<div id="tabs-1">
				<h2>I. General Information</h2>
				<p>EIC PhoneBook allows one to find out information about EIC institutions and members of each institution, as well as statistical information on the EIC Users Group.
				Menu on the left contains clickable links. Click it, see new tab appear in the central pane. 
				Tabs could be closed by click on the [x] sign at upper-right corner.
				</p>
				<p>Main options:
				<ul>
					<li>List institutions, members</li>
					<li>Search institutions and members using several algorithms including fuzzy match</li>
					<li>Explore statistical data and various visualisations</li>
				</ul>
				</p>
				<h2>II. Contact Information</h2>
				<p>Please send you comments and suggestions to Site Administrator, <a style="text-decoration: underline" href="mailto:admin@eicug.org?subject=eicug.org issue">admin@eicug.org</a></p>
            </div>
        </div>

 </div>

</body>
</html>
