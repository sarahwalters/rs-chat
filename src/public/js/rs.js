'use strict';
var RS = (function() {
  // (actually ROT-13 right now, as a dummy example. We can replace w/ RS)
  var ROT = 13;

  function encode(msg) {
    // dummy cipher for now -- advances each letter in message by ROT
    return shift(msg, ROT);
  }

  function decode(msg) {
    // dummy cipher for now -- advances each letter in message by -ROT
    return shift(msg, -ROT);
  }

  function shift(msg, rot) {
    return msg.split('').reduce(function(accumulator, letter, index) {
      var shiftedCharCode = letter.charCodeAt() + rot;
      var shiftedLetter = String.fromCharCode(shiftedCharCode);
      return accumulator + shiftedLetter;
    }, '');
  }

  return {
    encode: encode,
    decode: decode
  };
})();
