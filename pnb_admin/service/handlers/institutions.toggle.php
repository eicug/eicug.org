<?php

# 
# Toggle institution's status: if it is active -> deactive, deactive -> active
#
# /institutions/toggle/id:[X]
#

function institutions_toggle_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $states = array('active', 'inactive', 'onhold');

  $id = intval($params['id']);

  $query = 'SELECT `status` FROM `'.$db_name.'`.`institutions` WHERE `id` = '.$id;
  $res = $db->Query($query);
  $status = strtolower($res['status'][0]);
  if (!in_array($status, $states)) {
	return json_encode(false);
  }
  $new_status = '';
  switch ($status) {
	case 'active':
		$new_status = 'inactive';
		break;
	case 'inactive':
		$new_status = 'active';
		break;
	case 'onhold':
		$new_status = 'active';
		break;
	default:
		return json_encode(false);
		break;
  }

  $query = 'UPDATE `'.$db_name.'`.`institutions` SET `status` = "'.$new_status.'", `status_change_date` = NOW(), `status_change_reason` = "administrator action", `last_update_date` = NOW() WHERE `id` = '.$id.' LIMIT 1';
  $db->Query($query);
  return json_encode(true);
}
