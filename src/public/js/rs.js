'use strict';
var RS = (function() {
  // (actually ROT-13 right now, as a dummy example. We can replace w/ RS)
  var ROT = 13;

  function encode(msg) {
    // dummy cipher for now -- advances each letter in message by ROT
    return UTIL.shift(msg, ROT);
  }

  function decode(msg) {
    // dummy cipher for now -- advances each letter in message by -ROT
    return UTIL.shift(msg, -ROT);
  }

  // Encodes using systematic BCH Reed-Solomon on Galois Field 256
  // Message should be passed in as length k block
  // k specifies message length
  // n specifies block length (number of symbols transmitted)
  // n - k is the number of code symbols added.
  // Encoding procedure has the largest order coefficient on the left
  // and the smallest on the right. IE: [1,2,3] -> x^2 + 2x + 3
  // The largest order coeeficient is the [0] element of msg so as
  // to maintain the ordering of [msg, code symbols] in the coded msg.
  function encodeRSBlock(msg, n, k) {
    var remainder = UTIL.polynomialDiv(msg, genPoly, n, k);
    var codedMsg = new Uint8Array(n);
    for (i = 0; i < k; i++) {
      codedMsg[i] = msg[i];
    }
    for (i = k; i < n; i++) {
      codedMsg[i] = remainder[i - k];
    }
    return codedMsg;
  }

  function decodeRSBlock(codedMsg, n, k) {
    var remainder = UTIL.polynomialDiv(codedMsg, genPoly, n, k);
    var errors = false;
    for (i = 0; i < n - k; i++) {
      if (remainder[i] != 0) {
        errors = true;
        break;
      }
    }
    if (errors) {
      // TODO ERROR CORRECTION
      throw new Error('Error correction not implemented yet');
    } else {
      return codedMsg.slice(0, k);
    }
  }

  return {
    encode: encode,
    decode: decode
  };
})();
