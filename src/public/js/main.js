(function() {
  $.get('constants')
   .done(main)
   .fail(log);

  function main(CONSTANTS) {
    var socket = io();

    // upon form submit, encode newly posted message and emit on socket to server
    $('#post').keypress(function(e) {
      // only submit upon enter key press
      if (e.which != 13) {
        return;
      }

      var msg = $('#post').val();
      var encoded = RS.encode(msg);
      socket.emit(CONSTANTS.EVENT_TYPES.MESSAGE, encoded);
      $('#post').val('');
      return false;
    });

    // upon broadcasted message from server, decode message and add to screen
    socket.on(CONSTANTS.EVENT_TYPES.MESSAGE, function(encoded) {
      var decoded = RS.decode(encoded);
      $('#messages').append($('<p>').text('> ' + decoded));
    });

    // upon update to number of connections, update connections counter
    socket.on(CONSTANTS.EVENT_TYPES.CONNECTIONS, function(connections) {
      var word = connections == 1 ? 'connection' : 'connections';
      var html = connections + ' ' + word;
      $('#connections').html(html);
    });
  }

  function log(err) {
    console.error(err);
  }
})();
