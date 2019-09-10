<?php

class ServiceDb {

	var $db;
	var $destruct = 0;

	function ServiceDb() {
		//destructor for php4 compatibility
		register_shutdown_function(array(&$this, '__destruct'));
	}

	function __destruct() {
		if ($this->destruct > 0) return;
		$this->destruct = 1;
		$this->Close();
	}

    function &Instance ($domain) {
	static $instance;
        if (!isset($instance[$domain])) {
            $c = __CLASS__;
            $instance[$domain] = new $c;
			$instance[$domain]->InitFromConfig($domain);
        }
        return $instance[$domain];
    }

    // -mxp-
    function Init($dsn, $user, $pass, $database) {
	  //	function Init($dsn, $user, $pass) {

	  // -mxp-
	  //		$this->db = mysql_connect($dsn, $user, $pass);
      $this->db = mysqli_connect($dsn, $user, $pass, $database);
		if (!$this->db) {
		  echo 'Could not connect: ' . mysqli_error();
		  return;
		}
		// -mxp- msqli
		mysqli_query('SET character_set_results=utf8');
		mysqli_query('SET names=utf8');
		mysqli_query('SET character_set_client=utf8');
		mysqli_query('SET character_set_connection=utf8');
		mysqli_query('SET character_set_results=utf8');
		mysqli_query('SET collation_connection=utf8_general_ci');
	}

	function InitFromConfig($cfg_name) {
		$cfg =& ServiceConfig::Instance($cfg_name);
		$this->Init($cfg->Get($cfg_name,'host').':'.$cfg->Get($cfg_name,'port'),
			    $cfg->Get($cfg_name,'user'),
			    $cfg->Get($cfg_name,'password'),
			    $cfg->Get($cfg_name,'database')); // -mxp-
	}

	function SelectDB($name) {
	  // mysql_select_db($name, $this->db);
	}

	function Query($sql) {
	  // -mxp-
	  //		$result = @mysql_query($sql, $this->db);
	  $result = mysqli_query($this->db, $sql);
	  $error = mysqli_error($this->db);
	  //		$error = mysql_error();
	  if (!$result) {
	    if (!strpos(strtolower($error), "doesn't exist") && !strpos(strtolower($error), "unknown column")) {
		    //print_r($error);
  		    //echo 'Invalid query: ' . $error;
		    //echo "\n Query was: ".$sql.'<BR><BR>';
		  }
		} else {
		$rows = array();
		// -mxp-
		//		while ($row = @mysql_fetch_assoc($result)) {
		while ($row = mysqli_fetch_assoc($result)) {
			if (is_array($row) && count($row) == 1) {
				$keys = array_keys($row);
				$rows[$keys[0]][] = $row[$keys[0]];
			} else {
				$rows[] = $row;
			}
		}
		return $rows;
		}
		return array();
	}

	function GetMySQL() {
		if (isset($this->db)) {
			return $this->db;
		}
		return NULL;
	}

	function LastID() {
		if (isset($this->db)) {
			return mysqli_insert_id($this->db);
		}
		return NULL;
	}

	function Close() {
		if (isset($this->db)) {
		  // -mxp-
		  //			@mysql_close($this->db);
			mysqli_close($this->db);
			unset($this->db);
		}
	}

	function Escape($query) {
	    if (isset($this->db)) {
	      return mysqli_real_escape_string($this->db, $query);
	    }
	    return NULL;
	}
}

