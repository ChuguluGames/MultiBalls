var socket = new Connection({
  onOpen: function(message) {
    say("Connected to the server");

    // tell the server about the new user
    socket.send({action: "new_user", color: userColor});
  },
  onClose: function(message) {
    say("Disconnected from the server");
  },  
  onMessage: function(message) {
    switch(message.action) {
      case "new_user":
        say("New user connected: " + message.user.nickname);
      break;

      // get the id the server gave us
      case "init":
        $("#game_choose").show();

        for(var i = 0; i < message.games.length; i++) {
          addGame(message.games[i]);
        }        

        say("Welcome, <span style='color:" + message.user.color + ";'>" + message.user.nickname + "</span>. Please, choose a game.");
      break;

      case "connect_game":
        $("#game_choose").hide();
        $("#game").show();

        $("#game .left .game_name").html(message.game.name);

        $("#game .left .players").empty();

        // add the players
        for(var i = 0; i < message.game.players.length; i++) {
          addPlayer(message.game.players[i]);
        }       

        say("Connected to the game: " + message.game.name + "");

        initGame(message.user.creator);
      break;

      case "new_game":
        addGame(message.game);
        say("New game created by " + message.user.nickname);
      break;

      case "new_player":
        addPlayer(message.user);
        say("New player: <span style='color:" + message.user.color + ";'>" + message.user.nickname + "</span>.");
      break;

      case "disconnect_player":
        $("#player-" + message.user.id).remove();
        say("Player <span style='color:" + message.user.color + ";'>" + message.user.nickname + "</span> disconnected.");
      break;

      case "disconnect_user":
        say("User <span style='color:" + message.user.color + ";'>" + message.user.nickname + "</span> disconnected.");
      break;

      // new ball
      case "add_ball":
        container.add(message.ball);
      break;

      case "remove_ball":
        container.remove(message.id);
      break;

    }
  }
});

function addPlayer(player) {
  $("#game .left .players").append("<li id='player-" + player.id + "' style='color:" + player.color + ";'>" + player.nickname + "</li>");
}

function addGame(game) {
  $("#game_choose .games").append("<li id='game-" + game.id + "'>" + game.name + "</li>")
}

$("#game_choose .games li").live("click", function() {
  
  var id = $(this).attr("id").split("-")[1];
  socket.send({action: "connect_game", id: id});
});

$("#game .left .game_name").live("click", function() {
  socket.send({action: "exit_game"});
  $("#game").hide();  
  $("#game_choose").show();
  
});

/* canvas object */
var Container = function(canvas) {
  canvas.width = $(canvas).width();
  canvas.height = $(canvas).height();
    
  return {
    balls: [],
    id: 1,
    updateFrequence: 1000/60,

    update: function() {
      var context = canvas.getContext("2d"),
          i = this.balls.length,
          _ball;
      
      context.clearRect(0, 0, canvas.width, canvas.height);    

      while(i--) {
        _ball = this.balls[i];
        context.fillStyle = _ball.color;
        context.beginPath();
        context.arc(_ball.x, _ball.y, _ball.radius, 0, Math.PI * 2, true); 
        context.closePath();
        context.fill();       
      }
    },

    startAutoUpdate: function() {
      var self = this;
    },

    add: function(ball, setId) {
      if(setId !== undefined && setId === true) {
        ball.id = this.id;
        this.id++;        
      }
      this.balls.push(ball);
      this.update();
    },

    isOn: function(e) {
      var ball;
      for(var i = 0; i < this.balls.length; i++) {
        ball = this.balls[i];
        if((e.offsetX >= ball.x - 10 && e.offsetX <= ball.x + 10) &&
           (e.offsetY >= ball.y - 10 && e.offsetY <= ball.y + 10)) {
          return ball.id;
        }
      }
      return false;
    },

    remove: function(id) {
      var ball,
          keep = [];

      for(var i = 0; i < this.balls.length; i++) {
        if(this.balls[i].id != id) keep.push(this.balls[i]);
      }

      this.balls = keep;

      this.update();
    }
  }
};

/* ball object */
var Ball = function(x, y, radius, color) {
  return {
    x: x,
    y: y,
    radius: radius,
    color: color
  }  
};


function say(message) {
  $("#console").html(message);
}

var canvas = $("#game .canvas")[0],
    container = new Container(canvas),
    userColor = '#' + (Math.random() * 0xFFFFFF<<0).toString(16);

function initGame(master) {
  if(master) {
    setInterval(function() {
      var ball = new Ball(
                          Math.floor((canvas.width - 20) * Math.random()) + 20,
                          Math.floor((canvas.height - 20) * Math.random()) + 20,
                          Math.floor((20 - 10) * Math.random()) + 10,
                          userColor
                        );
      container.add(ball, true);    
      socket.send({action: "add_ball", ball: {id: ball.id, radius: ball.radius, color: ball.color, x: ball.x, y: ball.y}});
    }, 1000);    
  }

  $(canvas).bind("click", function(e) {
    var id = container.isOn(e);
    if(id !== false) {
      container.remove(id);
      socket.send({action: "remove_ball", id: id});
    }
  });  
}

/*
en fait, un seul des joueurs doit ajouter des balls
le jeu, on fait apparaitre des balls
les joueurs doivent cliquer dessus pour les supprimer
le premier a la supprimer gagne un point
sachant quon delete la ball soit quand il clique dessus soit quand on a une mise a jour
mais qui ajoute la ball alors ?
ca devrait etre le serveur, non ?
on envoi des balls il faut calculer la latence et l'envoyer qund le joueur arrive dans la partie
on l'ajoute a notre latence
le joueur 1 est le master, ca veut dire que seul lui ajoute des balls
*/

