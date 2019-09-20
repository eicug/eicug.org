<?php

#
# Get fields list
#
# /service/list/object:fields/type:[institutions,members]
#
# or group list
#
# /service/list/object:fieldgroups/type:[institutions,members]
#

function service_list_handler($params) {
  $cnf =& ServiceConfig::Instance();
  $res = array();

  if (isset($params['object']) && !empty($params['object']) && isset($params['type']) && !empty($params['type'])) {
	switch ($params['object']) {
		case 'fields':
			switch ($params['type']) {
				case 'members':
					return json_encode(get_members_fields());
					break;
				case 'institutions':
	 	 			return json_encode(get_institutions_fields());
					break;
				default:
					break;
			}
			break;
		case 'fieldgroups':
			switch($params['type']) {
				case 'members':
					return json_encode(get_members_fieldgroups());
					break;
				case 'institutions':
	 	 			return json_encode(get_institutions_fieldgroups());
					break;
				default:
					break;
			}
			break;
		default:
			break;
	}
  }
  return json_encode($res);
}
