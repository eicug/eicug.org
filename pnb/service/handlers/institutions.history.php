<?php

# 
# Get institutions history for institution <id>
#
# /institutions/history/id:[N]
#
#

function institutions_history_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $db =& ServiceDb::Instance('phonebook_api');
  $db_name = $cnf->Get('phonebook_api','database');

  $id = intval($params['id']);
  $query = 'SELECT * FROM `'.$db_name.'`.`institutions_history` WHERE `institutions_id` = '.$id.' ORDER BY `date` DESC';
  $history = $db->Query($query);
  return json_encode($history);
}
