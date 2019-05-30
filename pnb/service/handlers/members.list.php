<?php

#
# Get members list:
#
# /members/list/status:[all,active,onhold,inactive]
#
# /members/list/institution:[ID]
#
# /members/list/details:[name,compact,full]
#
# /members/list/institution:[ID]/details:[name,compact,full]
#

function members_list_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $status_query = '`status` != "undefined"';
  if (isset($params['status']) && !empty($params['status'])) {
    $params['status'] = strtolower($params['status']);
    switch($params['status']) {
        case 'all':
            $status_query = '`status` != "undefined"';
            break;
        case 'active':
            $status_query = '`status` = "active"';
            break;
        case 'onhold':
            $status_query = '`status` = "onhold"';
            break;
        case 'inactive':
            $status_query = '`status` = "inactive"';
            break;
        default:
            $status_query = '`status` != "undefined"';
            break;
    }
  }

  if (isset($params['institution']) && !empty($params['institution'])) {
	$institution_id = intval($params['institution']);
  }

  $details = 'name';
  if (isset($params['details']) && !empty($params['details'])) {
	$details = trim($params['details']);
  }

  $query = 'SELECT * FROM `'.$db_name.'`.`members` WHERE '.$status_query;
  $mem = $db->Query($query);

  $members = array();
  foreach($mem as $k => $v) {
    $members[$v['id']]['status'] = $v['status'];
    $members[$v['id']]['status_change_date'] = $v['status_change_date'];
    $members[$v['id']]['status_change_reason'] = $v['status_change_reason'];
    $members[$v['id']]['last_update'] = $v['last_update'];
    $members[$v['id']]['join_date'] = $v['join_date'];
  }

  $query = 'SELECT * FROM `'.$db_name.'`.`members_fields`';
  $fields_res = $db->Query($query);
  $fields = array();
  $fields_fn = array();
  $inst_field_id = 0;
  foreach($fields_res as $k => $v) {
	$fields[$v['id']] = $v;
	$fields_fn[$v['name_fixed']] = $v;
	if ($v['name_fixed'] == 'institution_id') { $inst_field_id = intval($v['id']); }
  }

  $members_fields = array();
  foreach(array('string','int','date') as $k => $v) {
  	$query = 'SELECT * FROM `'.$db_name.'`.`members_data_'.$v.'s`';
	$res = $db->Query($query);
	if (empty($res)) continue;
	foreach($res as $k2 => $v2) {
        if ($v == 'int') { $v2['value'] = intval($v2['value']); }
        $members_fields[$v2['members_id']][$v2['members_fields_id']] = $v2['value'];
	}
  }
  
  foreach($members_fields as $k => $v) {
	if (!isset($members[$k])) { continue; }
	if ($institution_id != 0 && $v[$inst_field_id] != $institution_id) { 
		unset($members[$k]);
		continue;
	}
	switch ($details) {
		case 'name':
			$members[$k]['fields'][$fields_fn['institution_id']['id']] = $v[$fields_fn['institution_id']['id']];
			$members[$k]['fields'][$fields_fn['name_first']['id']] = $v[$fields_fn['name_first']['id']];
			$members[$k]['fields'][$fields_fn['name_initials']['id']] = $v[$fields_fn['name_initials']['id']];
			$members[$k]['fields'][$fields_fn['name_last']['id']] = $v[$fields_fn['name_last']['id']];
			$members[$k]['fields'][$fields_fn['name_unicode']['id']] = $v[$fields_fn['name_unicode']['id']];
			$members[$k]['fields'][$fields_fn['name_latex']['id']] = $v[$fields_fn['name_latex']['id']];
			break;
		case 'compact':
			$members[$k]['fields'][$fields_fn['institution_id']['id']] = $v[$fields_fn['institution_id']['id']];
			$members[$k]['fields'][$fields_fn['name_first']['id']] = $v[$fields_fn['name_first']['id']];
			$members[$k]['fields'][$fields_fn['name_initials']['id']] = $v[$fields_fn['name_initials']['id']];
			$members[$k]['fields'][$fields_fn['name_last']['id']] = $v[$fields_fn['name_last']['id']];
			$members[$k]['fields'][$fields_fn['name_unicode']['id']] = $v[$fields_fn['name_unicode']['id']];
			$members[$k]['fields'][$fields_fn['name_latex']['id']] = $v[$fields_fn['name_latex']['id']];
			$members[$k]['fields'][$fields_fn['email']['id']] = $v[$fields_fn['email']['id']];
			$members[$k]['fields'][$fields_fn['phone_work']['id']] = $v[$fields_fn['phone_work']['id']];
			$members[$k]['fields'][$fields_fn['phone_cell']['id']] = $v[$fields_fn['phone_cell']['id']];
			$members[$k]['fields'][$fields_fn['url']['id']] = $v[$fields_fn['url']['id']];
			$members[$k]['fields'][$fields_fn['is_author']['id']] = $v[$fields_fn['is_author']['id']];
			$members[$k]['fields'][$fields_fn['is_expert']['id']] = $v[$fields_fn['is_expert']['id']];
			$members[$k]['fields'][$fields_fn['is_shifter']['id']] = $v[$fields_fn['is_shifter']['id']];
			$members[$k]['fields'][$fields_fn['is_emeritus']['id']] = $v[$fields_fn['is_emeritus']['id']];
			$members[$k]['fields'][$fields_fn['expertise']['id']] = $v[$fields_fn['expertise']['id']];
			$members[$k]['fields'][$fields_fn['date_leave']['id']] = $v[$fields_fn['date_leave']['id']];
			break;
		case 'full':
			$members[$k]['fields'] = $v;
			break;
	}
  }
  return json_encode($members);
}
