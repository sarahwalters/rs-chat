describe('The utility module', function() {
  it('performs polynomial multiplication in GF256 correctly.', function() {
    expect(UTIL.polynomialMult([0], [0])).to.deep.equal(new Uint8Array([0]));
    expect(UTIL.polynomialMult([0, 0, 0], [1, 2, 3])).to.deep.equal(new Uint8Array([0]));
    expect(UTIL.polynomialMult([1], [1])).to.deep.equal(new Uint8Array([1]));
    expect(UTIL.polynomialMult([42, 73], [1])).to.deep.equal(new Uint8Array([42, 73]));
    expect(UTIL.polynomialMult([1, 1], [1, 1])).to.deep.equal(new Uint8Array([1, 0, 1]));
    expect(UTIL.polynomialMult([1, 1, 1], [1, 1, 1])).to.deep.equal(new Uint8Array([1, 0, 1, 0, 1]));
    expect(UTIL.polynomialMult([1, 2, 3], [4, 5, 6])).to.deep.equal(new Uint8Array([4, 13, 0, 3, 10]));
    expect(UTIL.polynomialMult([253, 254, 255], [253, 254, 255])).to.deep.equal(new Uint8Array([23, 0, 18, 0, 19]));
  });

  it('performs polynomial evaluation in GF256 correctly.', function() {
    expect(UTIL.polynomialEval([0], UTIL.exp3(0))).to.equal(0);
    expect(UTIL.polynomialEval([0], UTIL.exp3(0))).to.equal(0);
    expect(UTIL.polynomialEval([42], UTIL.exp3(0))).to.equal(42);
    expect(UTIL.polynomialEval([1], UTIL.exp3(0))).to.equal(1);
    expect(UTIL.polynomialEval([1, 1], UTIL.exp3(0))).to.equal(0);
    expect(UTIL.polynomialEval([1, 1, 1], UTIL.exp3(0))).to.equal(1);
    expect(UTIL.polynomialEval([42, 73], UTIL.exp3(254))).to.equal(166);
    expect(UTIL.polynomialEval([253, 254, 255], UTIL.exp3(42))).to.equal(203);
  });
});
