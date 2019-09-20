<?php

#
# Get institutions list constrained by timestamp TS
#
# /institutions/list/ts:[TS]
#
# /institutions/list/status:[all,active,onhold,inactive]/ts:[TS]
#

function institutions_listts_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $ts = intval($params['ts']);
  if ( !isset($ts) || ($ts <= 0) ) { return; } // ERROR, no timestamp

  // 1. select all members no matter their status;

  // 1.1 select member headers:
  $query = 'SELECT * FROM `'.$db_name.'`.`institutions` WHERE 1';
  $ins = $db->Query($query);

  $institutions = array();
  foreach($ins as $k => $v) {
    $institutions[$v['id']]['status'] = $v['status'];
    $institutions[$v['id']]['status_change_date'] = $v['status_change_date'];
    $institutions[$v['id']]['status_change_reason'] = $v['status_change_reason'];
    $institutions[$v['id']]['last_update'] = $v['last_update'];
    $institutions[$v['id']]['join_date'] = $v['join_date'];
  }

  // 1.2 select institution field names
  $query = 'SELECT * FROM `'.$db_name.'`.`institutions_fields` WHERE 1';
  $ins_fld = $db->Query($query);
  $ifldn = array();
  $ifldi = array();
  foreach($ins_fld as $k => $v) {
    $ifldn[ $v['id'] ] = $v['name_fixed']; // field name lookup by id
    $ifldi[ $v['name_fixed'] ] = $v['id']; // field id lookup by name
  }
  unset($ins_fld);

  // 1.3 select institution data:
  $query = 'SELECT *, UNIX_TIMESTAMP(`value`) as uts FROM `'.$db_name.'`.`institutions_data_dates` WHERE 1';
  $ins_dat = $db->Query($query);
  foreach($ins_dat as $k => $v) {
    $institutions[ $v['institutions_id'] ]['fields'][ $v['institutions_fields_id'] ] = $v['uts'];
  }
  unset($ins_dat);

  $query = 'SELECT * FROM `'.$db_name.'`.`institutions_data_ints` WHERE 1';
  $ins_int = $db->Query($query);
  foreach($ins_int as $k => $v) {
    $institutions[ $v['institutions_id'] ]['fields'][ $v['institutions_fields_id'] ] = intval($v['value']);
  }
  unset($ins_int);

  $query = 'SELECT * FROM `'.$db_name.'`.`institutions_data_strings` WHERE 1';
  $ins_str = $db->Query($query);
  foreach($ins_str as $k => $v) {
    $institutions[ $v['institutions_id'] ]['fields'][ $v['institutions_fields_id'] ] = $v['value'];
  }
  unset($ins_str);

  // 2. select historical records based on ts

  $query = 'SELECT *, UNIX_TIMESTAMP(`value_to_date`) AS uvtd FROM `'.$db_name.'`.`institutions_history`.WHERE UNIX_TIMESTAMP(`date`) <= '.$ts.' ORDER BY `date` ASC';
  $hist = $db->Query($query);

  foreach($hist as $k => $v) {
    $val = ':::';
    if (!empty($v['value_to_string']) || strlen($v['value_to_string']) != 0 ) {
	$val = $v['value_to_string'];
    } else if ( !empty($v['value_to_int']) || strlen($v['value_to_int']) != 0 ) {
	$val = intval($v['value_to_int']);
    } else if ( !empty($v['uvtd']) || strlen($v['value_to_date']) != 0 ) {
	$val = intval($v['uvtd']);
    } else {
	continue; // ERROR: no change recorded?
    }
    $institutions[ $v['institutions_id'] ]['fields'][ $v['institutions_fields_id'] ] = $val;
  }

  // remove institutions which has left STAR by $ts:
  foreach($institutions as $k => $v) {
    if ( !empty($v['fields'][ $ifldi['date_leave'] ])
	&& ( $ts >= ( $v['fields'][ $ifldi['date_leave'] ]) ) ) {
	unset($institutions[$k]);
	//echo 'removing institution left ( '.$v['fields'][ $ifldi['date_leave'] ].' ) '.$k."\n<br>";
    } else if ( isset($v['fields'][ $ifldi['date_joined'] ]) &&
		$ts < $v['fields'][ $ifldi['date_joined'] ] ) {
	unset($institutions[$k]);
	//echo 'removing institution joined ( '.$v['fields'][ $ifldi['date_joined'] ].' ) '.$k."\n<br>";
    }
  }

  echo count($institutions);
  //print_r($institutions);

  return json_encode($institutions);
}
