(function(global) {
  function Sign() {
    this.programs = [];
    this.interactive_mode = false;
    this.interactive_program = null;
  }

  if (typeof global.Miniand === 'undefined') {
    global.Miniand = function() {};
  }
  if (typeof global.Miniand.Signs === 'undefined') {
    global.Miniand.Signs = function() {};
  }
  global.Miniand.Signs.Sign = Sign;
})(this);
