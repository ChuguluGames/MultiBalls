<?php

class User{
  public $id;
  public $socket;
  public $handshake;
  public $nickname;
  public $color;
  public $playing = false;
  public $game;
  public $master = false;

  public function __construct($id) {
    $this->id = $id;
    $this->nickname = "Player" . $id;
  }

  public function setGame($game) {
    $this->playing = true;
    $this->game = $game;
  }

  public function infos() {
    return array(
      "id" => $this->id,
      "nickname" => $this->nickname,
      "color" => $this->color,
      "master" => $this->master
    );
  }
}

?>