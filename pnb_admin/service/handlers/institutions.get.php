<?php

# 
# Get institution details
#
# /institutions/get/id:[N]
#

function institutions_get_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $id = intval($params['id']);

  $query = 'SELECT * FROM `'.$db_name.'`.`institutions` WHERE `id` = '.$id.' LIMIT 1';
  $inst = $db->Query($query);
  if (!empty($inst)) {
  	$inst = $inst[0];
  }

  $query = 'SELECT * FROM `'.$db_name.'`.`institutions_fields`';
  $fields_res = $db->Query($query);
  $fields = array();
  foreach($fields_res as $k => $v) {
	$fields[$v['id']] = $v;
  }

  $inst_fields = array();
  foreach(array('string','int','date') as $k => $v) {
  	$query = 'SELECT institutions_fields_id as field_id, value as field_value FROM `'.$db_name.'`.`institutions_data_'.$v.'s` WHERE institutions_id = '.$id;
	$res = $db->Query($query);
	if (empty($res)) continue;
	foreach($res as $k2 => $v2) {
		if ($v == 'int') { $v2['field_value'] = intval($v2['field_value']); }
		$inst_fields[$v2['field_id']] = $v2['field_value'];
	}
  }

  return json_encode(array('institution' => $inst, 'fields' => $inst_fields));
}
