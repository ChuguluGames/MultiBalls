<?php

class Game {

  public $id;
  public $players = array();
  public $name;
  public $haveMaster = false;

  public function __construct($player, $id) {
    $this->haveMaster = true;
    $player->master = true;
    $this->players[] = $player;
    $this->id = $id;
    $this->name = "Game" . $id;
  }

  public function addPlayer($player) {
    
    if(!$this->haveMaster) {
      $player->master = true;
      $this->haveMaster = true;
    }

    $this->players[] = $player;
  }

  public function disconnect($player) {
    $player->playing = false;
    $player->game = null;

    foreach($this->players as $key => $_player) {
      if($player->id == $_player->id) {
        array_splice($this->players, $key, 1);
      }
    }   

    $newMaster = false;

    // if creator, gotta find someone else
    if($player->master) {
      $player->master = false;
      $this->haveMaster = false;
      // the next one is the creator now
      if(!empty($this->players)) {
        $this->players[0]->master = true;
        $newMaster = $this->players[0];
        $this->haveMaster = true;
      }
    }   

    return $newMaster;
  }

  public function players() {
    $players = array();
    foreach($this->players as $player) {
      $players[] = $player->infos();
    }

    return $players;
  }

  public function infos() {
    return array(
      "id" => $this->id,
      "name" => $this->name,
      "players" => $this->players()
    );
  }
}

?>