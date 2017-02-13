var suite = new Benchmark.Suite;

var encodeMsg = 'Hello, Sarah, how are you today? I hope you are doing well!';
var decodeMsg = RS.encode(encodeMsg, 255, 245);


// add tests
suite.add('RSEncode', function() {
  RS.encode(encodeMsg, 255, 245);
})
.add('RSDecode', function() {
  RS.decode(decodeMsg, 255, 245);
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run({ 'async': true });
