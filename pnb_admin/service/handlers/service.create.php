<?php

#
# Create fields 
#
# /service/create/object:[fields,fieldgroups]/type:[institutions,members]
#
# POST data should contain for fields:
#
# "data": { 
#	"name_fixed": "<value>", 
#	"name_desc" : "<value>",
#	"weight":     N,
#	"type":		"string"/"date"/"int",
#	...
#	"is_enabled": y/n
# }
#
# or for fieldgroup:
#
# "data": {
#	"name_short": "<bla>",
#	"name_full" : "<bla>",
#	"weight": N
# }
#
#

function service_create_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $res = array('error' => 'missing object or type or data');
  if (isset($params['object']) && !empty($params['object']) && isset($params['type']) && !empty($params['type']) && isset($params['data'])) {
	switch ($params['object']) {
		case 'fields':
			switch ($params['type']) {
				case 'members':
					return json_encode(create_members_fields($params['data']));
					break;
				case 'institutions':
	 	 			return json_encode(create_institutions_fields($params['data']));
					break;
				default:
					return json_encode(array('error' => 'unknown type: '.$params['type']));
					break;
			}
			break;
		case 'fieldgroups':
			switch ($params['type']) {
				case 'members':
					return json_encode(create_members_fields_groups($params['data']));
					break;
				case 'institutions':
					return json_encode(create_institutions_fields_groups($params['data']));
					break;
				default:
					return json_encode(array('error' => 'unknown type: '.$params['type'] ));
					break;
			}
		default:
			return json_encode(array('error' => 'unknown object: '.$params['object']));
			break;
	}
  }
  return json_encode($res);
}

function create_institutions_fields($data) {
	$cnf =& ServiceConfig::Instance();
  	$db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$query = 'INSERT INTO `'.$db_name.'`.`institutions_fields` (`name_fixed`,`name_desc`,`weight`,`type`,`options`,`size_min`,`size_max`,`hint_short`,`hint_full`,`group`, `is_required`, `is_enabled`, `privacy`)'
		.' VALUES ("'.$db->Escape($data['name_fixed']).'", "'.$db->Escape($data['name_desc']).'", '.intval($data['weight'])
		.', "'.$db->Escape($data['type']).'", "'.$db->Escape($data['options']).'", '.intval($data['size_min']).', '.intval($data['size_max'])
		.', "'.$db->Escape($data['hint_short']).'", "'.$db->Escape($data['hint_full']).'", '.intval($data['group']).', "'.$db->Escape($data['is_required']).'", '
		.' "'.$db->Escape($data['is_enabled']).'", "'.$db->Escape($data['privacy']).'")';
	$db->Query($query);
	return true;
}

function create_members_fields($data) {
	$cnf =& ServiceConfig::Instance();
  	$db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$query = 'INSERT INTO `'.$db_name.'`.`members_fields` (`name_fixed`,`name_desc`,`weight`,`type`,`options`,`size_min`,`size_max`,`hint_short`,`hint_full`,`group`, `is_required`, `is_enabled`, `privacy`)'
		.' VALUES ("'.$db->Escape($data['name_fixed']).'", "'.$db->Escape($data['name_desc']).'", '.intval($data['weight'])
		.', "'.$db->Escape($data['type']).'", "'.$db->Escape($data['options']).'", '.intval($data['size_min']).', '.intval($data['size_max'])
		.', "'.$db->Escape($data['hint_short']).'", "'.$db->Escape($data['hint_full']).'", '.intval($data['group']).', "'.$db->Escape($data['is_required']).'", '
		.' "'.$db->Escape($data['is_enabled']).'", "'.$db->Escape($data['privacy']).'")';
	$db->Query($query);
	return true;
}

function create_institutions_fields_groups($data) {
	$cnf =& ServiceConfig::Instance();
  	$db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$query = 'INSERT INTO `'.$db_name.'`.`institutions_fields_groups` (`name_short`, `name_full`, `weight`,`is_enabled`) VALUES ("'
		.$db->Escape($data['name_short']).'", "'.$db->Escape($data['name_full']).'", '.intval($data['weight']).', "'.$db->Escape($data['is_enabled']).'")';
	$db->Query($query);
	return true;
}

function create_members_fields_groups($data) {
	$cnf =& ServiceConfig::Instance();
  	$db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
	$query = 'INSERT INTO `'.$db_name.'`.`members_fields_groups` (`name_short`, `name_full`, `weight`, `is_enabled`) VALUES ("'
		.$db->Escape($data['name_short']).'", "'.$db->Escape($data['name_full']).'", '.intval($data['weight']).', "'.$db->Escape($data['is_enabled']).'")';
	$db->Query($query);
	return true;
}
