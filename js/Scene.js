"use strict";
const Scene = function(gl, overlay) {
  this.vsSolid = new Shader(gl, gl.VERTEX_SHADER, "solid_vs.essl");
  this.fsSolid = new Shader(gl, gl.FRAGMENT_SHADER, "solid_fs.essl");
  this.vsTrafo = new Shader(gl, gl.VERTEX_SHADER, "trafo_vs.essl");
  this.vsStartEnd = new Shader(gl, gl.VERTEX_SHADER, "simple_background_vs.essl");
  this.vsBackground = new Shader(gl, gl.VERTEX_SHADER, "background_vs.essl");
  this.fsTextured = new Shader(gl, gl.FRAGMENT_SHADER, "textured_fs.essl");
  this.solidProgram = new Program(gl, this.vsSolid, this.fsSolid); //for the shooting stars
  this.texturedProgram = new TexturedProgram(gl, this.vsTrafo, this.fsTextured);
  this.backgroundProgram = new TexturedProgram(gl, this.vsBackground, this.fsTextured);
  this.startEndProgram = new TexturedProgram(gl, this.vsStartEnd, this.fsTextured);

  this.starGeometry = new StarGeometry(gl);
  this.starMaterial = new Material(gl, this.solidProgram);
  this.starMesh = new Mesh(this.starGeometry, this.starMaterial);

  this.quadGeometry = new TexturedQuadGeometry(gl);
  this.textureBoom = new Texture2D(gl, "boom.png"); //to animate the hits
  this.boomMaterial = new Material(gl, this.texturedProgram);
  this.boomMaterial.colorTexture.set(this.textureBoom);
  this.boomMesh = new Mesh(this.quadGeometry, this.boomMaterial);

  this.coolDownTimer = 0; //can only shoot stars every 3 seconds
  this.hitCount = 0; //user's score

  //game phase flags
  this.gameStart = false;
  this.gameOver = false;

  //App overlay
  this.overlay = overlay;
  this.overlay.innerHTML = "<font color=\"white\">Score: " + this.hitCount/2 + "<br> Time: "+ this.gameTime;


  this.gameObjects = [];
  this.timeAtLastFrame = new Date().getTime();
  this.timeAtFirstFrame = new Date().getTime();

  //start screen
  this.startMaterial = new Material(gl, this.startEndProgram);
  this.startMaterial.colorTexture.set(new Texture2D(gl, "media/start_background.jpg"));
  this.startMesh = new Mesh(this.quadGeometry, this.startMaterial);
  this.startBackground = new GameObject( this.startMesh );

  this.background = this.startBackground;

  //end screen
  this.endMaterial = new Material(gl, this.startEndProgram);
  this.endMaterial.colorTexture.set(new Texture2D(gl, "media/end_background.jpg"));
  this.endMesh = new Mesh(this.quadGeometry, this.endMaterial);
  this.endBackground = new GameObject(this.endMesh);

  //game screen
  this.backgroundMaterial = new Material(gl, this.backgroundProgram);
  this.backgroundMaterial.colorTexture.set(new Texture2D(gl, "media/background.jpg"));
  this.backgroundMesh = new Mesh(this.quadGeometry, this.backgroundMaterial);
  this.gamebackground = new GameObject(this.backgroundMesh);
  //this.gameObjects.push(this.background);

  this.raiderMaterial = new Material(gl, this.texturedProgram);
  this.raiderMaterial.colorTexture.set(new Texture2D(gl, "media/raider.png"));
  this.raiderMesh = new Mesh(this.quadGeometry, this.raiderMaterial);
  this.avatar = new GameObject( this.raiderMesh );
  this.gameObjects.push(this.avatar);
  this.difficulty = 3;
  this.gameTime = 0;
  this.waveTime = 0;
  this.asteroidMaterial = new Material(gl, this.texturedProgram);
  this.asteroidMaterial.colorTexture.set(new Texture2D(gl, "media/asteroid.png"));
  this.asteroidMesh = new Mesh(this.quadGeometry, this.asteroidMaterial);

  this.genericMove = function(t, dt){
      this.momentum.addScaled(dt, this.force);
      //this.momentum.mul(Math.pow(this.backDrag, dt));
      this.position.addScaled(dt * this.invMass, this.momentum);

      this.angularMomentum += dt * this.torque;
      this.angularMomentum *= (Math.pow(this.sideDrag, dt));
      this.orientation += dt * this.invAngularMass * this.angularMomentum;

      //directional drag
      const ahead = new Vec3(Math.cos(this.orientation), Math.sin(this.orientation), 0);
      const aheadMomentum = ahead.times(ahead.dot(this.momentum));
      const sideMomentum = this.momentum.minus(aheadMomentum);
      aheadMomentum.mul(Math.pow(this.backDrag, dt));
      sideMomentum.mul(Math.pow(this.sideDrag, dt));
      this.momentum = aheadMomentum.plus(sideMomentum);
  };

  this.asteroidControl = function(t, dt, keysPressed, gameObjects){

  };
  for(let i=0; i < this.difficulty; i++){
    const asteroid = new GameObject( this.asteroidMesh );
    //asteroid.position.set(i/8*3+4, i%8*3);
    asteroid.momentum.setRandom(new Vec3(-4, -4, 0), new Vec3(4, 4, 0));
    asteroid.position.set(asteroid.momentum.times(-15)).plus(this.avatar.position);
    asteroid.angularMomentum = Math.random(-2, 2);
    asteroid.angularMomentum = 0;
    //asteroid.force = 1;
    //asteroid.torque = 1;
    asteroid.isAsteroid = true;
    this.gameObjects.push(asteroid);
    asteroid.move = this.genericMove;
    asteroid.control = this.asteroidControl;
  }
  this.avatar.backDrag = 0.9;
  this.avatar.sideDrag = 0.9;
  this.avatar.angularDrag = 0.5;
  this.avatar.control = function(t, dt, keysPressed, gameObjects){
    this.torque = 0;
    //rotation
    if(keysPressed.RIGHT) {
        this.torque -= 3;
    }
    if(keysPressed.LEFT) {
        this.torque += 3;
    }
    this.thrust = 0;
    //acceleration
    if(keysPressed.UP){
      this.thrust += 2.5;
    }
    if(keysPressed.DOWN){
      this.thrust -= 2.5;
    }
    const ahead = new Vec3(Math.cos(this.orientation), Math.sin(this.orientation), 0);
    this.force.set(ahead).mul(this.thrust);
// compute ahead vector from orientation; force as ahead*thrust
  };
  this.avatar.move = this.genericMove;
  this.avatar.isAvatar = true;
  this.avatar.dieTime = 0; //ship dies instantly upon impact
  this.camera = new OrthoCamera();
  this.timeAtLastFrame = new Date().getTime();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

};

