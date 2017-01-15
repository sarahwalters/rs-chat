describe('The utility module', function() {
  it('performs polynomial multiplication in GF256 correctly.', function() {
    assert.sameMembers(Array.prototype.slice.call(UTIL.polynomialMult([42, 73], [1])), [42, 73]);
    assert.sameMembers(Array.prototype.slice.call(UTIL.polynomialMult([1, 2, 3], [4, 5, 6])),
        [4, 13, 0, 3, 10]);
  });

  it('constructs a generator polynomial for a code of with n-k = length',
   function() {
    assert.sameMembers(Array.prototype.slice.call(UTIL.generatePoly(1)), [1,3]);
  });
});
