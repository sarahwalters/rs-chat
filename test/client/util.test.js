describe('The utility module', function() {
  it('performs polynomial multiplication in GF256 correctly.', function() {
    assert.sameMembers(UTIL.polynomialMult([0], [0]), [0]);
    assert.sameMembers(UTIL.polynomialMult([0, 0, 0], [1, 2, 3]), [0]);
    assert.sameMembers(UTIL.polynomialMult([1], [1]), [1]);
    assert.sameMembers(UTIL.polynomialMult([42, 73], [1]), [42, 73]);
    assert.sameMembers(UTIL.polynomialMult([1, 1], [1, 1]), [1, 0, 1]);
    assert.sameMembers(UTIL.polynomialMult([1, 1, 1], [1, 1, 1]), [1, 0, 1, 0, 1]);
    assert.sameMembers(UTIL.polynomialMult([1, 2, 3], [4, 5, 6]), [4, 13, 0, 3, 10]);
    assert.sameMembers(UTIL.polynomialMult([253, 254, 255], [253, 254, 255]), [23, 0, 18, 0, 19]);
  });

  it('performs polynomial evaluation in GF256 correctly.', function() {
    assert.equal(UTIL.polynomialEval([0], UTIL.exp3(0)), 0);
    assert.equal(UTIL.polynomialEval([0], UTIL.exp3(0)), 0);
    assert.equal(UTIL.polynomialEval([42], UTIL.exp3(0)), 42);
    assert.equal(UTIL.polynomialEval([1], UTIL.exp3(0)), 1);
    assert.equal(UTIL.polynomialEval([1, 1], UTIL.exp3(0)), 0);
    assert.equal(UTIL.polynomialEval([1, 1, 1], UTIL.exp3(0)), 1);
    assert.equal(UTIL.polynomialEval([42, 73], UTIL.exp3(254)), 166);
    assert.equal(UTIL.polynomialEval([253, 254, 255], UTIL.exp3(42)), 203);
  });
});
