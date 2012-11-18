(function(global) {
  function SignController(sign, element) {
    this.sign = sign;
    this.element = element;
    this.currentProgram = 0;
    this.limitProgramLength = false;
    this.maximumProgramLength = 0;
    this.resetProgramLengthLimitOnInput = false;
    this.programLengthLimitTimeout = null;
  }

  SignController.prototype.run = function() {
    this.showCurrentProgram();
    if (this.limitProgramLength) {
      this.setProgramLengthLimit();
    }
    this.requestFullscreen();
  };

  SignController.prototype.requestFullscreen = function() {
    if (this.element.requestFullscreen) {
      this.element.requestFullscreen();
    } else if (this.element.mozRequestFullScreen) {
      this.element.mozRequestFullScreen();
    } else if (this.element.webkitRequestFullScreen) {
      this.element.webkitRequestFullScreen();
    }
  };

  SignController.prototype.showCurrentProgram = function() {
    this.showProgramAtIndex(this.currentProgram);
  };

  SignController.prototype.showProgramAtIndex = function(index) {
    this.showProgram(this.sign.programs[index]);
  };

  SignController.prototype.showProgram = function(program) {
    this.showUrl(program.src);
  };

  SignController.prototype.showNextProgram = function() {
    this.currentProgram = (this.currentProgram + 1) % this.sign.programs.length;
    this.showCurrentProgram();
  };

  SignController.prototype.showUrl = function(url) {
    this.element.src = url;
  };

  SignController.prototype.clearProgramLengthLimit = function() {
    if (this.programLengthLimitTimeout !== null) {
      clearInterval(this.programLengthLimitTimeout);
      this.programLengthLimitTimeout = null;
    }
  };

  SignController.prototype.resetProgramLengthLimit = function() {
    this.clearProgramLengthLimit();
    this.setProgramLengthLimit();
  };

  SignController.prototype.setProgramLengthLimit = function() {
    var self = this;
    if (this.limitProgramLength && this.programLengthLimitTimeout === null) {
      setTimeout(function() {
        self.showNextProgram();
        self.setProgramLengthLimit();
      }, this.maximumProgramLength);
    }
  };

  SignController.prototype.bindHandlers = function() {

  };

  if (typeof global.Miniand === 'undefined') {
    global.Miniand = function() {};
  }
  if (typeof global.Miniand.Signs === 'undefined') {
    global.Miniand.Signs = function() {};
  }
  global.Miniand.Signs.SignController = SignController;
})(this);
