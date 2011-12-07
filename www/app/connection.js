function Connection(params) {
  var host = params.host,
      socket = null,
      connected = false,
      pill = [];
  
  function connect() {
    socket = new WebSocket(host);
    socket.onmessage = function(message) { onMessage(message); }
    socket.onclose = function(message) { onClose(message); }    
    socket.onopen = function(message) { onOpen(message); }
  };

  /* when the connection start */
  function onOpen(message) {
    if(params.onOpen !== undefined) params.onOpen(message);
    console.log("connected to the server");

    connected = true;

    if(pill.length > 0) {
      for(var i = 0; i < pill.length; i++) {
        send(pill[i]);
      }

    }
  };

  /* when a message is received */
  function onMessage(message) {
    
    // message = JSON.parse(message.data);

    console.log("received a message from the server");
    console.log(message.data)

    if(params.onMessage !== undefined) params.onMessage(JSON.parse(message.data));
  };
    
  /* when the connection stop */  
  function onClose(message) {
    if(params.onClose !== undefined) params.onClose(message);

    console.log("disconnected to the server");
  };

  /* send a message to the server */
  function send(message) {
    if(connected) {

      console.log("send message to the server");
      message = JSON.stringify(message);
      console.log(message);
      socket.send(message);
    
    // not connected, put in queue
    } else {
      pill.push(message);
      console.log("not connected yet, dude");
    }
  };

  // auto connect
  connect();

  /* publics methods */
  return {
    send: send
  };
};