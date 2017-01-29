'use strict';
(function() {
  $.get('constants')
   .done(main)
   .fail(log);

  function main(CONSTANTS) {
    var socket = io();
    var uname = '';
    var n = 255;
    var k = 245;

    $('#uname').val('delete this and enter your user name here');

    // upon form submit, encode newly posted message and emit on socket to server
    $('#post').keypress(function(e) {
      // only submit upon enter key press
      if (e.which != 13) {
        return;
      }

      var msg = $('#post').val();
      var i = 1;
      var last = 0;
      var encoded = {
        data: new Array(0),
        uname: uname,
        n: n,
        k: k,
      }
      for (; i <= msg.length; i++) {
        if (i % k == 0) {
          Array.prototype.push.apply(encoded.data, RS.encode(msg.slice(i - k, i), n, k));
          last = i;
        }
      }
      Array.prototype.push.apply(encoded.data, RS.encode(msg.slice(last, i), n, k));
      socket.emit(CONSTANTS.EVENT_TYPES.MESSAGE, encoded);
      $('#post').val('');
      return false;
    });

    //Upon form submit set this clients username
    $('#uname').keypress(function(e) {
      // only submit upon enter key press
      if (e.which != 13) {
        return;
      }
      uname = $('#uname').val();
      $('#uname').val('Your user name is: ' + uname);
    });

    // upon broadcasted message from server, decode message and add to screen
    socket.on(CONSTANTS.EVENT_TYPES.MESSAGE, function(encoded) {
      var decoded = new Array(0);
      for (var i = 1; i <= encoded.data.length; i++) {
        if (i % n == 0) {
          Array.prototype.push.apply(decoded,
              RS.decode(encoded.data.slice(i - n, i), encoded.n, encoded.k));
        }
      }
      var decodedString = decoded.join('');
      $('#messages').append($('<p>').text(encoded.uname + '> ' + decodedString));
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
