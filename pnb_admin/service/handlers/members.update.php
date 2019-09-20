<?php

# 
# Update member details
#
# /members/update
#
# JSON body: 
# "data": {
#	"<id>" : {
#				<field_id_1> : <new_value>,
#				...
#				<field_id_N> : <new_value>
#			},
#	"<id_N>" : { <same as above> }
# }

function members_update_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $data = $params['data'];
  if ( !isset($params['data']) || !is_array($data) ) { return json_encode(false); }

  $fields = get_members_fields(); // array ( <id1> : {field_descriptor1}, <id2> : {field_descriptor2} );

  foreach($data as $member_id => $v) { // iterate over user ids
	if (!is_array($v) || empty($v)) { continue; }
	foreach($v as $field_id => $field_value) {
		$history_field = '';
		$history_to_value = '';
		$history_from_value = '';
		switch ( $fields[$field_id]['type'] ) {
			case 'string':
				$history_field = 'string';
				$history_to_value = '"'.$db->Escape($field_value).'"';
				$query = 'SELECT `value` FROM `'.$db_name.'`.`members_data_'.$history_field.'s` WHERE `members_id` = '.intval($member_id).' AND `members_fields_id` = '.intval($field_id).' LIMIT 1';
				$result = $db->Query($query);
				$history_from_value = '"'.$db->Escape($result['value'][0]).'"';
				if (!empty($result)) {
					$history_from_value = '"'.$db->Escape($result['value'][0]).'"';
				} else {
					$history_from_value = '""';
				}
				$query = 'INSERT INTO `'.$db_name.'`.`members_data_strings` (`members_id`, `members_fields_id`, `value`) VALUES ('.intval($member_id).', '.intval($field_id).', "'.$db->Escape($field_value).'") ON DUPLICATE KEY UPDATE `value` = "'.$db->Escape($field_value).'"';
				$db->Query($query);
				break;

			case 'date':
				$history_field = 'date';
				$history_to_value = '"'.$db->Escape($field_value).'"';
				$query = 'SELECT `value` FROM `'.$db_name.'`.`members_data_'.$history_field.'s` WHERE `members_id` = '.intval($member_id).' AND `members_fields_id` = '.intval($field_id).' LIMIT 1';
				$result = $db->Query($query);
				if (!empty($result)) {
					$history_from_value = '"'.$db->Escape($result['value'][0]).'"';
				} else {
					$history_from_value = '"0000-00-00 00:00:00"';
				}
				$query = 'INSERT INTO `'.$db_name.'`.`members_data_dates` (`members_id`, `members_fields_id`, `value`) VALUES ('.intval($member_id).', '.intval($field_id).', "'.$db->Escape($field_value).'") ON DUPLICATE KEY UPDATE `value` = "'.$db->Escape($field_value).'"';
				$db->Query($query);
				break;

			case 'int':
				$history_field = 'int';
				$history_to_value = intval($field_value);
				$query = 'SELECT `value` FROM `'.$db_name.'`.`members_data_'.$history_field.'s` WHERE `members_id` = '.intval($member_id).' AND `members_fields_id` = '.intval($field_id).' LIMIT 1';
				$result = $db->Query($query);
				$history_from_value = intval($result['value'][0]);
				if (!empty($result)) {
					$history_from_value = intval($result['value'][0]);
				} else {
					$history_from_value = 0;
				}
				$query = 'INSERT INTO `'.$db_name.'`.`members_data_ints` (`members_id`, `members_fields_id`, `value`) VALUES ('.intval($member_id).', '.intval($field_id).', '.intval($field_value).') ON DUPLICATE KEY UPDATE `value` = '.intval($field_value);
				$db->Query($query);
				break;

			default:
				break;
		}
		// history support:
		$query = 'INSERT INTO `'.$db_name.'`.`members_history` (`members_id`, `members_fields_id`, date, `value_from_'.$history_field.'`, `value_to_'.$history_field.'`) 
			VALUES ('.intval($member_id).', '.intval($field_id).', NOW(), '.$history_from_value.', '.$history_to_value.')';
		$db->Query($query);
	}
  }

  return json_encode(true);
}
