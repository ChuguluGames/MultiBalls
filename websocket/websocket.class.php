<?php  

// Usage: $master=new WebSocket("localhost",12345);

class WebSocket{
  var $master;
  var $sockets = array();
  var $users   = array();
  var $debug   = false;
  
  function __construct($address,$port){
    error_reporting(E_ALL);
    set_time_limit(0);
    ob_implicit_flush();

    $this->master=socket_create(AF_INET, SOCK_STREAM, SOL_TCP)     or die("socket_create() failed");
    socket_set_option($this->master, SOL_SOCKET, SO_REUSEADDR, 1)  or die("socket_option() failed");
    socket_bind($this->master, $address, $port)                    or die("socket_bind() failed");
    socket_listen($this->master,20)                                or die("socket_listen() failed");
    $this->sockets[] = $this->master;
    $this->say("Server Started : ".date('Y-m-d H:i:s'));
    $this->say("Listening on   : ".$address." port ".$port);
    $this->say("Master socket  : ".$this->master."\n");

    while(true){
      $changed = $this->sockets;
      socket_select($changed,$write=NULL,$except=NULL,NULL);
      foreach($changed as $socket){
        if($socket==$this->master){
          $client=socket_accept($this->master);
          if($client<0){ $this->log("socket_accept() failed"); continue; }
          else{ $this->connect($client); }
        }
        else{
          $bufferLen = 1024;
          $totalBytes = 0;
          $response = "";

          while(($bytes = @socket_recv($socket, $buffer, $bufferLen, 0)) >= $bufferLen) {
            $response .= $buffer;
            $totalBytes += $bytes;
          }

          $totalBytes += $bytes;

          $response .= $buffer;
          echo "bytes received: " . $totalBytes . "\n";

          if($totalBytes==0){ $this->disconnect($socket); }
          else{
            $user = $this->getuserbysocket($socket);
            if(!$user->handshake){ $this->dohandshake($user,$response); }
            else{ $this->process($user,$this->unwrap($response)); }
          }
        }
      }
    }
  }

  function process($user, $msg){
    /* Extend and modify this method to suit your needs */
    /* Basic usage is to echo incoming messages back to client */
    $this->send($user->socket,$msg);
  }

  function send($user, $msg){ 
    $this->say("Sending to " . $user->id . ": ".$msg);
    $msg = $this->wrap($msg);
    socket_write($user->socket,$msg,strlen($msg));
  } 

  function dohandshake($user,$buffer){

    $handshake = WebSocketHandshake($buffer);
    $user->handshake = true;
    socket_write($user->socket, $handshake, strlen($handshake));

    return true;
  }
  
  function calcKey($key1,$key2,$l8b){
        //Get the numbers
        preg_match_all('/([\d]+)/', $key1, $key1_num);
        preg_match_all('/([\d]+)/', $key2, $key2_num);
        //Number crunching [/bad pun]
        $this->log("Key1: " . $key1_num = implode($key1_num[0]) );
        $this->log("Key2: " . $key2_num = implode($key2_num[0]) );
        //Count spaces
        preg_match_all('/([ ]+)/', $key1, $key1_spc);
        preg_match_all('/([ ]+)/', $key2, $key2_spc);
        //How many spaces did it find?
        $this->log("Key1 Spaces: " . $key1_spc = strlen(implode($key1_spc[0])) );
        $this->log("Key2 Spaces: " . $key2_spc = strlen(implode($key2_spc[0])) );
        if($key1_spc==0|$key2_spc==0){ $this->log("Invalid key");return; }
        //Some math
        $key1_sec = pack("N",$key1_num / $key1_spc); //Get the 32bit secret key, minus the other thing
        $key2_sec = pack("N",$key2_num / $key2_spc);
        //This needs checking, I'm not completely sure it should be a binary string
        return md5($key1_sec.$key2_sec.$l8b,1); //The result, I think
  }
  
  function getheaders($req){
    $r=$h=$o=null;
    if(preg_match("/GET (.*) HTTP/"               ,$req,$match)){ $r=$match[1]; }
    if(preg_match("/Host: (.*)\r\n/"              ,$req,$match)){ $h=$match[1]; }
    if(preg_match("/Origin: (.*)\r\n/"            ,$req,$match)){ $o=$match[1]; }
    if(preg_match("/Sec-WebSocket-Key1: (.*)\r\n/",$req,$match)){ $this->log("Sec Key1: ".$sk1=$match[1]); }
    if(preg_match("/Sec-WebSocket-Key2: (.*)\r\n/",$req,$match)){ $this->log("Sec Key2: ".$sk2=$match[1]); }
    if($match=substr($req,-8))                                                                  { $this->log("Last 8 bytes: ".$l8b=$match); }
    return array($r,$h,$o,$sk1,$sk2,$l8b);
  }

  function getuserbysocket($socket){
    $found=null;
    foreach($this->users as $user){
      if($user->socket==$socket){ $found=$user; break; }
    }
    return $found;
  }

  function     say($msg=""){ echo $msg."\n"; }
  function     log($msg=""){ if($this->debug){ echo $msg."\n"; } }
  function    wrap($msg=""){ return chr(0).$msg.chr(255); }
  function  unwrap($msg=""){ return substr($msg,1,strlen($msg)-2); }

}



?>