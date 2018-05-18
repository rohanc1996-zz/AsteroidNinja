"use strict";
const Material = function(gl, program) {
  this.gl = gl;
  this.program = program;
  const theMaterial = this;
  Object.keys(program.uniforms).forEach(function(uniformName) {
    const uniform = program.uniforms[uniformName];
    const reflectionVariable =
        UniformReflectionFactories.makeVar(gl, uniform.type, uniform.size, uniform.textureUnit);
    if(!Material[uniformName]) {
    	Object.defineProperty(theMaterial, uniformName, {value: reflectionVariable} );
    }
  });

  // at the end of the Material constructor
  return new Proxy(this, { 
    get : function(target, name){ 
      if(!(name in target)){ 
        console.error("WARNING: Ignoring attempt to access material property '" + 
            name + "'. Is '" + name + "' an unused uniform?" ); 
        return Material.dummy; 
      } 
      return target[name]; 
    }, 
  }); 

};

// absorbs all function calls and property accesses without effect
Material.dummy = new Proxy(new Function(), { 
  get: function(target, name){ 
    return Material.dummy; 
  }, 
  apply: function(target, thisArg, args){ 
    return Material.dummy; 
  }, 
}); 


Material.prototype.commit = function() {
  const gl = this.gl;
  this.program.commit();
  const theMaterial = this;
  Object.keys(this.program.uniforms).forEach( function(uniformName) {
    const uniform = theMaterial.program.uniforms[uniformName];
    const reflectionVariable = Material[uniformName] || theMaterial[uniformName];
    reflectionVariable.commit(gl, uniform.location);
  });
};

Object.defineProperty(Material, "modelViewProjMatrix", {value: new Mat4()} );
Object.defineProperty(Material, "viewProjMatrixInverse", {value: new Mat4()} );
Object.defineProperty(Material, "modelMatrix", {value: new Mat4()} );
Object.defineProperty(Material, "elapsedTime", {value: new Vec1()} );
Object.defineProperty(Material, "animationOffset", {value: new Vec2()});
Object.defineProperty(Material, "scale", {value: new Vec2()});