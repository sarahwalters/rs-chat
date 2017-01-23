'use strict';
var RS = (function() {
  // Using a RS with 256 symbol size 255 symobls in a codeword and 245 message symbols.
  // n-k = 10 code symbols. Can correct up to 5 symbol errors in each 255 symbol block
  var n = 255;
  var k = 245;

  function encode(msg) {
    // Does Reed Solomon decoding on k length message block of symbols.
    // Cast msg to Uint8Array
    // If msg is not length k then pad with 0s.
    var rsMsg = new Uint8Array(k);
    for (var i = 0; i < msg.length; i++) {
      rsMsg[i] = msg[i].charCodeAt();
    }
    return encodeRSBlock(rsMsg, n, k);
  }

  function decode(msg) {
    // Decode and correct an n length RS codeword in to a k length message.
    // Cast input codeword to Uint8Array decode and return string.
    var decoded = decodeRSBlock(msg, n, k);
    var decodedString = new Array(k);
    for (var i = 0; i < k; i++) {
      if (decoded[i] == 0) {
        break;
      }
      decodedString[i] = String.fromCharCode(decoded[i]);
    }
    return decodedString;
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
    if (msg.length != k) {
      throw new Error('Message block is not length k.');
    }
    var genPoly = UTIL.generatePoly(n - k);
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
    if (receivedMsg.length != n) {
      throw new Error('Received message block is not length n.');
    }

    var genPoly = UTIL.generatePoly(n - k);
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
    var nextSigma = new Uint8Array([1]);
    var nextOmega = new Uint8Array([1]);
    var nextTau = new Uint8Array([1]);
    var nextGamma = new Uint8Array([0]);
    var nextD = 0;
    var nextB = false;

    // Perform n-k iterations
    var sigma;
    var omega;
    var tau;
    var gamma;
    var D;
    var B;
    var lhs;
    var delta;
    var shiftedTau;
    var shiftedGamma;
    var scaledTau;
    var scaledGamma;
    var DThreshold;
    for (var i = 0; i < n - k; i++) {
      sigma = nextSigma;
      omega = nextOmega;
      tau = nextTau;
      gamma = nextGamma;
      D = nextD;
      B = nextB;

      // Compute the left-hand side of the key equation
      lhs = UTIL.polynomialMult(sigma, syndromePolyPlusOne);

      // Delta is the coefficient of z^(i+1)
      delta = lhs[(lhs.length - 1) - (i + 1)];

      // Use tau and gamma to update sigma and omega:
      shiftedTau = UTIL.mergeTypedArrays(tau, new Uint8Array([0])); // z * tau
      shiftedGamma = UTIL.mergeTypedArrays(gamma, new Uint8Array([0])); // z * gamma
      scaledTau = UTIL.polynomialScale(shiftedTau, delta); // delta * z * tau
      scaledGamma = UTIL.polynomialScale(shiftedGamma, delta); // delta * z * gamma
      nextSigma = UTIL.polynomialAdd(sigma, scaledTau);
      nextOmega = UTIL.polynomialAdd(omega, scaledGamma);

      // Follow the B-M iteration rules to update tau and gamma:
      DThreshold = (i + 1) / 2;
      if (delta == 0 || D > DThreshold || (D == DThreshold && !B)) {
        // RULE A
        nextTau = UTIL.mergeTypedArrays(tau, new Uint8Array([0]));
        nextGamma = UTIL.mergeTypedArrays(gamma, new Uint8Array([0]));
        nextD = D;
        nextB = B;
      } else {
        // RULE B
        var invDelta = UTIL.multInv(delta);
        nextTau = UTIL.polynomialScale(sigma, invDelta);
        nextGamma = UTIL.polynomialScale(omega, invDelta);

        // Update the D tracker
        nextD = i + 1 - D;

        // If the equality case triggered, turn the B flag off
        if (D == DThreshold) {
          nextB = false;
        } else {
          nextB = B;
        }
      }
    }

    return {
      errorLocationPoly: nextSigma,
      errorEvaluatorPoly: nextOmega
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

  return {
    encode: encode,
    decode: decode
  };
})();
