"use strict";
const StarGeometry = function(gl) {
    this.gl = gl;
    var vertexArr = new Float32Array(33); //array to store the points of the triangles that make the star
    const phi = 0.628; //the interval along the circumference of the circle in radians
    vertexArr[0] = 0.0;
    vertexArr[1] = 0.0;
    vertexArr[2] = 0.0;
    for(let i = 1; i <= 10; i += 2) {
        vertexArr[i * 3] = 0.5 * Math.cos(phi * i);
        vertexArr[i * 3 + 1] = 0.5 * Math.sin(phi * i);
        vertexArr[i * 3 + 2] = 0.0;

        vertexArr[i * 3 + 3] = 0.2 * Math.cos(phi * (i + 1));
        vertexArr[i * 3 + 4] = 0.2 * Math.sin(phi * (i + 1));
        vertexArr[i * 3 + 5] = 0.0;
    };
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArr, gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array([
            0,1,2, 0,2,3, 0,3,4, 0,4,5, 0,5,6, 0,6,7, 0,7,8, 0,8,9, 0,9,10, 0,10,1
        ]),
        gl.STATIC_DRAW);
};

StarGeometry.prototype.draw = function() {
    const gl = this.gl;
    // set vertex buffer to pipeline input
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(0);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    gl.vertexAttribPointer(0,
        3, gl.FLOAT, //< three pieces of float
        false, //< do not normalize (make unit length)
        0, //< tightly packed
        0 //< data starts at array start
    );
    //set index buffer to pipeline input
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, 30, gl.UNSIGNED_SHORT, 0);
};
