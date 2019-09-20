<?php

#
# Get members list, timestamped to reproduce collaboration at time X:
#
# /members/list/ts:[unixtime] = mandatory parameter/constraint
# /members/list/institution:[ID]
# /members/list/details:[name,compact,full]
#
# FULL EXAMPLE:
# /members/list/institution:[ID]/details:[name,compact,full]/ts;[unixtime]
#
# TS-based OPERATIONS workflow:
#
# 1. fetch complete list of "current" members and their fields, no matter of status and join/leave date
#    - for all institutions
#    - constrained to specific institution
# 2. scan member list for join-leave pairs, keep only members falling into [join-date, TS] range
# 3. get current values for all fields for these members = initial snapshot
# 4. fetch complete list of history entries ordered by change time ASC, with dates up to requested TS.
#    - for all institutions
#    - constrained to specific institution
# 5. scan member list, and apply changes to field values
# 6. apply "details" filter if present, removing unwanted fields
# 7. return updated member list with field changes
#

function members_listts_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $ts = intval($params['ts']);
  if ( !isset($ts) || ($ts <= 0) ) { return; } // ERROR, no timestamp

  // 1. select all members no matter their status;

  // 1.1 select member headers:
  $query = 'SELECT * FROM `'.$db_name.'`.`members` WHERE 1';
  $mem = $db->Query($query);

  $members = array();
  foreach($mem as $k => $v) {
    $members[$v['id']]['status'] = $v['status'];
    $members[$v['id']]['status_change_date'] = $v['status_change_date'];
    $members[$v['id']]['status_change_reason'] = $v['status_change_reason'];
    $members[$v['id']]['last_update'] = $v['last_update'];
    $members[$v['id']]['join_date'] = $v['join_date'];
  }

  // 1.2 select member field names
  $query = 'SELECT * FROM `'.$db_name.'`.`members_fields` WHERE 1';
  $mem_fld = $db->Query($query);
  $mfldn = array();
  $mfldi = array();
  foreach($mem_fld as $k => $v) {
    $mfldn[ $v['id'] ] = $v['name_fixed']; // field name lookup by id
    $mfldi[ $v['name_fixed'] ] = $v['id']; // field id lookup by name
  }
  unset($mem_fld);

  // 1.3 select member data:
  $query = 'SELECT *, UNIX_TIMESTAMP(`value`) as uts FROM `'.$db_name.'`.`members_data_dates` WHERE 1';
  $mem_dat = $db->Query($query);
  foreach($mem_dat as $k => $v) {
    $members[ $v['members_id'] ]['fields'][ $v['members_fields_id'] ] = $v['uts'];
  }
  unset($mem_dat);

  $query = 'SELECT * FROM `'.$db_name.'`.`members_data_ints` WHERE 1';
  $mem_int = $db->Query($query);
  foreach($mem_int as $k => $v) {
    $members[ $v['members_id'] ]['fields'][ $v['members_fields_id'] ] = intval($v['value']);
  }
  unset($mem_int);

  $query = 'SELECT * FROM `'.$db_name.'`.`members_data_strings` WHERE 1';
  $mem_str = $db->Query($query);
  foreach($mem_str as $k => $v) {
    $members[ $v['members_id'] ]['fields'][ $v['members_fields_id'] ] = $v['value'];
  }
  unset($mem_str);

  // 2. select historical records based on ts

  $query = 'SELECT *, UNIX_TIMESTAMP(`value_to_date`) AS uvtd FROM `'.$db_name.'`.`members_history` WHERE UNIX_TIMESTAMP(`date`) <= '.$ts.' ORDER BY `date` ASC';
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
    $members[ $v['members_id'] ]['fields'][ $v['members_fields_id'] ] = $val;
  }

  // remove members who left by $ts:
  foreach($members as $k => $v) {
    if ( isset($v['fields'][ $mfldi['date_leave'] ])
	&& ( $ts >= ($v['fields'][ $mfldi['date_leave'] ] + 6*30*24*60*60) ) ) { // +6 months after leave
	unset($members[$k]);
    }
  }

  // 3. filter out by institution, if presents
  if (isset($params['institution']) && !empty($params['institution'])) {
	$institution_id = intval($params['institution']);
	foreach($members as $k => $v) {
	    if ( $v['fields'][ $mfldi['institution_id'] ] != $institution_id ) { unset($members[$k]); }
	}
  }
  
  // 4. filter out by details level, if presents:
  $details = 'name';
  if (isset($params['details']) && !empty($params['details'])) {
	$details = trim($params['details']);
  }

  $flt_name = array( $mfldi['institution_id'], $mfldi['name_first'],
    $mfldi['name_initials'], $mfldi['name_last'], $mfldi['name_unicode'], $mfldi['name_latex'] );

  $flt_compact = array( $mfldi['institution_id'], $mfldi['name_first'], $mfldi['name_initials'], $mfldi['name_last'], $mfldi['name_unicode'],
			$mfldi['name_latex'], $mfldi['email'], $mfldi['phone_work'], $mfldi['phone_cell'], $mfldi['url'],
			$mfldi['is_author'],$mfldi['is_expert'],$mfldi['is_shifter'] );

  if ($details == 'name' || $details == 'compact' ) {
    foreach($members as $k => $v) {
	foreach($v['fields'] as $k2 => $v2) {
	    switch ($details) {
		case 'name':
		    if ( !in_array( $k2, $flt_name ) ) {
			unset($members[$k]['fields'][$k2]);
		    }
		    break;
		case 'compact':
		    if ( !in_array( $k2, $flt_compact ) ) {
			unset($members[$k]['fields'][$k2]);
		    }
		    break;
		default:
	    }
	}
    }
  }

  return json_encode($members);
}
