<?php

#
# SEARCH OBJECT LIST:
#
# /service/search/object:[institutions,members]/type:[equals,contains,starts_with,ends_with,damlev,soundex,combined]/keyword:[user_keyword]/autocomplete:[yes]
#
# PARAMETERS:
#
# /autocomplete:[yes]/ - return plain array of values found, without user IDs
# /field:[n]/ - search this field only.
#
# EXTRA: 
#
# constrain search by groups? Say, members by group: "name", or group "address", "contact info"
# 					Say, institutions by group: "personal" or group "address" or "address_bnl"
#

function service_search_handler($params) {
  $types = array('contains','starts_with','ends_with','equals','damlev','soundex', 'combined');
  $cnf =& ServiceConfig::Instance();
  $res = array();

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

  if (isset($params['object']) && !empty($params['object']) 
		&& isset($params['type']) && !empty($params['type'])
		&& isset($params['keyword']) && !empty($params['keyword'])) {

	if (in_array($params['type'], $types)) {
	switch ($params['object']) {
		case 'members':
			if (isset($params['field']) && !empty($params['field'])) {
				return json_encode(search_members_by_field($params['keyword'], $params['field']));
			} else {
				return json_encode(search_members($params['keyword'], $params['type'], $params['autocomplete']));
			}
			break;
		case 'institutions':
			return json_encode(search_institutions($params['keyword'], $params['type'], $params['autocomplete']));
			break;
		default:
			break;
	} // switch object

	} // in array type

  } // if isset..
  return json_encode($res);
}

function search_members_by_field($keyword, $field_id) {
	$cnf =& ServiceConfig::Instance();
    $db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$query = 'SELECT DISTINCT(`members_id`), `value`, damlev(LOWER(`value`), LOWER("'.$keyword.'")) AS dist FROM `'.$db_name.'`.`members_data_strings` WHERE `members_fields_id` = '.intval($field_id).' AND damlev(LOWER(`value`),LOWER("'.$keyword.'")) <= 3 ORDER BY dist LIMIT 10';
	$res = $db->Query($query);
	return $res;
}

function search_members($keyword, $type, $autocomplete) {
	$type = strtolower($type);
	$cnf =& ServiceConfig::Instance();
    $db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$keyword = $db->Escape($keyword);
	$operation = '';
	$query = '';
	$res = array();
	switch ($type) {
		case 'combined':
			$operation = 'LIKE "%'.$keyword.'%"';
			$query = 'SELECT members_id, `value` FROM `'.$db_name.'`.`members_data_strings` WHERE `value` '.$operation.' GROUP BY `members_id` ORDER BY `members_id` LIMIT 5';
			$r = $db->Query($query);
			$res = array_merge($res, $r);
			$query = 'SELECT DISTINCT(`members_id`), `value`, damlev(LOWER(`value`), LOWER("'.$keyword.'")) AS dist FROM `'.$db_name.'`.`members_data_strings` WHERE damlev(LOWER(`value`),LOWER("'.$keyword.'")) <= 3 ORDER BY dist LIMIT 5';
			$r = $db->Query($query);
			$res = array_merge($res, $r);
			$query = 'SELECT DISTINCT(`members_id`), `value` FROM `'.$db_name.'`.`members_data_strings` WHERE SOUNDEX(`value`) = SOUNDEX("'.$keyword.'") LIMIT 5';
			$r = $db->Query($query);
			$res = array_merge($res, $r);
			break;
		case 'contains':
			$operation = 'LIKE "%'.$keyword.'%"';
			$query = 'SELECT members_id, `value` FROM `'.$db_name.'`.`members_data_strings` WHERE `value` '.$operation.' GROUP BY `members_id` ORDER BY `members_id`';
			$res = $db->Query($query);
			break;
		case 'starts_with':
			$operation = 'LIKE "'.$keyword.'%"';
			$query = 'SELECT members_id, `value` FROM `'.$db_name.'`.`members_data_strings` WHERE `value` '.$operation.' GROUP BY `members_id` ORDER BY `members_id`';
			$res = $db->Query($query);
			break;
		case 'ends_with':
			$operation = 'LIKE "%'.$keyword.'"';
			$query = 'SELECT members_id, `value` FROM `'.$db_name.'`.`members_data_strings` WHERE `value` '.$operation.' GROUP BY `members_id` ORDER BY `members_id`';
			$res = $db->Query($query);
			break;
		case 'damlev':
			if ($autocomplete == true) {
				$query = 'SELECT `members_id`, `value`, damlev(LOWER(`value`), LOWER("'.$keyword.'")) AS dist FROM `'.$db_name.'`.`members_data_strings` WHERE damlev(LOWER(`value`),LOWER("'.$keyword.'")) <= 3 GROUP BY `value` ORDER BY dist LIMIT 10';
			} else {
				$query = 'SELECT DISTINCT(`members_id`), `value`, damlev(LOWER(`value`), LOWER("'.$keyword.'")) AS dist FROM `'.$db_name.'`.`members_data_strings` WHERE damlev(LOWER(`value`),LOWER("'.$keyword.'")) <= 3 ORDER BY dist LIMIT 10';
			}
			$res = $db->Query($query);
			break;
		case 'soundex':
			$query = 'SELECT DISTINCT(`members_id`), `value` FROM `'.$db_name.'`.`members_data_strings` WHERE SOUNDEX(`value`) = SOUNDEX("'.$keyword.'") LIMIT 10';
			$res = $db->Query($query);
			break;
		case 'equals':
		case 'default':
			$operation = '= "'.$keyword.'"';
			$query = 'SELECT members_id, `value` FROM `'.$db_name.'`.`members_data_strings` WHERE `value` '.$operation.' GROUP BY `members_id` ORDER BY `members_id`';
			$res = $db->Query($query);
			break;
	}

	$out = array();
	if ($autocomplete == true && !empty($res)) {
		foreach($res as $k => $v) {
			$out[] = $v['value'];
		}
		return array_unique($out);
	} else {
		foreach($res as $k => $v) {
			$out[$v['members_id']] = $v;
		}
		$out = array_values($out);
	}
	if (!empty($out)) { return $out; }
	return array();
}

