<?php

# get statistics per institution
# /service/stat
# - n members
# - n shifters
# - n authors
# - n experts
# - n emeritus
# - n juniors
#
# {
#	<inst_id_1> : { 'name': <inst_name>, 'members': <N>, 'shifters': <N>, 'authors': <N>, 'experts': <N>, 'emeritus': <N>, 'juniors': <N> },
#	<inst_id_2> : { 'name': <inst_name>, 'members': <N>, 'shifters': <N>, 'authors': <N>, 'experts': <N>, 'emeritus': <N>, 'juniors': <N> },
#	...
# }

function service_stat_handler($params) {
  $result = array();

  // list active institutions / full
  // list active members / compact
  // convert

  include_once('institutions.list.php');
  include_once('members.list.php');

  $inst = json_decode( institutions_list_handler( array('status' => 'active') ), true );
  $mem  = json_decode( members_list_handler( array('status' => 'active', 'details' => 'compact') ), true );

  foreach( $inst as $k => $v ) {
	$result[$k] = array( 'name' => $v['fields'][1] , 'members' => 0, 'shifters' => 0, 'authors' => 0,
	  'experts' => 0, 'emeritus' => 0, 'juniors' => 0 );
	if ( !empty($v['fields'][45]) ) { $result[$k]['assoc_id'] = $v['fields'][45]; }
  }

  foreach( $mem as $k => $v ) { // inst_id: 17, is_shifter: 42, is_author: 40, is_expert: 43, is_emeritus: 44, is_junior: 41
	if ( empty( $v['fields'][17] ) ) { continue; } // skip non-institution members
	$inst_id = $v['fields'][17];
	if ( empty( $result[$inst_id] ) ) { continue; } // active member from inactive institution
	$result[$inst_id]['members'] += 1;
	if ( $v['fields'][42] == 'y' ) { $result[$inst_id]['shifters'] += 1; }
	if ( $v['fields'][40] == 'y' && ( empty($v['fields'][85]) || $v['fields'][85] == '0000-00-00 00:00:00' ) ) { $result[$inst_id]['authors'] += 1; }
	if ( $v['fields'][43] == 'y' ) { $result[$inst_id]['experts'] += 1; }
	if ( $v['fields'][44] == 'y' ) { $result[$inst_id]['emeritus'] += 1; }
	if ( $v['fields'][41] == 'y' ) { $result[$inst_id]['junior'] += 1; }
  }

  return json_encode( $result );
}
