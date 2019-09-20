<?php

function get_institutions_fields() {
	$cnf =& ServiceConfig::Instance();
    $db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
    $query = 'SELECT t1.* FROM `'.$db_name.'`.`institutions_fields` t1, `'.$db_name.'`.`institutions_fields_groups` t2 WHERE t1.group = t2.id  ORDER BY t2.weight ASC, t1.`weight` ASC';
    $res = $db->Query($query);
    $fields = array();
    foreach($res as $k => $v) {
        $fields[$v['id']] = $v;
    }
    return $fields;
}

function get_members_fields() {
	$cnf =& ServiceConfig::Instance();
    $db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
    $query = 'SELECT t1.* FROM `'.$db_name.'`.`members_fields` t1, `'.$db_name.'`.`members_fields_groups` t2 WHERE t1.group = t2.id ORDER BY t2.weight ASC, t1.`weight` ASC';
    $res = $db->Query($query);
    $fields = array();
    foreach($res as $k => $v) {
        $fields[$v['id']] = $v;
    }
    return $fields;
}

function get_institutions_fieldgroups() {
	$cnf =& ServiceConfig::Instance();
    $db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
    $query = 'SELECT * FROM `'.$db_name.'`.`institutions_fields_groups` ORDER BY `weight` ASC';
    $res = $db->Query($query);
    $groups = array();
    foreach($res as $k => $v) {
        $groups[$v['id']] = $v;
    }
    return $groups;
}

function get_members_fieldgroups() {
	$cnf =& ServiceConfig::Instance();
    $db =& ServiceDb::Instance('phonebook_api');
	$db_name = $cnf->Get('phonebook_api','database');
    $query = 'SELECT * FROM `'.$db_name.'`.`members_fields_groups` ORDER BY `weight` ASC';
    $res = $db->Query($query);
    $groups = array();
    foreach($res as $k => $v) {
        $groups[$v['id']] = $v;
    }
    return $groups;
}

function convert_members_new_old($new_fixed_name) {
    $map = array(
    'name_first'        => 'FirstName',
    'name_initials'     => 'Initials',
    'name_last'         => 'LastName',
    'name_latex'        => 'LatexLastName',
    'name_unicode'      => 'UnicodeName',
    'inspire_id'        => 'InspireID',
    'address_line_1'    => 'Address1',
    'address_line_2'    => 'Address2',
    'address_line_3'    => 'Address3',
    'city'              => 'City',
    'state'             => 'State',
    'country'           => 'Country',
    'postcode'          => 'PostCode',
    'institution_id'    => 'InstitutionId',
    'email'             => 'EmailAddress',
    'email_alt'         => 'AlternateEmail',
    'phone_home'        => 'Phone',
    'phone_cell'        => 'CellPhone',
    'fax'               => 'Fax',
    'url'               => 'Url',
    'bnl_office'        => 'BnlOffice',
    'bnl_phone_office'  => 'BnlPhone',
    'date_joined'       => 'JoinDate',
    'date_leave'        => 'LeaveDate',
    'is_author'         => 'isAuthor',
    'is_junior'         => 'isJunior',
    'is_shifter'        => 'isShifter',
    'is_expert'         => 'isExpert',
    'is_emeritus'       => 'isEmeritus',
    'expertise'         => 'Expertise',
    'expert_credit'     => 'ExpertCredit'
    );
    if (isset($map[$new_fixed_name])) { return $map[$new_fixed_name]; }
    return '';
}

function convert_institutions_new_old($new_fixed_name) {
    $map = array(
    'name_full'                 => 'InstitutionName',
    'name_short'                => 'Organization',
    'name_group'                => 'GroupName',
    'name_latex'                => 'LatexAffiliation',
    'name_sortby'               => 'NameToSortBy',
    'website_group'             => 'GroupUrl',
    'website_institution'       => 'InstitutionUrl',
    'council_representative'    => 'CouncilRepId',
    'address_line_1'            => 'Address1',
    'address_line_2'            => 'Address2',
    'city'                      => 'City',
    'state'                     => 'State',
    'country'                   => 'Country',
    'postcode'                  => 'PostCode',
    'date_joined'               => 'JoinDate',
    'date_leave'                => 'LeaveDate',
    'associated_id'             => 'AssociatedId',
    'office'                    => 'BnlOffice'
    );
    if (isset($map[$new_fixed_name])) { return $map[$new_fixed_name]; }
    return '';
}
