<?php

include "game.class.php";
include "user.class.php";
include "websocket.class.php";
include "superWebsocket.class.php";
include "WebSocketHandshake.class.php";

$master = new SuperWebSocket("localhost", 10001);

?>
