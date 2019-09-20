<?php

# Get active members count per institution:
# /members/count

function members_count_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $status_query = '`status` = "active"';

  $query = 'SELECT * FROM `'.$db_name.'`.`members` WHERE '.$status_query;
  $mem = $db->Query($query);

  $count = array();
  $members = array();

  foreach($mem as $k => $v) {
	$members[$v['id']] = true;
  }

  $query = 'SELECT * FROM `'.$db_name.'`.`members_data_dates`';
  $res = $db->Query($query);
  $time = time();
  foreach($res as $k => $v) {
	if ($v['members_fields_id'] == 85) {
	  if ( $v['value'] != '0000-00-00 00:00:00' && $time > strtotime($v['value'])) {
		unset( $members[$v['members_id']] );
	  }
	}
  }

  $query = 'SELECT * FROM `'.$db_name.'`.`members_data_ints` where `members_fields_id` = 17';
  $res = $db->Query($query);
  foreach($res as $k => $v) {
	if ($members[$v['members_id']] != true) { continue; }
	if (empty($count[$v['value']])) { $count[$v['value']] = 0; }
	$count[$v['value']] += 1;
  }



  $max = 0;
  $min = 99999;
  foreach($count as $k => $v) {
	if ($v > $max) { $max = $v; };
	if ($v < $min) { $min = $v; };
  }

  return json_encode( array( 'data' => $count, 'max' => $max, 'min' => $min ) );
}
