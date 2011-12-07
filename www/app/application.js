function Application(params) {
  var socket,
      canvas, container, userColor, timerBalls, isMaster;
    
  function init() {
    setUserColor();
    initSocket();
    initHome();
  }

  function initSocket() {
    socket = new Connection({
      host:       params.host,
      onOpen:     onSocketOpen,
      onClose:    onSocketClose,
      onMessage:  onSocketMessage
    });
  }

  /* bind when the connection with the server happen */
  function onSocketOpen(message) {
    say("Connected to the server");

    // tell the server about the new user
    socket.send({action: "new_user", color: userColor});    
  }

  /* bind when the connection with the server stop */ 
  function onSocketClose(message) {
    say("Disconnected from the server");
  }

  /* bind when the server send a message */
  function onSocketMessage(message) {
    var action = actions[message.action + "Action"];
    if(action) action(message);
  }

  /* callback after a server message */
  var actions = {
    /* just after the user connected */
    initAction: function(message) {
      $("#game_choose .games li:not(#game-0)").remove(); // clear list
      for(var i = 0; i < message.games.length; i++) {
        addGame(message.games[i]);
      }        
      $("#game_choose").show();
      say("Welcome, <span style='color:" + message.user.color + ";'>" + message.user.nickname + "</span>. Please, choose a game.");    
    },

    /* when a new user connects to the server */
    newUserAction: function(message) {
      say("New user connected: " + message.user.nickname);
    },

    /* when a user is connected to a game */
    connectGameAction: function(message) {
      $("#game .left .game_name").html(message.game.name); // set the name of the game
      $("#game .left .players").empty(); // clear the players list

      $("#game_choose").hide();
      $("#game").show();

      // add the players
      for(var i = 0; i < message.game.players.length; i++) {
        addPlayer(message.game.players[i]);
      }       

      say("Connected to the game: " + message.game.name + "");

      initGame(message.game.balls);
      
      if(message.user.master) {
        initMaster();
      }    
    },
      
    /* when the user create a new game */  
    newGameAction: function(message) {
      addGame(message.game); // add the game into the list
      say("New game created by " + message.user.nickname);    
    },

    /* when a player enter the user game */
    newPlayerAction: function(message) {
      addPlayer(message.user); // add the player into the list
      say("New player: <span style='color:" + message.user.color + ";'>" + message.user.nickname + "</span>.");    
    },

    /* when a player exit the user game */
    disconnectPlayerAction: function(message) {
      $("#player-" + message.user.id).remove(); // remove the player from the liste
      say("Player <span style='color:" + message.user.color + ";'>" + message.user.nickname + "</span> disconnected.");    
    },

    /* when an user disconnect from the server */
    disconnectUser: function(message) {
      say("User <span style='color:" + message.user.color + ";'>" + message.user.nickname + "</span> disconnected.");    
    },

    /* when a ball is added by the master */
    addBallAction: function(message) {
      container.add(message.ball);    
    },
      
    /* when a ball is removed */  
    removeBallAction: function(message) {
      container.remove(message.id);

      // send the new set to the server
      if(isMaster) {
        sendBalls();
      }    
    },

    /* when the user become the master */
    changeToMasterAction: function(message) {
      initMaster();    
    }  
  };

  /* set a random color to the user */
  function setUserColor() {
    userColor = '#' + (Math.random() * 0xFFFFFF<<0).toString(16);
  }

  /* initilize page home */ 
  function initHome() {
    initHomeEvents();
  }

  /* add home events */ 
  function initHomeEvents() {
    $("#game_choose .games li").live("click", onClickGameLink);

  }

  /* destroy home events */
  function killHomeEvents() {
    $("#game_choose .games li").die("click", onClickGameLink);
  }

  function onClickGameLink() {
    killHomeEvents();

    var id = $(this).attr("id").split("-")[1];
    socket.send({action: "connect_game", id: id});    
  }

  /* initialize game */
  function initGame(balls) {
    canvas = $("#game .canvas")[0];
    container = new Container(canvas);

    // add the balls to the container
    if(balls.length > 0) {
      container.balls = balls;
      container.update();      
    }

    isMaster = false;     
    
    initGameEvents(); 
  }

  /* stop the game */
  function stopGame() {
    killGameEvents();

    if(timerBalls) {
      clearInterval(timerBalls);
    }    
  }  

  function initGameEvents() {
    $(canvas).bind("click", onClickGameCanvas);
    $("#game .left .game_name").live("click", onClickGameName);
  }

  function killGameEvents() {
    $(canvas).unbind("click", onClickGameCanvas);
    $("#game .left .game_name").die("click", onClickGameName);
  }

  /* when the user come back to the home */
  function onClickGameName() {
    stopGame();

    socket.send({action: "exit_game"});
    $("#game").hide();  
    $("#game_choose").show();    

    initHome();
  }

  /* when the user click on the gane canvas */ 
  function onClickGameCanvas(e) {
    var id = container.isOn(e);
    if(id !== false) {
      container.remove(id);
      socket.send({action: "remove_ball", id: id});
    }    
  }

  function initMaster() {
    isMaster = true;
    timerBalls = setInterval(function() {
      var ball = new Ball(
                          Math.floor((canvas.width - 20) * Math.random()) + 20,
                          Math.floor((canvas.height - 20) * Math.random()) + 20,
                          Math.floor((20 - 10) * Math.random()) + 10,
                          userColor
                        );
      container.add(ball, true);    
      socket.send({action: "add_ball", ball: {id: ball.id, radius: ball.radius, color: ball.color, x: ball.x, y: ball.y}});
      sendBalls();
    }, 2000);  
  }

  /* send the balls to the server */
  function sendBalls() {
    socket.send({action: "update_cache_balls", balls: container.balls}); 
  }

  /* ad a player into the players list */
  function addPlayer(player) {
    $("#game .left .players").append("<li id='player-" + player.id + "' style='color:" + player.color + ";'>" + player.nickname + "</li>");
  }

  /* add a game into the game list */
  function addGame(game) {
    $("#game_choose .games").append("<li id='game-" + game.id + "'>" + game.name + "</li>")
  }

  /* change the console message */ 
  function say(message) {
    $("#console").html(message);
  }

  // public methods
  return {
    initialize: init
  }
}