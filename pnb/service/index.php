<?php

error_reporting(E_ALL & ~E_NOTICE & ~E_STRICT);

include_once('./include/ServiceConfig.class.php');
include_once('./include/ServiceController.class.php');
include_once('./include/ServiceDb.class.php');
//include_once('./include/ServiceCountryCodes.class.php');
include_once('./include/common.functions.php');
include_once('./include/php-excel.class.php');

$cnf =& ServiceConfig::Instance();
$db =& ServiceDb::Instance('phonebook_api');

$controller = new ServiceController();
$controller->Run();
