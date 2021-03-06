'use strict';
// GF(256) arithmetic utility function library.
var UTIL = (function() {
  var GEN = 3;

  // This gives you the value of log3 of the value you pass in
  // log3[0] is undefined but for sake of direct
  // lookup is stored as 0 in array.
  var log3 = new Uint8Array(
    [0x00, 0x00, 0x19, 0x01, 0x32, 0x02, 0x1a, 0xc6,
     0x4b, 0xc7, 0x1b, 0x68, 0x33, 0xee, 0xdf, 0x03,
     0x64, 0x04, 0xe0, 0x0e, 0x34, 0x8d, 0x81, 0xef,
     0x4c, 0x71, 0x08, 0xc8, 0xf8, 0x69, 0x1c, 0xc1,
     0x7d, 0xc2, 0x1d, 0xb5, 0xf9, 0xb9, 0x27, 0x6a,
     0x4d, 0xe4, 0xa6, 0x72, 0x9a, 0xc9, 0x09, 0x78,
     0x65, 0x2f, 0x8a, 0x05, 0x21, 0x0f, 0xe1, 0x24,
     0x12, 0xf0, 0x82, 0x45, 0x35, 0x93, 0xda, 0x8e,
     0x96, 0x8f, 0xdb, 0xbd, 0x36, 0xd0, 0xce, 0x94,
     0x13, 0x5c, 0xd2, 0xf1, 0x40, 0x46, 0x83, 0x38,
     0x66, 0xdd, 0xfd, 0x30, 0xbf, 0x06, 0x8b, 0x62,
     0xb3, 0x25, 0xe2, 0x98, 0x22, 0x88, 0x91, 0x10,
     0x7e, 0x6e, 0x48, 0xc3, 0xa3, 0xb6, 0x1e, 0x42,
     0x3a, 0x6b, 0x28, 0x54, 0xfa, 0x85, 0x3d, 0xba,
     0x2b, 0x79, 0x0a, 0x15, 0x9b, 0x9f, 0x5e, 0xca,
     0x4e, 0xd4, 0xac, 0xe5, 0xf3, 0x73, 0xa7, 0x57,
     0xaf, 0x58, 0xa8, 0x50, 0xf4, 0xea, 0xd6, 0x74,
     0x4f, 0xae, 0xe9, 0xd5, 0xe7, 0xe6, 0xad, 0xe8,
     0x2c, 0xd7, 0x75, 0x7a, 0xeb, 0x16, 0x0b, 0xf5,
     0x59, 0xcb, 0x5f, 0xb0, 0x9c, 0xa9, 0x51, 0xa0,
     0x7f, 0x0c, 0xf6, 0x6f, 0x17, 0xc4, 0x49, 0xec,
     0xd8, 0x43, 0x1f, 0x2d, 0xa4, 0x76, 0x7b, 0xb7,
     0xcc, 0xbb, 0x3e, 0x5a, 0xfb, 0x60, 0xb1, 0x86,
     0x3b, 0x52, 0xa1, 0x6c, 0xaa, 0x55, 0x29, 0x9d,
     0x97, 0xb2, 0x87, 0x90, 0x61, 0xbe, 0xdc, 0xfc,
     0xbc, 0x95, 0xcf, 0xcd, 0x37, 0x3f, 0x5b, 0xd1,
     0x53, 0x39, 0x84, 0x3c, 0x41, 0xa2, 0x6d, 0x47,
     0x14, 0x2a, 0x9e, 0x5d, 0x56, 0xf2, 0xd3, 0xab,
     0x44, 0x11, 0x92, 0xd9, 0x23, 0x20, 0x2e, 0x89,
     0xb4, 0x7c, 0xb8, 0x26, 0x77, 0x99, 0xe3, 0xa5,
     0x67, 0x4a, 0xed, 0xde, 0xc5, 0x31, 0xfe, 0x18,
     0x0d, 0x63, 0x8c, 0x80, 0xc0, 0xf7, 0x70, 0x07]);
  log3.get = function(x) {
    if (x < 1 || x >= log3.length) {
      throw new Error('Invalid lookup into log3 LUT.');
    }
    return log3[x];
  };

  // This gives you the value in the field equal to 3 to the
  // power of the value you pass in
  var exp3 = new Uint8Array(
    [0x01, 0x03, 0x05, 0x0f, 0x11, 0x33, 0x55, 0xff,
     0x1a, 0x2e, 0x72, 0x96, 0xa1, 0xf8, 0x13, 0x35,
     0x5f, 0xe1, 0x38, 0x48, 0xd8, 0x73, 0x95, 0xa4,
     0xf7, 0x02, 0x06, 0x0a, 0x1e, 0x22, 0x66, 0xaa,
     0xe5, 0x34, 0x5c, 0xe4, 0x37, 0x59, 0xeb, 0x26,
     0x6a, 0xbe, 0xd9, 0x70, 0x90, 0xab, 0xe6, 0x31,
     0x53, 0xf5, 0x04, 0x0c, 0x14, 0x3c, 0x44, 0xcc,
     0x4f, 0xd1, 0x68, 0xb8, 0xd3, 0x6e, 0xb2, 0xcd,
     0x4c, 0xd4, 0x67, 0xa9, 0xe0, 0x3b, 0x4d, 0xd7,
     0x62, 0xa6, 0xf1, 0x08, 0x18, 0x28, 0x78, 0x88,
     0x83, 0x9e, 0xb9, 0xd0, 0x6b, 0xbd, 0xdc, 0x7f,
     0x81, 0x98, 0xb3, 0xce, 0x49, 0xdb, 0x76, 0x9a,
     0xb5, 0xc4, 0x57, 0xf9, 0x10, 0x30, 0x50, 0xf0,
     0x0b, 0x1d, 0x27, 0x69, 0xbb, 0xd6, 0x61, 0xa3,
     0xfe, 0x19, 0x2b, 0x7d, 0x87, 0x92, 0xad, 0xec,
     0x2f, 0x71, 0x93, 0xae, 0xe9, 0x20, 0x60, 0xa0,
     0xfb, 0x16, 0x3a, 0x4e, 0xd2, 0x6d, 0xb7, 0xc2,
     0x5d, 0xe7, 0x32, 0x56, 0xfa, 0x15, 0x3f, 0x41,
     0xc3, 0x5e, 0xe2, 0x3d, 0x47, 0xc9, 0x40, 0xc0,
     0x5b, 0xed, 0x2c, 0x74, 0x9c, 0xbf, 0xda, 0x75,
     0x9f, 0xba, 0xd5, 0x64, 0xac, 0xef, 0x2a, 0x7e,
     0x82, 0x9d, 0xbc, 0xdf, 0x7a, 0x8e, 0x89, 0x80,
     0x9b, 0xb6, 0xc1, 0x58, 0xe8, 0x23, 0x65, 0xaf,
     0xea, 0x25, 0x6f, 0xb1, 0xc8, 0x43, 0xc5, 0x54,
     0xfc, 0x1f, 0x21, 0x63, 0xa5, 0xf4, 0x07, 0x09,
     0x1b, 0x2d, 0x77, 0x99, 0xb0, 0xcb, 0x46, 0xca,
     0x45, 0xcf, 0x4a, 0xde, 0x79, 0x8b, 0x86, 0x91,
     0xa8, 0xe3, 0x3e, 0x42, 0xc6, 0x51, 0xf3, 0x0e,
     0x12, 0x36, 0x5a, 0xee, 0x29, 0x7b, 0x8d, 0x8c,
     0x8f, 0x8a, 0x85, 0x94, 0xa7, 0xf2, 0x0d, 0x17,
     0x39, 0x4b, 0xdd, 0x7c, 0x84, 0x97, 0xa2, 0xfd,
     0x1c, 0x24, 0x6c, 0xb4, 0xc7, 0x52, 0xf6, 0x01]);
  exp3.get = function(x) {
    if (x < 0 || x >= exp3.length) {
      throw new Error('Invalid lookup into exp3 LUT.');
    }
    return exp3[x];
  };

  // This one gives you the value in the field that
  // when multiplied with the value you passed in = 1
  // multInv[0] is undefined but for sake of direct lookup is
  // stored as 0 in array.
  var multInv = new Uint8Array(
    [0x00, 0x01, 0x8d, 0xf6, 0xcb, 0x52, 0x7b, 0xd1,
     0xe8, 0x4f, 0x29, 0xc0, 0xb0, 0xe1, 0xe5, 0xc7,
     0x74, 0xb4, 0xaa, 0x4b, 0x99, 0x2b, 0x60, 0x5f,
     0x58, 0x3f, 0xfd, 0xcc, 0xff, 0x40, 0xee, 0xb2,
     0x3a, 0x6e, 0x5a, 0xf1, 0x55, 0x4d, 0xa8, 0xc9,
     0xc1, 0x0a, 0x98, 0x15, 0x30, 0x44, 0xa2, 0xc2,
     0x2c, 0x45, 0x92, 0x6c, 0xf3, 0x39, 0x66, 0x42,
     0xf2, 0x35, 0x20, 0x6f, 0x77, 0xbb, 0x59, 0x19,
     0x1d, 0xfe, 0x37, 0x67, 0x2d, 0x31, 0xf5, 0x69,
     0xa7, 0x64, 0xab, 0x13, 0x54, 0x25, 0xe9, 0x09,
     0xed, 0x5c, 0x05, 0xca, 0x4c, 0x24, 0x87, 0xbf,
     0x18, 0x3e, 0x22, 0xf0, 0x51, 0xec, 0x61, 0x17,
     0x16, 0x5e, 0xaf, 0xd3, 0x49, 0xa6, 0x36, 0x43,
     0xf4, 0x47, 0x91, 0xdf, 0x33, 0x93, 0x21, 0x3b,
     0x79, 0xb7, 0x97, 0x85, 0x10, 0xb5, 0xba, 0x3c,
     0xb6, 0x70, 0xd0, 0x06, 0xa1, 0xfa, 0x81, 0x82,
     0x83, 0x7e, 0x7f, 0x80, 0x96, 0x73, 0xbe, 0x56,
     0x9b, 0x9e, 0x95, 0xd9, 0xf7, 0x02, 0xb9, 0xa4,
     0xde, 0x6a, 0x32, 0x6d, 0xd8, 0x8a, 0x84, 0x72,
     0x2a, 0x14, 0x9f, 0x88, 0xf9, 0xdc, 0x89, 0x9a,
     0xfb, 0x7c, 0x2e, 0xc3, 0x8f, 0xb8, 0x65, 0x48,
     0x26, 0xc8, 0x12, 0x4a, 0xce, 0xe7, 0xd2, 0x62,
     0x0c, 0xe0, 0x1f, 0xef, 0x11, 0x75, 0x78, 0x71,
     0xa5, 0x8e, 0x76, 0x3d, 0xbd, 0xbc, 0x86, 0x57,
     0x0b, 0x28, 0x2f, 0xa3, 0xda, 0xd4, 0xe4, 0x0f,
     0xa9, 0x27, 0x53, 0x04, 0x1b, 0xfc, 0xac, 0xe6,
     0x7a, 0x07, 0xae, 0x63, 0xc5, 0xdb, 0xe2, 0xea,
     0x94, 0x8b, 0xc4, 0xd5, 0x9d, 0xf8, 0x90, 0x6b,
     0xb1, 0x0d, 0xd6, 0xeb, 0xc6, 0x0e, 0xcf, 0xad,
     0x08, 0x4e, 0xd7, 0xe3, 0x5d, 0x50, 0x1e, 0xb3,
     0x5b, 0x23, 0x38, 0x34, 0x68, 0x46, 0x03, 0x8c,
     0xdd, 0x9c, 0x7d, 0xa0, 0xcd, 0x1a, 0x41, 0x1c]);
  multInv.get = function(x) {
    if (x < 1 || x >= multInv.length) {
      throw new Error('Invalid lookup into multInv LUT.');
    }
    return multInv[x];
  };

  // Returns product of two numbers in GF(256).
  // mult1 and mult2 should both be integers between 0 and 255 inclusive.
  function fieldMult(mult1, mult2) {
    if (mult1 == 0 || mult2 == 0) {
      return 0;
    }
    var t = log3.get(mult1) + log3.get(mult2);
    t = t % 255;
    return exp3.get(t);
  }

  // Returns quotient of two numbers in GF(256).
  // dividend and divisor should both be integers between 0 and 255 inclusive.
  function fieldDiv(dividend, divisor) {
    if (divisor == 0) {
      throw new Error('Can\'t divide by 0.');
    } else if (dividend == 0) {
      return 0;
    }
    var t = log3.get(dividend) - log3.get(divisor);
    if (t < 0) {
      t = t + 255;
    }
    return exp3.get(t);
  }

  // Trims leading zeros off of an array
  // arr should be an array or typed array of integers
  function trimLeadingZeros(arr) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] != 0) {
        return arr.slice(i);
      }
    }
    return new arr.constructor(0);
  }

  // Returns sum of two polynomials in GF(256).
  // Both addend1 and addend2 are big-endian arrays of integers which
  // represent polynomials (so, [1,2,3] is x^2 + 2*x + 3)
  function polynomialAdd(addend1, addend2) {
    // Copy the longer array as the result & name the shorter array the addend
    var result;
    var addend;
    if (addend1.length > addend2.length) {
      result = addend1.slice(0);
      addend = addend2;
    } else {
      result = addend2.slice(0);
      addend = addend1;
    }

    for (var i = 1; i <= addend.length; i++) {
      result[result.length - i] ^= addend[addend.length - i]; // Galois extension field addition is xor with base field 2
    }

    return trimLeadingZeros(result);
  }

  function generatePoly(genLen) {
    var poly = new Uint8Array([1,exp3[1]]);
    for (var i = 2; i <= genLen; i++) {
      var genRoot = new Uint8Array([1,exp3[i]]);
      poly = polynomialMult(poly, genRoot);
    }
    return poly;
  }

  // Returns product of two polynomials in GF(256).
  // Both mult1 and mult2 are big-endian arrays of integers which
  // represent polynomials (so, [1,2,3] is x^2 + 2*x + 3)
  function polynomialMult(mult1, mult2) {
    mult1 = trimLeadingZeros(mult1);
    mult2 = trimLeadingZeros(mult2);

    // Handle the zero case
    if (mult1.length == 0 || mult2.length == 0) {
      return new Uint8Array(0);
    }

    // Each polynomial mult has degree mult.length - 1;
    // Multiplying a polynomial of degree (a-1) by a polynomial of degree (b-1)
    // gives a polynomial of degree (a-1)+(b-1) = a + b - 2
    // ...which corresponds to a polynomial array of length a + b - 1
    var resultLength = mult1.length + mult2.length - 1;
    var result = new Uint8Array(resultLength);

    // Multiply the elements of the polynomials pairwise
    var foilCoefficient;
    var foilPower;
    var foilIndex;
    for (var i = 0; i < mult1.length; i++) {
      for (var j = 0; j < mult2.length; j++) {
        foilCoefficient = fieldMult(mult1[i], mult2[j]);
        foilPower = (mult1.length - 1 - i) + (mult2.length - 1 - j);
        foilIndex = resultLength - 1 - foilPower;
        result[foilIndex] ^= foilCoefficient; // Galois extension field addition is xor with base field 2
      }
    }

    return result;
  }

  // Returns quotient of two polynomials in GF(256).
  // Both dividend and divisor are big-endian arrays of integers which
  // represent polynomials (so, [1,2,3] is x^2 + 2*x + 3)
  function polynomialDiv(dividend, divisor, n, k) {
    // Make a copy of dividend to avoid modifying input
    dividend = dividend.slice(0);

    var divLen = n - k + 1;
    if (divisor.length != divLen || dividend.length != n || k >= n) {
      throw new Error('Incorrect n, k, or length of dividend or divisor');
      return null;
    }
    for (var i = 0; i < k; i++) {
      // Find how many of highest order of scaled divisor go in to
      // current highest order of leftover dividend
      // Because of precompute it is simply the coefficient of the
      // highest order of dividend
      var quotient = dividend[i];

      // Find scaled divisor to subtract from current remainder of dividend
      // by multiplying each coefficient of precomputed divisor by current
      // highest order quotient
      var scaledDivisor = polynomialScale(divisor, quotient);

      // Subtract scaled divisor from current remainder of dividend
      // to get new remainder of dividend which will be 1 order less
      for (var j = i; j < i + divLen; j++) {
        dividend[j] = dividend[j] ^ scaledDivisor[j - i]; // Galois extension field subtraction is xor with base field 2
      }
    }

    var remainder = dividend.slice(-(n - k));

    // Adding this as kinda failsafe test case
    for (var i = 0; i < (n - k); i++) {
      if (dividend[i] != 0) {
        throw new Error('Division did not happen properly');
      }
    }

    return remainder; // trimLeadingZeros breaks this -- length expectations
  }

  // Returns evaluation in GF(256) of polynomial at value
  // polynomial is represented as a big-endian array, IE: [1,2,3] -> x^2 + 2x + 3
  // value is represented as an integer
  function polynomialEval(polynomial, value) {
    var valuePower = 1; // updated to represent value^i during loop
    var result = 0;
    var term;
    var coefficient;
    for (var i = 1; i <= polynomial.length; i++) {
      coefficient = polynomial[polynomial.length - i];
      term = fieldMult(coefficient, valuePower);
      result = result ^ term; // Galois extension field addition is xor with base field 2
      valuePower = fieldMult(valuePower, value);
    }
    return result;
  }

  // Returns product of polynomial and scalar in GF(256)
  // polynomial is represented as a big-endian array, IE: [1,2,3] -> x^2 + 2x + 3
  // value is represented as an integer
  function polynomialScale(polynomial, scalar) {
    if (scalar == 0) {
      return new Uint8Array(0);
    }
    polynomial = trimLeadingZeros(polynomial);
    for (var i = 0; i < polynomial.length; i++) {
      polynomial[i] = fieldMult(polynomial[i], scalar);
    }
    return polynomial;
  }

  // Returns concatenation of two typed arrays
  // From http://stackoverflow.com/questions/14071463/how-can-i-merge-typedarrays-in-javascript
  function mergeTypedArrays(arr1, arr2) {
    // Checks for truthy values on both arrays
    if (!arr1 && !arr2) {
      throw new Error('Invalid array merge inputs.');
    }

    // Checks for truthy values or empty arrays on each argument
    // to avoid the unnecessary construction of a new array and
    // the type comparison
    if (!arr2 || arr2.length === 0) {
      return arr1.slice(0);
    }
    if (!arr1 || arr1.length === 0) {
      return arr2.slice(0);
    }

    // Make sure that both typed arrays are of the same type
    if (Object.prototype.toString.call(arr1) !==
        Object.prototype.toString.call(arr2)) {
      throw 'Can\'t merge arrays of different types.';
    }

    var result = new arr1.constructor(arr1.length + arr2.length);
    result.set(arr1);
    result.set(arr2, arr1.length);
    return result;
  }

  return {
    exp3: exp3.get,
    log3: log3.get,
    multInv: multInv.get,
    fieldMult: fieldMult,
    fieldDiv: fieldDiv,
    polynomialAdd: polynomialAdd,
    polynomialMult: polynomialMult,
    polynomialDiv: polynomialDiv,
    polynomialEval: polynomialEval,
    polynomialScale: polynomialScale,
    mergeTypedArrays: mergeTypedArrays,
    generatePoly: generatePoly
  };
})();
