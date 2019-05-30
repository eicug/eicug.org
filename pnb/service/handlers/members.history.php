<?php

# 
# Get members history for member <id>
#
# /members/history/id:[N]
#
#

function members_history_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');
  $id = intval($params['id']);
  $query = 'SELECT * FROM `'.$db_name.'`.`members_history` WHERE `members_id` = '.$id.' ORDER BY `date` DESC';
  $history = $db->Query($query);
  return json_encode($history);
}
