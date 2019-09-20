<?php

#
# Modify fields 
#
# /service/modify/object:fields/type:[institutions,members]
#
# POST data should contain 
# "data": { 
#	"<field_id1> : {
#		"property_name1": "property_value1", 
#		"property_nameN": "property_valueN"
#	 },
#	"<field_idN>": {
#		"property_name1": "property_value1", 
#		"property_nameN": "property_valueN"
#	 },
# }
#

function service_modify_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $res = array('error' => 'missing object or type or data');
  if (isset($params['object']) && !empty($params['object']) && isset($params['type']) && !empty($params['type']) && isset($params['data'])) {
	switch ($params['object']) {
		case 'fields':
			switch ($params['type']) {
				case 'members':
					return json_encode(modify_members_fields($params['data']));
					break;
				case 'institutions':
	 	 			return json_encode(modify_institutions_fields($params['data']));
					break;
				default:
					return json_encode(array('error' => 'unknown type: '.$params['type']));
					break;
			}
			break;
		case 'fieldgroups':
			switch ($params['type']) {
				case 'members':
					return json_encode(modify_members_fields_groups($params['data']));
					break;
				case 'institutions':
	 	 			return json_encode(modify_institutions_fields_groups($params['data']));
					break;
				default:
					return json_encode(array('error' => 'unknown type: '.$params['type']));
					break;
			}
			break;
		default:
			return json_encode(array('error' => 'unknown object: '.$params['object']));
			break;
	}
  }
  return json_encode($res);
}

function modify_institutions_fields($data) {
	$cnf =& ServiceConfig::Instance();
  	$db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$set = array();
	foreach($data as $k => $v) { // iterate over field ids
		$query = 'UPDATE `'.$db_name.'`.`institutions_fields` SET';
		foreach($v as $k2 => $v2) { // iterate over column changes for the specific field id
			$k2 = strtolower(trim($k2));
			$name = $db->Escape($k2);
			switch($k2) {
				case 'weight':
				case 'size_min':
				case 'size_max':
				case 'group':
					$set[] = '`'.$k2.'` = '.intval($v2);
					break;
				case 'name_desc':
				case 'options':
				case 'hint_short':
				case 'hint_full':
					$v2 = trim($v2);
					$set[] = '`'.$k2.'` = "'.$db->Escape($v2).'"';
					break;
				case 'is_required':
				case 'is_enabled':
					$v2 = strtolower(trim($v2));
					if ($v2 == 'y' || $v2 == 'n') {
						$set[] = '`'.$k2.'` = "'.$v2.'"';
					}
					break;
				case 'privacy':
					$v2 = strtolower(trim($v2));
					if ($v2 == 'public' || $v2 == 'users_auth' || $v2 == 'users_admin') {
						$set[] = '`'.$k2.'` = "'.$v2.'"';
					}
					break;
				default:
					break;
			}
		}
		$query .= implode(' , ', $set);
		$query .= ' WHERE `id` = '.intval($k);
		$db->Query($query);
	}
	return true;
}

function modify_institutions_fields_groups($data) {
	$cnf =& ServiceConfig::Instance();
  	$db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$set = array();
	foreach($data as $k => $v) { // iterate over field ids
		$query = 'UPDATE `'.$db_name.'`.`institutions_fields_groups` SET';
		foreach($v as $k2 => $v2) { // iterate over column changes for the specific field id
			$k2 = strtolower(trim($k2));
			$name = $db->Escape($k2);
			switch($k2) {
				case 'weight':
					$set[] = '`'.$k2.'` = '.intval($v2);
					break;
				case 'name_short':
				case 'name_full':
					$v2 = trim($v2);
					$set[] = '`'.$k2.'` = "'.$db->Escape($v2).'"';
					break;
				case 'is_enabled':
					$v2 = strtolower(trim($v2));
					if ($v2 == 'y' || $v2 == 'n') {
						$set[] = '`'.$k2.'` = "'.$v2.'"';
					}
					break;
				default:
					break;
			}
		}
		$query .= implode(' , ', $set);
		$query .= ' WHERE `id` = '.intval($k);
		$db->Query($query);
	}
	return true;
}


function modify_members_fields($data) {
	$cnf =& ServiceConfig::Instance();
  	$db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$set = array();
	foreach($data as $k => $v) { // iterate over field ids
		$query = 'UPDATE `'.$db_name.'`.`members_fields` SET';
		foreach($v as $k2 => $v2) { // iterate over column changes for the specific field id
			$k2 = strtolower(trim($k2));
			$name = $db->Escape($k2);
			switch($k2) {
				case 'weight':
				case 'size_min':
				case 'size_max':
				case 'group':
					$set[] = '`'.$k2.'` = '.intval($v2);
					break;
				case 'name_desc':
				case 'options':
				case 'hint_short':
				case 'hint_full':
					$v2 = trim($v2);
					$set[] = '`'.$k2.'` = "'.$db->Escape($v2).'"';
					break;
				case 'is_required':
				case 'is_enabled':
					$v2 = strtolower(trim($v2));
					if ($v2 == 'y' || $v2 == 'n') {
						$set[] = '`'.$k2.'` = "'.$v2.'"';
					}
					break;
				case 'privacy':
					$v2 = strtolower(trim($v2));
					if ($v2 == 'public' || $v2 == 'users_auth' || $v2 == 'users_user' || $v2 == 'users_admin') {
						$set[] = '`'.$k2.'` = "'.$v2.'"';
					}
					break;
				default:
					break;
			}
		}
		$query .= implode(' , ', $set);
		$query .= ' WHERE `id` = '.intval($k);
		$db->Query($query);
	}
	return true;
}

function modify_members_fields_groups($data) {
	$cnf =& ServiceConfig::Instance();
  	$db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$set = array();
	foreach($data as $k => $v) { // iterate over field ids
		$query = 'UPDATE `'.$db_name.'`.`members_fields_groups` SET';
		foreach($v as $k2 => $v2) { // iterate over column changes for the specific field id
			$k2 = strtolower(trim($k2));
			$name = $db->Escape($k2);
			switch($k2) {
				case 'weight':
					$set[] = '`'.$k2.'` = '.intval($v2);
					break;
				case 'name_short':
				case 'name_full':
					$v2 = trim($v2);
					$set[] = '`'.$k2.'` = "'.$db->Escape($v2).'"';
					break;
				case 'is_enabled':
					$v2 = strtolower(trim($v2));
					if ($v2 == 'y' || $v2 == 'n') {
						$set[] = '`'.$k2.'` = "'.$v2.'"';
					}
					break;
				default:
					break;
			}
		}
		$query .= implode(' , ', $set);
		$query .= ' WHERE `id` = '.intval($k);
		$db->Query($query);
	}
	return true;
}
