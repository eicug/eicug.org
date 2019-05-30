<?php

class ServiceConfig {
    var $cfg = NULL;
    var $destruct = 0;
    function ServiceConfig() { $this->Init(); }
    function &Instance () {
        static $instance;
        if (!isset($instance)) { $c = __CLASS__; $instance = new $c; }
        return $instance;
    }
    function Init() {
        $path = dirname(__FILE__); $path = str_replace(basename($path), '', $path); $path .= 'config/service.conf';
		$this->cfg = parse_ini_file($path, true);
    }
    function Get($section, $param = NULL) {
	if (!empty($param)) {
	    return $this->cfg[$section][$param];
	}
	return $this->cfg[$section];
    }
    function ListAll() { echo '<pre>'; print_r($this->cfg); echo '</pre>'; }
}