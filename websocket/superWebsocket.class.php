<?php

class SuperWebSocket extends Websocket {
  private $games = array();

  function send($user, $msg){ 
    $this->say("Sending to " . $user->id . ": ".$msg);
    $msg = $this->wrap($msg);
    socket_write($user->socket,$msg,strlen($msg));
  } 

  public function connect($socket){
    $last_user = end($this->users);
      
    $user = new User($last_user->id + 1);
    $user->socket = $socket;
    array_push($this->users,$user);
    array_push($this->sockets,$socket);
    $this->log($socket." CONNECTED!");
    $this->log(date("d/n/Y ")."at ".date("H:i:s T"));
  }

  public function disconnect($socket){
    $user = $this->getuserbysocket($socket);
    $this->disconnectUser($user);

    // remove the user from the list
    $found=null;
    $n=count($this->users);
    for($i=0;$i<$n;$i++){
      if($this->users[$i]->socket==$socket){ $found=$i; break; }
    }
    if(!is_null($found)){ array_splice($this->users,$found,1); }

    // remove the sockets from the list
    $index=array_search($socket,$this->sockets);
    socket_close($socket);
    $this->log($socket." DISCONNECTED!");
    if($index>=0){ array_splice($this->sockets,$index,1); }
  }

  public function process($user, $message) {
    $this->say("Received: " . $message);

    $message = json_decode($message);

    switch($message->action) {
      case "new_user":
        // tell the user his id
        $this->send($user, json_encode(array())); // need it?

        $user->color = $message->color;

        $this->send($user, json_encode(array(
          "action"  => "init",
          "user" => $user->infos(),
          "games"   => $this->games()
        )));

        // tell the other about the new user
        foreach($this->users as $_user) {
          if($_user->id != $user->id) {
            $this->send($_user, json_encode(array(
              "action"  => "new_user",
              "user" => $user->infos()
            )));
          }
        }             
      break;

      case "new_game":
        $game = $this->addGame($user);

        // tell the user about the game he has create
        $this->send($user, json_encode(array(
          "action" => "connect_game",
          "game" => $game->infos()      
        )));

        // tell the other about the new game
        foreach($this->users as $_user) {
          $this->send($_user, json_encode(array(
            "action"  => "new_game",
            "game" => $game->infos()
          )));
        }            
      break;

      case "connect_game":
        // create a new game
        if($message->id == 0) {
          $game = $this->addGame($user);

          foreach($this->users as $_user) {
            $this->send($_user, json_encode(array(
              "action"  => "new_game",
              "user" => $user->infos(),
              "game" => $game->infos()
            )));
          }             
        } else {
          $game = $this->getGame($message->id);

          // tell the others players he joined
          foreach($game->players as $player) {
            $this->send($player, json_encode(array(
              "action"  => "new_player",
              "user" => $user->infos()
            )));          
          }     
          
          $game->addPlayer($user);     
        }     

        $user->setGame($game);

        $this->send($user, json_encode(array(
          "action"  => "connect_game",
          "user" => $user->infos(),
          "game" => $game->infos()
        )));                

      break;

      case "exit_game":
        $this->disconnectPlayer($user);
      break;

      // send the new ball
      case "add_ball":
        
        if($user->playing) {
          foreach($user->game->players as $player) {
            if($user->id != $player->id) {
              $this->send($player, json_encode(array(
                "action"  => "add_ball",
                "ball" => $message->ball
              )));
            }        
          }

        }
      break;

      case "remove_ball":
        if($user->playing) {
          foreach($user->game->players as $player) {
            if($user->id != $player->id) {
              $this->send($player, json_encode(array(
                "action"  => "remove_ball",
                "id"    => $message->id
              )));
            }        
          }
        }           
      break;
    }
  }

  private function disconnectPlayer($player) {
    // tell about it to the other players
    foreach($player->game->players as $_player) {
      if($player->id != $_player->id) {
        $this->send($_player, json_encode(array(
          "action"  => "disconnect_player",
          "user" => $player->infos(),
        )));
      }        
    }

    // disconnect it from the game
    $player->game->disconnect($player);    
  }

  private function disconnectUser($user) {
    // he is playing to a game
    if($user->playing) {
      $this->disconnectPlayer($user);
    }

    // tell the user about his leaving
    foreach($this->users as $_user) {
      if($_user->id != $user->id) {
        $this->send($_user, json_encode(array(
          "action"  => "disconnect_user",
          "user" => $user->infos(),
        )));       
      }
    }
      
  }

  private function addGame($user) {
    $game = new Game($user, count($this->games) + 1);
    $this->games[] = $game;    
    return $game;
  }

  private function getGame($id) {
    foreach($this->games as $game) {
      if($game->id == $id) return $game;
    }
  }

  private function games() {
    $games = array();
    foreach($this->games as $game) {
      $games[] = $game->infos();
    }

    return $games;
  } 
}

?>