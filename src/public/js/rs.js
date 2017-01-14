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
  // The largest order coefficient is the [0] element of msg so as
  // to maintain the ordering of [msg, code symbols] in the coded msg.
  function encodeRSBlock(msg, n, k) {
    var paddedMsg = UTIL.mergeTypedArrays(msg, new Uint8Array(n - k).fill(0));
    var remainder = UTIL.polynomialDiv(paddedMsg, genPoly, n, k);
    var codedMsg = new Uint8Array(n);
    for (var i = 0; i < k; i++) {
      codedMsg[i] = msg[i];
    }
    for (i = k; i < n; i++) {
      codedMsg[i] = remainder[i - k];
    }
    return codedMsg;
  }

  function decodeRSBlock(receivedMsg, n, k) {
    var remainder = UTIL.polynomialDiv(receivedMsg, genPoly, n, k);
    var errors = false;
    for (var i = 0; i < n - k; i++) {
      if (remainder[i] != 0) {
        errors = true;
        break;
      }
    }
    if (errors) {
      var syndromes = computeSyndromePoly(receivedMsg, n, k);
      console.log('syndromes', syndromes);
      var bm = performBerlekampMassey(syndromes, n, k);
      var errorLocations = chienSearch(bm.errorLocationPoly);
      var errorMagnitudes = forneysFormula(errorLocations, bm.errorMagnitudePoly);
      console.log(errorLocations, errorMagnitudes);
      //throw new Error('Error correction not implemented yet');
    } else {
      return receivedMsg.slice(0, k);
    }
  }

  // Computes a syndrome polynomial for the specified received message
  // by evaluating the received message at n-k consecutive powers of
  // the generator element within Galois Field 256
  // receivedMsg is an array of length n
  // n specifies the length of the codeword / received message
  // k specifies the length of the original message
  // Returns a big-endian array representing a polynomial -> [1, 2, 3] is x^2 + 2*x + 3
  function computeSyndromePoly(receivedMsg, n, k) {
    // To start with, let syndromes be little-endian so index corresponds to power of x
    var syndromes = new Uint8Array(n - k + 1);

    // Add the 0th syndrome to represent the coefficient of z^0 even though it's not useful for error correction
    syndromes[0] = 0;

    var syndrome;
    for (var i = 1; i <= n - k; i++) {
      syndrome = UTIL.polynomialEval(receivedMsg, UTIL.exp3(i));
      syndromes[i] = syndrome;
    }
    syndromes.reverse(); // switch to big-endian
    return syndromes;
  }

  function performBerlekampMassey(syndromePoly, n, k) {
    // Compute 1 + syndromePoly in GF (copying to avoid modifying input)
    // Changes the 0 in the z^0 place in syndromePoly to a 1, which we need mathematically
    var syndromePolyPlusOne = syndromePoly.slice();
    syndromePolyPlusOne[syndromePoly.length - 1] ^= 1;

    // Initial conditions
    var sigma = new Uint8Array([1]);
    var omega = new Uint8Array([1]);
    var tau = new Uint8Array([1]);
    var gamma = new Uint8Array([0]);
    var D = 0;
    var B = false;

    // Perform n-k iterations
    var DThreshold, lhs, delta, shiftedTau, shiftedGamma, scaledTau, scaledGamma;
    for (var i = 1; i <= n - k; i++) {
      // Compute the left-hand side of the key equation
      lhs = UTIL.polynomialMult(sigma, syndromePolyPlusOne);

      // Delta is the coefficient of z^(i+1)
      delta = lhs[(lhs.length - 1) - (i + 1)];

      // Use tau and gamma to update sigma and omega:
      shiftedTau = UTIL.mergeTypedArrays(tau, new Uint8Array([0])); // z * tau
      shiftedGamma = UTIL.mergeTypedArrays(gamma, new Uint8Array([0])); // z * gamma
      scaledTau = UTIL.polynomialScale(shiftedTau, delta); // delta * z * tau
      scaledGamma = UTIL.polynomialScale(shiftedGamma, delta); // delta * z * gamma
      sigma = UTIL.polynomialAdd(sigma, scaledTau);
      omega = UTIL.polynomialAdd(omega, scaledGamma);

      // Follow the B-M iteration rules to update tau and gamma:
      DThreshold = (i + 1) / 2;
      if (delta == 0 || D > DThreshold || (D == DThreshold && !B)) {
        // RULE A
        tau = UTIL.mergeTypedArrays(tau, new Uint8Array([0]));
        gamma = UTIL.mergeTypedArrays(gamma, new Uint8Array([0]));
      } else {
        // RULE B
        var invDelta = UTIL.multInv(delta);
        tau = UTIL.polynomialScale(sigma, invDelta);
        gamma = UTIL.polynomialScale(omega, invDelta);

        // Update the D tracker
        D = i + 1 - D;

        // If the equality case triggered, turn the B flag off
        if (D == DThreshold) {
          B = false;
        }
      }
    }

    return {
      errorLocationPoly: sigma,
      errorMagnitudePoly: omega
    };
  }

  function chienSearch(errorLocationPoly) {
    var xis = [];
    for (var v = 0; v < 256; v++) {
      var res = UTIL.polynomialEval(errorLocationPoly, v);
      if (res == 0) {
        xis.push(UTIL.multInv(v));
      }
    }
    return xis;
  }

  function forneysFormula(errorLocations, errorMagnitudePoly) {
    var errorMagnitudes = errorLocations.map(function(xi, i) {
      var invXi = UTIL.multInv(xi);
      var numerator = UTIL.polynomialEval(errorMagnitudePoly, invXi);

      var denominator = 1;
      var xj;
      for (var j = 0; j < errorLocations.length; j++) {
        xj = errorLocations[j];
        if (j != i) {
          denominator *= (1 ^ UTIL.fieldMultiply(xj, invXi));
        }
      }

      return UTIL.fieldDivide(numerator, denominator);
    });

    return errorMagnitudes;
  }

  var n = 8;
  var k = 4;
  var genPoly = new Uint8Array([1, 2, 3, 4, 5]);
  var msg = new Uint8Array([2, 3, 4, 5]);
  console.log('msg', msg);
  var encoded = encodeRSBlock(msg, n, k);
  console.log('encoded', encoded);
  var withError = encoded.slice(0);
  withError[0] ^= 5;
  console.log('withError', withError);
  var decoded = decodeRSBlock(withError, n, k);
  console.log('decoded', decoded);


  // var syndromePoly = computeSyndromePoly(withError, n, k);
  // console.log('syndromes', syndromePoly);
  // var bm = performBerlekampMassey(syndromePoly, n, k);
  // console.log(bm);

  return {
    encode: encode,
    decode: decode
  };
})();
