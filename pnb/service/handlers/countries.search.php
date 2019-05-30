<?php

#
# Get countries list using search algorithms: levenshtein, contains
#
# /countries/search/type:levenshtein/autocomplete:yes/
#
#

function countries_search_handler($params) {
  $cnf =& ServiceConfig::Instance();

  if (isset($params['autocomplete']) && !empty($params['autocomplete'])) {
    $params['autocomplete'] = strtolower($params['autocomplete']);
    if ($params['autocomplete'] == 'yes' || $params['autocomplete'] == 'y' || $params['autocomplete'] == 1) {
        $params['autocomplete'] = true;
    } else {
        $params['autocomplete'] = false;
    }
  } else {
    $params['autocomplete'] = false;
  }

  $countries = array();
  $data = file('data/country_names_and_code_elements_txt.htm');
  foreach($data as $k => $v) {
	list($name, $code) = explode(';', $v); 
	$name = trim($name);
	$code = trim($code);
	$countries[$code] = $name;
  }

  if (empty($params['type'])) {
	$params['type'] = 'contains';
  } else {
	$params['type'] = strtolower($params['type']);
  }

  $result = array();
  if ($params['autocomplete'] == true) {
		$kw = metaphone(strtolower($params['keyword']));
		foreach ($countries as $k => $v) {
			$v = strtolower($v);
			if ( metaphone($v) == $kw && !in_array(strtoupper($v), $result) ) {
				$result[] = strtoupper($v);
			}
		}
		$kw = strtolower($params['keyword']);
		if (strlen($kw) > 3) {
			foreach ($countries as $k => $v) {
				$v = strtolower($v);
				if ( levenshtein($v, $kw) < 3 && !in_array(strtoupper($v), $result) ) {
					$result[] = strtoupper($v);
				}
			}
		}
		$kw = strtolower($params['keyword']);
		foreach ($countries as $k => $v) {
			$v = strtolower($v);
			if ( strpos($v, $kw) !== false && !in_array(strtoupper($v), $result) ) {
				$result[] = strtoupper($v);
			}
		}
  }
  return json_encode($result);
}