function search_institutions($keyword, $type, $autocomplete) {
	$type = strtolower($type);
	$cnf =& ServiceConfig::Instance();
    $db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$keyword = $db->Escape($keyword);
	$operation = '';
	$query = '';
	$res = array();
	switch ($type) {
		case 'combined':
			$query = 'SELECT institutions_id, `value` FROM `'.$db_name.'`.`institutions_data_strings` WHERE `value` LIKE "%'.$keyword.'%" GROUP BY `institutions_id` ORDER BY `institutions_id`';
	   		$r = $db->Query($query);
			$res = array_merge($res, $r);
			$query = 'SELECT DISTINCT(`institutions_id`), `value`, damlev(LOWER(`value`), LOWER("'.$keyword.'")) AS dist FROM `'.$db_name.'`.`institutions_data_strings` WHERE damlev(LOWER(`value`),LOWER("'.$keyword.'")) <= 3 ORDER BY dist LIMIT 10';
    		$r = $db->Query($query);
			$res = array_merge($res, $r);
			$query = 'SELECT DISTINCT(`institutions_id`), `value` FROM `'.$db_name.'`.`institutions_data_strings` WHERE SOUNDEX(`value`) = SOUNDEX("'.$keyword.'") LIMIT 10';
    		$r = $db->Query($query);
			$res = array_merge($res, $r);
			break;
		case 'contains':
			$query = 'SELECT institutions_id, `value` FROM `'.$db_name.'`.`institutions_data_strings` WHERE `value` LIKE "%'.$keyword.'%" GROUP BY `institutions_id` ORDER BY `institutions_id`';
    		$res = $db->Query($query);
			break;
		case 'starts_with':
			$query = 'SELECT institutions_id, `value` FROM `'.$db_name.'`.`institutions_data_strings` WHERE `value` LIKE "'.$keyword.'%" GROUP BY `institutions_id` ORDER BY `institutions_id`';
    		$res = $db->Query($query);
			break;
		case 'ends_with':
			$query = 'SELECT institutions_id, `value` FROM `'.$db_name.'`.`institutions_data_strings` WHERE `value` LIKE "%'.$keyword.'" GROUP BY `institutions_id` ORDER BY `institutions_id`';
    		$res = $db->Query($query);
			break;
		case 'damlev':
			$query = 'SELECT DISTINCT(`institutions_id`), `value`, damlev(LOWER(`value`), LOWER("'.$keyword.'")) AS dist FROM `'.$db_name.'`.`institutions_data_strings` WHERE damlev(LOWER(`value`),LOWER("'.$keyword.'")) <= 3 ORDER BY dist LIMIT 10';
    		$res = $db->Query($query);
			break;
		case 'soundex':
			$query = 'SELECT DISTINCT(`institutions_id`), `value` FROM `'.$db_name.'`.`institutions_data_strings` WHERE SOUNDEX(`value`) = SOUNDEX("'.$keyword.'") LIMIT 10';
    		$res = $db->Query($query);
			break;
		case 'equals':
		case 'default':
			$query = 'SELECT institutions_id, `value` FROM `'.$db_name.'`.`institutions_data_strings` WHERE `value` = "'.$keyword.'" GROUP BY `institutions_id` ORDER BY `institutions_id`';
    		$res = $db->Query($query);
			break;
	}
	$out = array();
	if ($autocomplete == true && !empty($res)) {
		foreach($res as $k => $v) {
			$out[] = $v['value'];
		}
		return array_unique($out);
	} else {
		foreach($res as $k => $v) {
			$out[$v['institutions_id']] = $v;
		}
		$out = array_values($out);
	}
	if (!empty($out)) { return $out; }
	return array();
}
