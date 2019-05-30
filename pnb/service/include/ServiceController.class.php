<?php

class ServiceController {
    var $handler = NULL;
    var $object = NULL;
    var $method = NULL;
    var $params = NULL;

    function ServiceController() { }
    function Init() {
		$req = $this->ParseRequest();
		if (!empty($req)) {
			return $this->CheckHandler($req['object'], $req['method'], $req['params']);
		}
    }
    function Run() {
		$result = $this->Init();
		if ($result) { $tmp = $this->handler; $result = $tmp($this->params); echo $result; exit(0); }
    }
    function CheckHandler($object, $method, $params) {
		$object = strtolower($object);
		$method = strtolower($method);
		$object = str_replace('..','', $object);
		$method = str_replace('..','', $method);

		$file = 'handlers/'.$object.'.'.$method.'.php';
		if (!is_file($file) || !file_exists($file) || !is_readable($file)) {	
		    die('no handler file found!');
	    	return false;
		}
		require_once($file);
		$func = $object.'_'.$method.'_handler';
		if (!function_exists($func)) { 
		    die('no handler function found!');
	    	return false;
		}
		$this->object = $object;
		$this->method = $method;
		$this->params = $params;
		$this->handler = $func;
		return true;
    }
	function ParseRequest() {
		$result = array();
		if ( isset($_GET['q']) && !empty($_GET['q']) ) {
			$tmp = trim($_GET['q'], '/ ');
			$tmp = explode('/', $tmp);
			if (count($tmp) >= 2) {
				$result['object'] = array_shift($tmp);
				$result['method'] = array_shift($tmp);
				if (is_array($tmp)) {
					foreach($tmp as $k => $v) {
						$tmp2 = explode(':', $v);
						$result['params'][$tmp2[0]] = $tmp2[1] ? $tmp2[1] : NULL;
					}
				}
			}
		}
        $post_data = file_get_contents("php://input");
		if (!empty($post_data)) {
			$json_data = json_decode($post_data, true);
			if (!isset($result['params'])) { $result['params'] = array(); }
			if (!empty($json_data) && is_array($json_data)) {
				$result['params'] = array_merge($result['params'], $json_data);
			}
		}
		return $result;
	}
}
