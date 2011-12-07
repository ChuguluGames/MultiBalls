var Container = function(canvas) {
  canvas.width = $(canvas).width();
  canvas.height = $(canvas).height();
    
  // clear   
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);    

  return {
    balls: [],

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

    add: function(ball, setId) {
      if(setId !== undefined && setId === true) {
        var l = this.balls.length, id = l > 0 ? this.balls[l - 1].id + 1 : 1;
        ball.id = id;
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