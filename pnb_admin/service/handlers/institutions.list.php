<?php

#
# Get institutions list
#
# /institutions/list
#
# /institutions/list/status:[all,active,onhold,inactive]
#

function institutions_list_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $status = '';
  if (isset($params['status']) && !empty($params['status'])) {
	$params['status'] = strtolower($params['status']);
	switch($params['status']) {
		case 'all':
			$status = '';
			break;
		case 'active':
			$status = 'WHERE `status` = "active"';
			break;
		case 'onhold':
			$status = 'WHERE `status` = "onhold"';
			break;
		case 'inactive':
			$status = 'WHERE `status` = "inactive"';
			break;
		default:
			$status = '';
			break;
	}
  }

  $query = 'SELECT * FROM `'.$db_name.'`.`institutions` '.$status;
  $inst = $db->Query($query);
  $institutions = array();
  foreach($inst as $k => $v) {
	$institutions[$v['id']]['status'] = $v['status'];
	$institutions[$v['id']]['status_change_date'] = $v['status_change_date'];
	$institutions[$v['id']]['status_change_reason'] = $v['status_change_reason'];
	$institutions[$v['id']]['last_update'] = $v['last_update'];
	$institutions[$v['id']]['join_date'] = $v['join_date'];
	foreach(array('string', 'int', 'date') as $k2 => $v2) {
		$query = 'SELECT * FROM `'.$db_name.'`.`institutions_data_'.$v2.'s` WHERE `institutions_id` = '.intval($v['id']);
		$fields = $db->Query($query);
		foreach($fields as $k3 => $v3) {
			$institutions[$v['id']]['fields'][$v3['institutions_fields_id']] = $v3['value'];
		}
  	}
  }

  return json_encode($institutions);
}
