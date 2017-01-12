describe('The RS implementation', function() {
  it('encodes HELLO as URYY\\. (ROT13 example)', function() {
    assert.equal(RS.encode('HELLO'), 'URYY\\');
  });

  it('decodes URYYB as HELLO. (ROT13 example)', function() {
    assert.equal(RS.decode('URYY\\'), 'HELLO');
  });
});
