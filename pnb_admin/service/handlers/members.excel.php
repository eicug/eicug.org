<?php

# 
# Export current member list in MS Excel format. 
#
# fields, sort - required options
#
# /members/excel/fields:[1,2,3..N]/sort:[F1,F2]
#
# Institutions: active, members: all
# sort: field ids to sort: F1 first, F2 second
#

function cmp($a, $b)
{
	$r = strcasecmp($a[0], $b[0]);
	if ($r == 0) {
		$r = strcasecmp($a[2], $b[2]);
	}
    return $r;
}

function members_excel_handler($params) {

  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  if (empty($params['fields']) || empty($params['sort'])) { return json_encode(false); }

  $req_fields = explode(',', $params['fields']);
  $req_ifields = !empty($params['ifields']) ? explode(',', $params['ifields']) : array();

  $sort = explode(',', $params['sort']);

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
  foreach($req_fields as $k => $v) {
	$header[] = strtoupper($fields[$v]['name_desc']);
  }
  foreach($req_ifields as $k => $v) {
	$header[] = strtoupper($ifields[$v]['name_desc']);
  }
  $header = array($header);

  foreach($mem as $k => $m) {
	$data = array();
	foreach($req_fields as $k2 => $fld) {
		$val = '';
		if (isset($mem_fields[$m['id']][$fld])) {
			$val = $mem_fields[$m['id']][$fld];
		}
		if ($fields[$fld]['name_fixed'] == 'date_joined' && empty($val)) { 
			$val = $m['join_date'];
		} else if ($fields[$fld]['name_fixed'] == 'date_leave') {

		} else if ($fields[$fld]['name_fixed'] == 'institution_id') {
			$val = $inst_fields[$val][1];
		}
		$data[$fld] = $val;
	}
	if ( !empty($req_ifields) ) {
		foreach( $req_ifields as $k2 => $fld ) {
			$val = '';
			if ( isset( $inst_fields[ $mem_fields[$m['id']][17] ][$fld] ) ) {
				if ( !empty( $ifields[ $fld ]['options'] ) ) {
					$optstmp = explode(',', $ifields[ $fld ]['options'] );
					$opts = array();
					foreach($optstmp as $ok => $ov ) {
						$tmp = explode(':', $ov);
						$opts[$tmp[0]] = trim($tmp[1]);
					}
					$val = $opts[ $inst_fields[ $mem_fields[$m['id']][17] ][$fld] ];
				} else {
					$val = $inst_fields[ $mem_fields[$m['id']][17] ][$fld];
				}
			}
			$data[1000+$fld] = $val;
		}
	}
	$out[] = $data;
  }

  //if (!empty($sort[0]) && in_array($sort[0], $req_fields)) {
	$test = array();
	$test[0] = substr($sort[0], -1) === 'i' ? (intval($sort[0])+1000) : intval($sort[0]);
	$test[1] = substr($sort[1], -1) === 'i' ? (intval($sort[1])+1000) : intval($sort[1]);
	$test[2] = substr($sort[2], -1) === 'i' ? (intval($sort[2])+1000) : intval($sort[2]);
	$test[3] = substr($sort[3], -1) === 'i' ? (intval($sort[3])+1000) : intval($sort[3]);

	$sort = array();
	foreach($out as $k => $v) {
    	$sort[$test[0]][$k] = $v[$test[0]];
    	$sort[$test[1]][$k] = $v[$test[1]];
    	$sort[$test[2]][$k] = $v[$test[2]];
    	$sort[$test[3]][$k] = $v[$test[3]];
	}
	array_multisort( $sort[$test[0]], SORT_ASC, $sort[$test[1]], SORT_ASC,
		$sort[$test[2]], SORT_ASC, $sort[$test[3]], SORT_ASC,
		$out );
  //}

  $out = array_merge($header, $out);

	$xls = new Excel_XML('UTF-8', false, 'EICUG Collaboration members');
	$xls->addArray($out);
	$xls->generateXML('eicug-'.date('Y-m-d').'-'.time(0));

//  echo print_r($out, true);
}
