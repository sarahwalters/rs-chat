describe('The utility module', function() {
  // TODO throw expects throughout?

  it('performs exponentiation in GF256 correctly.', function() {
    expect(UTIL.exp3(0)).to.equal(1);
    expect(UTIL.exp3(1)).to.equal(3);
    expect(function() { UTIL.exp3(-1); }).to.throw(Error);
    expect(function() { UTIL.exp3(256); }).to.throw(Error);
  });

  it('performs logarithms in GF256 correctly.', function() {
    expect(UTIL.log3(3)).to.equal(1);
    expect(UTIL.log3(5)).to.equal(2);
    expect(function() { UTIL.log3(-1); }).to.throw(Error);
    expect(function() { UTIL.log3(0); }).to.throw(Error);
    expect(function() { UTIL.log3(256); }).to.throw(Error);
  });

  it('performs multiplicative inverses in GF256 correctly.', function() {
    expect(UTIL.multInv(1)).to.equal(1);
    expect(function() { UTIL.multInv(-1); }).to.throw(Error);
    expect(function() { UTIL.multInv(0); }).to.throw(Error);
    expect(function() { UTIL.multInv(256); }).to.throw(Error);
  });

  it('performs field multiplication in GF256 correctly.', function() {
    expect(UTIL.fieldMult(0, 0)).to.equal(0);
    expect(UTIL.fieldMult(1, 0)).to.equal(0);
    expect(UTIL.fieldMult(1, 42)).to.equal(42);
    expect(UTIL.fieldMult(42, 1)).to.equal(42);
    expect(UTIL.fieldMult(7, 18)).to.equal(126);
    expect(UTIL.fieldMult(73, 51)).to.equal(196);
  });

  it('performs field division in GF256 correctly.', function() {
    expect(UTIL.fieldDiv(0, 42)).to.equal(0);
    expect(UTIL.fieldDiv(42, 1)).to.equal(42);
    expect(UTIL.fieldDiv(143, 24)).to.equal(156);
    expect(UTIL.fieldDiv(78, 200)).to.equal(7);
    expect(function() { UTIL.fieldDiv(1, 0); }).to.throw(Error);
  });

  it('performs polynomial addition in GF256 correctly.', function() {
    expect(UTIL.polynomialAdd(new Uint8Array([]),
                              new Uint8Array([])))
      .to.deep.equal(new Uint8Array([]));
    expect(UTIL.polynomialAdd(new Uint8Array([1, 2, 3]),
                              new Uint8Array([0])))
      .to.deep.equal(new Uint8Array([1, 2, 3]));
    expect(UTIL.polynomialAdd(new Uint8Array([1, 1, 1]),
                              new Uint8Array([1, 1, 1])))
      .to.deep.equal(new Uint8Array([]));
    expect(UTIL.polynomialAdd(new Uint8Array([47, 93]),
                              new Uint8Array([103, 18])))
      .to.deep.equal(new Uint8Array([72, 79]));
  });

  it('performs polynomial multiplication in GF256 correctly.', function() {
    expect(UTIL.polynomialMult(new Uint8Array([0]),
                               new Uint8Array([0])))
      .to.deep.equal(new Uint8Array([]));
    expect(UTIL.polynomialMult(new Uint8Array([0, 0, 0]),
                               new Uint8Array([1, 2, 3])))
      .to.deep.equal(new Uint8Array([]));
    expect(UTIL.polynomialMult(new Uint8Array([1]),
                               new Uint8Array([1])))
      .to.deep.equal(new Uint8Array([1]));
    expect(UTIL.polynomialMult(new Uint8Array([42, 73]),
                               new Uint8Array([1])))
      .to.deep.equal(new Uint8Array([42, 73]));
    expect(UTIL.polynomialMult(new Uint8Array([1]),
                               new Uint8Array([42, 73])))
      .to.deep.equal(new Uint8Array([42, 73]));
    expect(UTIL.polynomialMult(new Uint8Array([1, 1]),
                               new Uint8Array([1, 1])))
      .to.deep.equal(new Uint8Array([1, 0, 1]));
    expect(UTIL.polynomialMult(new Uint8Array([1, 1, 1]),
                               new Uint8Array([1, 1, 1])))
      .to.deep.equal(new Uint8Array([1, 0, 1, 0, 1]));
    expect(UTIL.polynomialMult(new Uint8Array([1, 2, 3]),
                               new Uint8Array([4, 5, 6])))
      .to.deep.equal(new Uint8Array([4, 13, 0, 3, 10]));
    expect(UTIL.polynomialMult(new Uint8Array([253, 254, 255]),
                               new Uint8Array([253, 254, 255])))
      .to.deep.equal(new Uint8Array([23, 0, 18, 0, 19]));
  });

  it('performs polynomial division in GF256 correctly.', function() {
    // TODO
  });

  it('performs polynomial evaluation in GF256 correctly.', function() {
    expect(UTIL.polynomialEval(new Uint8Array([0]), UTIL.exp3(0)))
      .to.equal(0);
    expect(UTIL.polynomialEval(new Uint8Array([0]), UTIL.exp3(0)))
      .to.equal(0);
    expect(UTIL.polynomialEval(new Uint8Array([42]), UTIL.exp3(0)))
      .to.equal(42);
    expect(UTIL.polynomialEval(new Uint8Array([1]), UTIL.exp3(0)))
      .to.equal(1);
    expect(UTIL.polynomialEval(new Uint8Array([1, 1]), UTIL.exp3(0)))
      .to.equal(0);
    expect(UTIL.polynomialEval(new Uint8Array([1, 1, 1]), UTIL.exp3(0)))
      .to.equal(1);
    expect(UTIL.polynomialEval(new Uint8Array([42, 73]), UTIL.exp3(254)))
      .to.equal(166);
    expect(UTIL.polynomialEval(new Uint8Array([253, 254, 255]), UTIL.exp3(42)))
      .to.equal(203);
  });

  it('performs polynomial scaling in GF256 correctly.', function() {
    expect(UTIL.polynomialScale(new Uint8Array([0]), 0))
     .to.deep.equal(new Uint8Array([]));
    expect(UTIL.polynomialScale(new Uint8Array([0]), 1))
     .to.deep.equal(new Uint8Array([]));
    expect(UTIL.polynomialScale(new Uint8Array([42, 42, 42]), 1))
     .to.deep.equal(new Uint8Array([42, 42, 42]));
    expect(UTIL.polynomialScale(new Uint8Array([1, 1, 1]), 42))
     .to.deep.equal(new Uint8Array([42, 42, 42]));
    expect(UTIL.polynomialScale(new Uint8Array([1, 5, 10]), 51))
     .to.deep.equal(new Uint8Array([51, 255, 229]));
  });

  it('merges typed arrays correctly.', function() {
    expect(UTIL.mergeTypedArrays(new Uint8Array([]),
                                 new Uint8Array([])))
      .to.deep.equal(new Uint8Array([]));
    expect(UTIL.mergeTypedArrays(new Uint8Array([]),
                                 new Uint8Array([1, 2, 3])))
      .to.deep.equal(new Uint8Array([1, 2, 3]));
    expect(UTIL.mergeTypedArrays(new Uint8Array([1, 2, 3]),
                                 new Uint8Array([])))
      .to.deep.equal(new Uint8Array([1, 2, 3]));
    expect(UTIL.mergeTypedArrays(new Uint8Array([1, 2]),
                                 new Uint8Array([3, 4])))
      .to.deep.equal(new Uint8Array([1, 2, 3, 4]));
  });
});
