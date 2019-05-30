<?php

# Get active members count per institution:
# /members/count

function members_count_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $status_query = '`status` = "active"';

  $query = 'SELECT * FROM `'.$db_name.'`.`institutions` WHERE '.$status_query;
  $inst = $db->Query($query);
  $institutions = array();
  foreach($inst as $k => $v) {
	$institutions[$v['id']] = true;
  }

  $query = 'SELECT * FROM `'.$db_name.'`.`members` WHERE '.$status_query;
  $mem = $db->Query($query);

  $members = array();

  foreach($mem as $k => $v) {
	$members[$v['id']] = true;
  }

  $query = 'SELECT * FROM `'.$db_name.'`.`members_data_dates` where `members_fields_id` = 85';
  $res = $db->Query($query);
  $time = time();
  $cnt = 0;
  foreach($res as $k => $v) {
	if ($v['members_fields_id'] == 85) {
	  if ( !empty($v['value']) && $v['value'] != '0000-00-00 00:00:00' && $time > strtotime($v['value']) ) {
		unset( $members[$v['members_id']] );
	  }
	}
  }

  $query = 'SELECT * FROM `'.$db_name.'`.`members_data_ints` where `members_fields_id` = 17';
  $res = $db->Query($query);

  $memlist = array();

  $count = array();
  foreach($res as $k => $v) {
	if ($members[ $v['members_id'] ] != true) { continue; }
	if ($institutions[ $v['value'] ] != true) { continue; }
	if (empty($count[$v['value']])) { $count[$v['value']] = 0; }
	$count[$v['value']] += 1;
	$memlist[$v['members_id']] = $v['members_id'];
  }

  $max = 0;
  $min = 99999;
  foreach($count as $k => $v) {
	if ($v > $max) { $max = $v; };
	if ($v < $min) { $min = $v; };
  }

  return json_encode( array( 'data' => $count, 'max' => $max, 'min' => $min ) );
}