Scene.prototype.update = function(gl, keysPressed) {
  //jshint bitwise:false
  //jshint unused:false

    // clear the screen
    gl.clearColor(0.6, 0.0, 0.3, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.overlay.innerHTML = "<font color=\"white\">Score: " + this.hitCount + "<br> Time: "+ this.gameTime;

    if (!this.gameStart) {
        Material.viewProjMatrixInverse.set(this.camera.viewProjMatrix).invert();
        this.background.draw(this.camera);
      this.overlay.innerHTML = "<font color=\"white\">Score: " + this.hitCount / 2 + "<br> Time: " + this.gameTime;
      if (keysPressed.SPACE) {
          this.gameStart = true;
          this.background = this.gamebackground;
      }
      return;
  }

  const timeAtThisFrame = new Date().getTime();
  const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
  this.timeAtLastFrame = timeAtThisFrame;
  this.coolDownTimer += dt;
  if(!this.gameOver) this.gameTime += dt;
  this.waveTime += dt;
  let phaseVariable = (timeAtThisFrame - this.timeAtFirstFrame) / 1000;
  Material.elapsedTime.set(phaseVariable);
  let animationRate = phaseVariable * 10;
  Material.animationOffset.set((Math.floor(animationRate) % 6), Math.floor(animationRate / 6));


  if(keysPressed.Q){ //shoot
      if (this.coolDownTimer > 0) {
          this.coolDownTimer = -2; //can shoot one every two seconds
          this.shuriken = new GameObject(this.starMesh);
          this.shuriken.scale.set(1, 1);
          this.shuriken.dieTime = 0;
          this.shuriken.isShuriken = true;
          const shotDirection = new Vec3(Math.cos(this.avatar.orientation), Math.sin(this.avatar.orientation), 0);
          this.shuriken.position.set(this.avatar.position).addScaled(2, shotDirection);
          this.shuriken.momentum = shotDirection.times(20);
          this.shuriken.angularMomentum = 10;
          this.shuriken.move = this.genericMove;
          this.gameObjects.push(this.shuriken);
      }
  }
  //new wave of asteroids
  if (this.waveTime > 5){
    this.difficulty+=1;
    this.waveTime = 0;
      for(let i=0; i < this.difficulty; i++){
          const asteroid = new GameObject( this.asteroidMesh );
          asteroid.momentum.setRandom(new Vec3(-4, -4, 0), new Vec3(4, 4, 0));
          asteroid.position.set(asteroid.momentum.direction().times(-15).plus(this.avatar.position));
          //console.log(this.avatar.position);
          asteroid.angularMomentum = Math.random(-2, 2);
          asteroid.angularMomentum = 0;
          asteroid.isAsteroid = true;
          this.gameObjects.push(asteroid);
          asteroid.move = this.genericMove;
          asteroid.control = this.asteroidControl;
      }
  }
  //collision detection
  for (let i = 0; i < this.gameObjects.length; i++){
    for (let j = 0; j <this.gameObjects.length; j++){
      if (i == j) continue;
      if (this.gameObjects[i].position.minus(this.gameObjects[j].position).length() < 1.5 && !this.gameObjects[i].isDying && !this.gameObjects[j].isDying){ //collision
          if(this.gameObjects[i].isShuriken || this.gameObjects[j].isShuriken) {
              this.hitCount++;//increase score
              //console.log("hello");
          }
          if(this.gameObjects[i].isAvatar || this.gameObjects[j].isAvatar){
              this.gameOver = true;
          }
          this.gameObjects[i].isDying = true;
          this.gameObjects[j].isDying = true;
        if(this.gameObjects[i].isAsteroid){
          this.gameObjects[i].mesh = this.boomMesh;
          this.gameObjects[i].animationScale.set(6, 6);
        }
        else if(this.gameObjects[j].isAsteroid) { //j is asteroid
            this.gameObjects[j].mesh = this.boomMesh;
            this.gameObjects[j].animationScale.set(6, 6);
        }
      }
    }
  }
  for (let i = 0; i < this.gameObjects.length; i++){
    if(this.gameObjects[i].isDying)
      this.gameObjects[i].dieTime -= dt;
    if(this.gameObjects[i].dieTime < 0){
      this.gameObjects.splice(i, 1);
      i--;
    }
  }
  for (let i = 0; i < this.gameObjects.length; i++) {
    this.gameObjects[i].control(timeAtThisFrame, dt, keysPressed, this.gameObjects);
  }

  for (let i = 0; i < this.gameObjects.length; i++) {
    this.gameObjects[i].move(timeAtThisFrame, dt);
  }

  this.camera.position = this.avatar.position;
  this.camera.updateViewProjMatrix();

  Material.viewProjMatrixInverse.set(this.camera.viewProjMatrix).invert();
  if(!this.gameOver) {
      this.background.draw(this.camera);
      for (let i = 0; i < this.gameObjects.length; i++) {
          this.gameObjects[i].draw(this.camera);
      }
  }
  else{
      this.background = this.endBackground;
      this.background.draw(this.camera);
  }
};