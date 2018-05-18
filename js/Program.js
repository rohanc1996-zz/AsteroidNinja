"use strict";
const Program = function(gl, vertexShader, fragmentShader) {
  this.gl = gl;
  this.sourceFileNames = {vs:vertexShader.sourceFileName, fs:fragmentShader.sourceFileName};
  this.glProgram = gl.createProgram();
  gl.attachShader(this.glProgram, vertexShader.glShader);
  gl.attachShader(this.glProgram, fragmentShader.glShader);

  gl.bindAttribLocation(this.glProgram, 0, 'vertexPosition');

  gl.linkProgram(this.glProgram);
  if (!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
    throw new Error('Could not link shaders [vertex shader:' + vertexShader.sourceFileName + ']:[fragment shader: ' + fragmentShader.sourceFileName + ']\n' + gl.getProgramInfoLog(this.glProgram));
  }

  this.uniforms = {};
  let nUniforms = gl.getProgramParameter(this.glProgram, gl.ACTIVE_UNIFORMS);
  for(let i=0; i<nUniforms; i++){
    let glUniform = gl.getActiveUniform(this.glProgram, i);
    let uniform = {
      type      : glUniform.type,
      size      : glUniform.size || 1,
      location  : gl.getUniformLocation(this.glProgram, glUniform.name)
    };
    this.uniforms[glUniform.name.split('[')[0]] = uniform;
  }
};

Program.prototype.commit = function(){
	this.gl.useProgram(this.glProgram);
};

