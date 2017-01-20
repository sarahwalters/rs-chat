'use strict';
(function() {
  $.get('constants')
   .done(main)
   .fail(log);

  function main(CONSTANTS) {
    var socket = io();
    var n = 255;
    var k = 245;

    // upon form submit, encode newly posted message and emit on socket to server
    $('#post').keypress(function(e) {
      // only submit upon enter key press
      if (e.which != 13) {
        return;
      }

      var msg = $('#post').val();
      var i = 1;
      var encoded = new Array(0);
      for (; i <= msg.length; i++) {
        if (i % k == 0) {
          var block = RS.encode(msg.slice(i - k, i));
          Array.prototype.push.apply(encoded, block);
        }
      }
      Array.prototype.push.apply(encoded, RS.encode(msg.slice(i)));
      socket.emit(CONSTANTS.EVENT_TYPES.MESSAGE, encoded);
      $('#post').val('');
      return false;
    });

    // upon broadcasted message from server, decode message and add to screen
    socket.on(CONSTANTS.EVENT_TYPES.MESSAGE, function(encoded) {
      var i = 1;
      var decoded = new Array(0);
      for (; i <= encoded.length; i++) {
        if (i % n == 0) {
          Array.prototype.push.apply(decoded,
              RS.decode(encoded.slice(i - n, i)));
        }
      }
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
