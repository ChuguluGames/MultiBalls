<?php

class Game {

  public $id;
  public $players = array();
  public $name;

  public function __construct($creator, $id) {
    $creator->creator = true;
    $this->players[] = $creator;
    $this->id = $id;
    $this->name = "Game" . $id;
  }

  public function addPlayer($player) {
    $this->players[] = $player;
  }

  public function disconnect($player) {
    // if creator, gotta find someone else
    if($player->creator) {
      $player->creator = false;
    }

    $player->playing = false;
    $player->game = null;

    foreach($this->players as $key => $_player) {
      if($player->id == $_player->id) {
        array_splice($this->players, $key, 1);
      }
    }   
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