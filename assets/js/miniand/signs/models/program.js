(function(global) {
  function Program() {
    this.src = null;
    this.restrict_length = false;
    this.max_length = 0;
  }

  if (typeof global.Miniand === 'undefined') {
    global.Miniand = function() {};
  }
  if (typeof global.Miniand.Signs === 'undefined') {
    global.Miniand.Signs = function() {};
  }
  global.Miniand.Signs.Program = Program;
})(this);
