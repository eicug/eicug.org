<?php

#
# Get countries list:
#
# /countries/list
#
#

function countries_list_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $countries = array();
  $data = file('data/country_names_and_code_elements_txt.htm');
  foreach($data as $k => $v) {
	list($name, $code) = explode(';', $v); 
	$name = trim($name);
	$code = trim($code);
	$countries[$code] = $name;
  }
  return json_encode($countries);
}
