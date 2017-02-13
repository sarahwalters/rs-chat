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
    $(function() {
      $('#login_prompt').dialog({
        autoOpen: true,
        buttons: {
          OK: function() {
            $(this).dialog('close');
          }
        },
        beforeClose: function(event, ui) {
          if ($('#login_uname').val() == '') {
            event.preventDefault();
            $('[for = login_uname]').addClass('invalid');
          } else {
            uname = $('#login_uname').val();
          }
        },
        width: 600
      });
      $('#login_opener').click(function() {
        $('#login_prompt').dialog('open');
      });
    });

    $(function() {
      $('#parameter_prompt').dialog({
        autoOpen: false,
        buttons: {
          OK: function() {
            $(this).dialog('close');
          }
        },
        beforeClose: function(event, ui) {
          var parsedN = parseInt($('#param_n').val());
          var parsedK = parseInt($('#param_k').val());
          if (isNaN(parsedN) || isNaN(parsedK)) {
            $('[for = param_n]').addClass('invalid');
            $('[for = param_k]').addClass('invalid');
            event.preventDefault();
          } else {
            n = parsedN;
            k = parsedK;
          }
        }
      });
      $('#parameter_opener').click(function() {
        $('#parameter_prompt').dialog('open');
      });
    });

    // Upon form submit, encode newly posted message and emit on socket to server.
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
      };
      for (; i <= msg.length; i++) {
        if (i % k == 0) {
          Array.prototype.push.apply(encoded.data, RS.encode(
            msg.slice(i - k, i), n, k));
          last = i;
        }
      }
      Array.prototype.push.apply(encoded.data, RS.encode(
        msg.slice(last, i), n, k));
      console.log(encoded.data);
      socket.emit(CONSTANTS.EVENT_TYPES.MESSAGE, encoded);
      $('#post').val('');
      return false;
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
      $('#messages').append($('<p>').text(
        encoded.uname + '> ' + decodedString));
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
