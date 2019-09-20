<?php

# 
# Export current board member list in MS Excel format
#
# /members/excel_board/
#

function cmp($a, $b)
{
	$r = strcasecmp($a[0], $b[0]);
	if ($r == 0) {
		$r = strcasecmp($a[2], $b[2]);
	}
    return $r;
}

function members_excel_board_handler($params) {

  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $fields = get_members_fields();
  $ifields = get_institutions_fields();

  $query = 'SELECT * FROM `'.$db_name.'`.`institutions` WHERE `status` = "active"';
  $inst = $db->Query($query);

  $query = 'SELECT * FROM `'.$db_name.'`.`members` WHERE `status` = "active"';
  $mem = $db->Query($query);

  $inst_fields = array();
  foreach(array('string','int','date') as $k => $v) {
    $query = 'SELECT * FROM `'.$db_name.'`.`institutions_data_'.$v.'s`';
    $res = $db->Query($query);
    if (empty($res)) continue;
    foreach($res as $k2 => $v2) {
        if ($v == 'int') { $v2['value'] = intval($v2['value']); }
        $inst_fields[$v2['institutions_id']][$v2['institutions_fields_id']] = $v2['value'];
    }
  }

  $mem_fields = array();
  foreach(array('string','int','date') as $k => $v) {
    $query = 'SELECT * FROM `'.$db_name.'`.`members_data_'.$v.'s`';
    $res = $db->Query($query);
    if (empty($res)) continue;
    foreach($res as $k2 => $v2) {
        if ($v == 'int') { $v2['value'] = intval($v2['value']); }
        $mem_fields[$v2['members_id']][$v2['members_fields_id']] = $v2['value'];
    }
  }

  $out = array();
  $header = array();

  // export board members: First Name Last Name, email, institution

	$board_members = array();
	foreach($inst as $k => $v) {
		if ( $v['status'] !== 'active' ) { continue; }
		$ifield = $inst_fields[ $v['id'] ];
		if ( $ifield[42] && time(0) > strtotime( $ifield[42] ) ) { continue; }
		if ( !empty($ifield[9]) && $mem_fields[ $ifield[9] ] ) {
			if ( empty( $mem_fields[ $ifield[9] ][85] ) || $mem_fields[ $ifield[9] ][85] == '0000-00-00 00:00:00' ||
				 $mem_fields[ $ifield[9] ][85] == '0000-00-00' ) {
				$board_members[ $ifield[9] ] = $mem_fields[ $ifield[9] ];
			}
		}
		if ( !empty($ifield[46]) && $mem_fields[ $ifield[46] ] ) {
			if ( empty( $mem_fields[ $ifield[46] ][85] ) || $mem_fields[ $ifield[46] ][85] == '0000-00-00 00:00:00' ||
				 $mem_fields[ $ifield[46] ][85] == '0000-00-00' ) {
				$board_members[ $ifield[46] ] = $mem_fields[ $ifield[9] ];
			}
		}
		if ( !empty($ifield[47]) && $mem_fields[ $ifield[47] ] ) {
			if ( empty( $mem_fields[ $ifield[47] ][85] ) || $mem_fields[ $ifield[47] ][85] == '0000-00-00 00:00:00' ||
				 $mem_fields[ $ifield[47] ][85] == '0000-00-00' ) {
				$board_members[ $ifield[47] ] = $mem_fields[ $ifield[9] ];
			}
		}
		if ( !empty($ifield[48]) && $mem_fields[ $ifield[48] ] ) {
			if ( empty( $mem_fields[ $ifield[48] ][85] ) || $mem_fields[ $ifield[48] ][85] == '0000-00-00 00:00:00' ||
				 $mem_fields[ $ifield[48] ][85] == '0000-00-00' ) {
				$board_members[ $ifield[48] ] = $mem_fields[ $ifield[9] ];
			}
		}
	}

	$header = array();
	$header[] = strtoupper($fields[1]['name_desc']).' '.strtoupper($fields[3]['name_desc']);
	$header[] = strtoupper($fields[20]['name_desc']);
	$header[] = 'INSTITUTION';
	$header = array($header);

	$out = array();
	foreach($board_members as $k => $v) {
		$data = array( $v[1] .' '. $v[3], $v[20], $inst_fields[ $v[17] ][1] );
		$out[] = $data;
	}


  $out = array_merge($header, $out);

	$xls = new Excel_XML('UTF-8', false, 'EICUG institutional board members');
	$xls->addArray($out);
	$xls->generateXML('eicug-board-'.date('Y-m-d').'-'.time(0));

}
