<?php

# 
# Update institution details
#
# /institutions/update
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

function institutions_update_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $data = $params['data'];
  if ( !isset($params['data']) || !is_array($data) ) { return json_encode(false); }

  $fields = get_institutions_fields(); // array ( <id1> : {field_descriptor1}, <id2> : {field_descriptor2} );

  foreach($data as $institution_id => $v) { // iterate over institution ids
	if (!is_array($v) || empty($v)) { continue; }
	foreach($v as $field_id => $field_value) {
        $history_field = '';
        $history_to_value = '';
        $history_from_value = '';
		switch ( $fields[$field_id]['type'] ) {
			case 'string':
                $history_field = 'string';
                $history_to_value = '"'.$db->Escape($field_value).'"';
                $query = 'SELECT `value` FROM `'.$db_name.'`.`institutions_data_'.$history_field.'s` WHERE `institutions_id` = '.intval($institution_id).' AND `institutions_fields_id` = '.intval($field_id).' LIMIT 1';
                $result = $db->Query($query);
                $history_from_value = '"'.$db->Escape($result['value'][0]).'"';
                if (!empty($result)) {
                    $history_from_value = '"'.$db->Escape($result['value'][0]).'"';
                } else {
                    $history_from_value = '""';
                }

				$query = 'INSERT INTO `'.$db_name.'`.`institutions_data_strings` (`institutions_id`, `institutions_fields_id`, `value`) VALUES ('.intval($institution_id).', '.intval($field_id).', "'.$db->Escape($field_value).'") ON DUPLICATE KEY UPDATE `value` = "'.$db->Escape($field_value).'"';
				$db->Query($query);
				break;

			case 'date':
                $history_field = 'date';
                $history_to_value = '"'.$db->Escape($field_value).'"';
                $query = 'SELECT `value` FROM `'.$db_name.'`.`institutions_data_'.$history_field.'s` WHERE `institutions_id` = '.intval($institution_id).' AND `institutions_fields_id` = '.intval($field_id).' LIMIT 1';
                $result = $db->Query($query);
                if (!empty($result)) {
                    $history_from_value = '"'.$db->Escape($result['value'][0]).'"';
                } else {
                    $history_from_value = '"0000-00-00 00:00:00"';
                }

				$query = 'INSERT INTO `'.$db_name.'`.`institutions_data_dates` (`institutions_id`, `institutions_fields_id`, `value`) VALUES ('.intval($institution_id).', '.intval($field_id).', "'.$db->Escape($field_value).'") ON DUPLICATE KEY UPDATE `value` = "'.$db->Escape($field_value).'"';
				file_put_contents('/tmp/phonebook'.md5($query).'.txt', print_r($query, true));
				$db->Query($query);

				break;

			case 'int':
                $history_field = 'int';
                $history_to_value = intval($field_value);
                $query = 'SELECT `value` FROM `'.$db_name.'`.`institutions_data_'.$history_field.'s` WHERE `institutions_id` = '.intval($institution_id).' AND `institutions_fields_id` = '.intval($field_id).' LIMIT 1';
                $result = $db->Query($query);
                $history_from_value = intval($result['value'][0]);
                if (!empty($result)) {
                    $history_from_value = intval($result['value'][0]);
                } else {
                    $history_from_value = 0;
                }

				$query = 'INSERT INTO `'.$db_name.'`.`institutions_data_ints` (`institutions_id`, `institutions_fields_id`, `value`) VALUES ('.intval($institution_id).', '.intval($field_id).', '.intval($field_value).') ON DUPLICATE KEY UPDATE `value` = '.intval($field_value);
				$db->Query($query);
				break;
			default:
				break;
		}
        // history support:
        $query = 'INSERT INTO `'.$db_name.'`.`institutions_history` (`institutions_id`, `institutions_fields_id`, date, `value_from_'.$history_field.'`, `value_to_'.$history_field.'`) 
            VALUES ('.intval($institution_id).', '.intval($field_id).', NOW(), '.$history_from_value.', '.$history_to_value.')';
        $db->Query($query);
	}
  }

  return json_encode(true);
}
