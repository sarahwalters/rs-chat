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
    var paddedMsg = UTIL.mergeTypedArrays(msg, new Uint8Array(n - k));
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
      // Perform B-M decoding
      var syndromes = computeSyndromePoly(receivedMsg, n, k);
      var bm = berlekampMassey(syndromes, n, k);
      var errorLocations = findErrorLocations(bm.errorLocationPoly);
      var errorMagnitudes = forneysFormula(errorLocations,
                                           bm.errorEvaluatorPoly);
      repair(receivedMsg, errorLocations, errorMagnitudes);

      // Check that the repaired message is in fact divisible by genPoly
      var repairedRemainder = UTIL.polynomialDiv(receivedMsg, genPoly, n, k);
      var repairedErrors = false;
      for (var i = 0; i < n - k; i++) {
        if (repairedRemainder[i] != 0) {
          throw new Error('Too many errors to decode.');
        }
      }
    }
    return receivedMsg.slice(0, k);
  }

  // Computes a syndrome polynomial (the sum from i = 0 to n-k of Si*X^i)
  // for the specified received message by evaluating the received message
  // at n-k consecutive powers of the generator element within Galois Field 256
  // receivedMsg is an array of length n
  // n specifies the length of the codeword / received message
  // k specifies the length of the original message
  // Returns a big-endian array of length (n-k+1) which represents a polynomial
  // -> [1, 2, 3] is x^2 + 2*x + 3
  function computeSyndromePoly(receivedMsg, n, k) {
    var syndromes = new Uint8Array(n - k + 1);

    // Add the 0th syndrome to represent the coefficient of z^0 even though it's not useful for error correction
    syndromes[n - k] = 0;

    var syndrome;
    for (var i = 1; i <= n - k; i++) {
      syndrome = UTIL.polynomialEval(receivedMsg, UTIL.exp3(i));
      syndromes[syndromes.length - 1 - i] = syndrome;
    }

    return syndromes;
  }

  // Performs the Berlekamp-Massey algorithm on a syndrome polynomial for
  // a certain n and k. Iterates (n-k) times to fit the BM "key equation".
  // Returns an error location polynomial and an error magnitude polynomial.
  // Input syndromePoly and returns errorLocationPoly and errorEvaluatorPoly are
  // big-endian arrays representing polynomials, i.e. [1,2,3] -> x^2 + 2x + 3
  // Inputs n and k are integers
  function berlekampMassey(syndromePoly, n, k) {
    // Compute 1 + syndromePoly in GF (copying to avoid modifying input)
    // Changes the 0 in the z^0 place in syndromePoly to a 1, which we need mathematically
    var syndromePolyPlusOne = syndromePoly.slice(0);
    syndromePolyPlusOne[syndromePoly.length - 1] ^= 1;

    // Initial conditions
    var sigmas = new Array(n - k + 1);
    var omegas = new Array(n - k + 1);
    var taus = new Array(n - k + 1);
    var gammas = new Array(n - k + 1);
    var Ds = new Array(n - k + 1);
    var Bs = new Array(n - k + 1);
    sigmas[0] = new Uint8Array([1]);
    omegas[0] = new Uint8Array([1]);
    taus[0] = new Uint8Array([1]);
    gammas[0] = new Uint8Array([0]);
    Ds[0] = 0;
    Bs[0] = false;

    // Perform n-k iterations
    var lhs;
    var delta;
    var shiftedTau;
    var shiftedGamma;
    var scaledTau;
    var scaledGamma;
    var DThreshold;
    for (var i = 0; i <= n - k; i++) {
      // Compute the left-hand side of the key equation
      lhs = UTIL.polynomialMult(sigmas[i], syndromePolyPlusOne);

      // Delta is the coefficient of z^(i+1)
      delta = lhs[(lhs.length - 1) - (i + 1)];

      // Use tau and gamma to update sigma and omega:
      shiftedTau = UTIL.mergeTypedArrays(taus[i], new Uint8Array([0])); // z * tau
      shiftedGamma = UTIL.mergeTypedArrays(gammas[i], new Uint8Array([0])); // z * gamma
      scaledTau = UTIL.polynomialScale(shiftedTau, delta); // delta * z * tau
      scaledGamma = UTIL.polynomialScale(shiftedGamma, delta); // delta * z * gamma
      sigmas[i + 1] = UTIL.polynomialAdd(sigmas[i], scaledTau);
      omegas[i + 1] = UTIL.polynomialAdd(omegas[i], scaledGamma);

      // Follow the B-M iteration rules to update tau and gamma:
      DThreshold = (i + 1) / 2;
      if (delta == 0 || Ds[i] > DThreshold || (Ds[i] == DThreshold && !Bs[i])) {
        // RULE A
        taus[i + 1] = UTIL.mergeTypedArrays(taus[i], new Uint8Array([0]));
        gammas[i + 1] = UTIL.mergeTypedArrays(gammas[i], new Uint8Array([0]));
      } else {
        // RULE B
        var invDelta = UTIL.multInv(delta);
        taus[i + 1] = UTIL.polynomialScale(sigmas[i], invDelta);
        gammas[i + 1] = UTIL.polynomialScale(omegas[i], invDelta);

        // Update the D tracker
        Ds[i + 1] = i + 1 - Ds[i];

        // If the equality case triggered, turn the B flag off
        if (Ds[i] == DThreshold) {
          Bs[i + 1] = false;
        }
      }
    }

    return {
      errorLocationPoly: sigmas[n - k],
      errorEvaluatorPoly: omegas[n - k]
    };
  }

  // Determines the set of error locations by finding roots of the error
  // location polynomial.
  // Input errorLocationPoly is a big-endian array representing a polynomial,
  // i.e. [1,2,3] -> x^2 + 2x + 3
  // Output is a set of integers in GF(256), each of which is an error location, GEN^power
  // -> i.e. taking log3 of an element in the set would give you the error position,
  // the power at which the error occurred.
  function findErrorLocations(errorLocationPoly) {
    var errorLocations = [];
    for (var v = 0; v < 256; v++) {
      var res = UTIL.polynomialEval(errorLocationPoly, v);
      if (res == 0) {
        errorLocations.push(UTIL.multInv(v));
      }
    }
    return errorLocations;
  }

  // Performs Forney's Formula on a set of error locations and an error magnitude
  // polynomial to find the set of error magnitudes.
  // Input errorLocations is a set of integers in GF(256)
  // Input errorEvaluatorPoly is a big-endian array representing a polynomial,
  // i.e. [1,2,3] -> x^2 + 2x + 3
  // Output errorMagnitudes is a set of integers in GF(256)
  function forneysFormula(errorLocations, errorEvaluatorPoly) {
    var errorMagnitudes = errorLocations.map(function(xi, i) {
      var invXi = UTIL.multInv(xi);
      var numerator = UTIL.polynomialEval(errorEvaluatorPoly, invXi);

      var denominator = 1;
      var xj;
      var productTerm;
      for (var j = 0; j < errorLocations.length; j++) {
        xj = errorLocations[j];
        if (j != i) {
          productTerm = 1 ^ UTIL.fieldMult(xj, invXi); // Galois extension field addition is xor with base field 2
          denominator = UTIL.fieldMult(denominator, productTerm);
        }
      }

      return UTIL.fieldDiv(numerator, denominator);
    });

    return errorMagnitudes;
  }

  // Repairs a received codeword in place using computed error locations
  // and error magnitudes.
  // Input received is an array of length n
  // Inputs errorLocations and errorMagnitudes are arrays of matching length
  function repair(received, errorLocations, errorMagnitudes) {
    if (!errorLocations || !errorMagnitudes ||
        errorLocations.length != errorMagnitudes.length) {
      throw new Error('Invalid error locations or magnitudes.');
    }

    var errorIndices = errorLocations.map(function(location) {
      return received.length - 1 - UTIL.log3(location);
    });

    var errorIndex;
    for (var i = 0; i < errorIndices.length; i++) {
      errorIndex = errorIndices[i];
      received[errorIndex] ^= errorMagnitudes[i];
    }
  }

  // TESTING RS DECODING -- TODO REMOVE
  var n = 8;
  var k = 4;
  var genPoly = new Uint8Array([1, 24, 180, 158, 114]);
  var msg = new Uint8Array([2, 3, 4, 5]);
  console.log('msg', msg);
  var encoded = encodeRSBlock(msg, n, k);
  console.log('encoded', encoded);
  var withErrors = encoded.slice(0);
  withErrors[2] ^= 100;
  withErrors[1] ^= 3;
  console.log('withErrors', withErrors);
  var decoded = decodeRSBlock(withErrors, n, k);
  console.log('decoded', decoded);

  return {
    encode: encode,
    decode: decode
  };
})();
