(function() {
  $.get('constants')
   .done(main)
   .fail(log);

  function main(CONSTANTS) {
    var socket = io();

    // upon form submit, encode newly posted message and emit on socket to server
    $('form').submit(function() {
      var msg = $('#post').val();
      var encoded = RS.encode(msg);
      socket.emit(CONSTANTS.EVENT_TYPES.MESSAGE, encoded);
      $('#post').val('');
      return false;
    });

    // upon broadcasted message from server, decode message and add to screen
    socket.on(CONSTANTS.EVENT_TYPES.MESSAGE, function(encoded) {
      var decoded = RS.decode(encoded);
      $('#messages').append($('<li>').text(decoded));
    });

    // upon update to number of connections, update connections counter
    socket.on(CONSTANTS.EVENT_TYPES.CONNECTIONS, function(connections) {
      $('#connections').html(connections);
    });
  }

  function log(err) {
    console.error(err);
  }
})();
