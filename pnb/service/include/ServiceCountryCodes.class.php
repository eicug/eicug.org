<?php

class ServiceCountryCodes {

    var $mCountryCodes = array();
    var $destruct = 0;

    function ServiceCountryCodes() {
        //destructor for php4 compatibility
        register_shutdown_function(array(&$this, '__destruct'));
    }
          
    function __destruct() {
        if ($this->destruct > 0) return;
        $this->destruct = 1;
        $this->Close();
    }
        
    function &Instance () {
    static $instance;
        if (!isset($instance)) {
            $c = __CLASS__;
            $instance = new $c;
			$instance->Init();
        }
        return $instance;
    }

	function Init() {
        $path = dirname(__FILE__); $path = str_replace(basename($path), '', $path); $path .= 'config/country_names_and_code_elements_txt.htm';
        $tmp = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
		array_shift($tmp);
		foreach($tmp as $k => $v) {
			$v = trim($v);
			$kv = explode(';', $v);
			$kv[0] = trim($kv[0]); $kv[1] = trim($kv[1]);
			$this->mCountryCodes[$kv[1]] = $kv[0];
		}
		
	}

	function GetNameByCode($code) {
		$code = strtoupper($code);
		if (array_key_exists($code, $this->mCountryCodes)) {
			return $this->mCountryCodes[$code];
		}
		return 'Unknown';
	}

	function Dump() {
		print_r($this->mCountryCodes);
	}

}
