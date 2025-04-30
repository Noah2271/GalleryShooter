class LevelDos extends Phaser.Scene {
    constructor() {
        super("LevelDos");
        this.my = { sprite: {}, projectiles: [], enemies: []};
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio("click", "click.mp3");
    }

    create() {
        let my = this.my;
        this.gameStarted = false;
        this.gameEnded = false;
        this.waveCount = 0;
        // Player variables
        my.moveSpeed = 4;
        my.score = 0;
        my.health = 3;
        my.time = 15;

        // Background creation
        my.sprite.background = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, "background");                                                            // create tile sprites using black.png starting at 0,0 to the width and height borders
        my.sprite.background.setOrigin(0,0);                                                                                                                                        //https://docs.phaser.io/api-documentation/class/gameobjects-tilesprite

        // Create the player related text and sprites
        my.sprite.ship = this.add.sprite(500, 100, "ship");
        my.sprite.ship.setScale(0.5);

        my.scoreText = this.add.text(20, 20, "SCORE:" + my.score, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FFD700"});                                                   // display player score
        my.healthText = this.add.text(my.sprite.ship.x - 80 , 20, "HEALTH:" + my.health, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});                            // display player health
        my.waveText = this.add.text(this.game.config.width-200, 20, "WAVE:" + this.waveCount, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF2999"});                       // display wave count
        my.startText = this.add.text(this.game.config.width/3, this.game.config.height/2, "PRESS S TO START", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"}); 
        // Keyboard input
        my.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);                                                                                                     // A key -> left / D key -> right / R S M keys -> reset (only in endstate), start, return to menu / space -> fire
        my.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        my.RKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R); // R for Reset
        my.SKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S); // S for Start
        my.MKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        my.SPACEKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        my.debugText = this.add.text(70,70, "size:" + my.enemies.length);                                                                                                           // debug enemy counter                                                                                                                   

        // enemy handling events
        this.time.addEvent({
            delay: 15000, callback: this.spawnEnemyRow,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 2000,
            callback: this.enemyShootCheck,
            callbackScope: this,
            loop: true
        });

        // start text blinkers
        this.time.addEvent({
            delay: 1000,
            callback: this.blinkerOff,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 2000, 
            callback: this.blinkerOn,
            callbackScope: this,
            loop: true
        });

        // game state checkers
        this.time.addEvent({
            delay: 100,
            callback: this.endChecker,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 5000,                    
            callback: this.endGame,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        let my = this.my;
        my.sprite.background.tilePositionY += 1;            // scroll the background

        my.debugText.setText("size:" + my.enemies.length)   // debug
        
        // Game state controls
        if (Phaser.Input.Keyboard.JustDown(my.SKey)) {
            my.startText.destroy();
            this.startGame();
            if (!my.once){
                my.Warning = this.add.text(this.game.config.width/3, this.game.config.height/2, "SPAWNING ENEMIES: PLEASE WAIT...", {fontFamily: "Silkscreen", fontSize: "20px", fill: "#FF0000"}); 
                my.once = true;
            }
        }
        
        if (Phaser.Input.Keyboard.JustDown(my.RKey) && this.gameEnded) {
            my.enemies = []                                 // reset enemies so this condition doesn't break  on reset
            my.once = false;
            this.scene.restart();                           // restart the Level scene when R pressed in endstate
        }

        if (Phaser.Input.Keyboard.JustDown(my.MKey) && this.gameEnded) {
            my.once = false
            this.sound.play("click", {
                volume: 0.3   // Can adjust volume using this, goes from 0 to 1
            });
            this.scene.start("LoadOn");
        }

        if(!this.gameStarted || this.gameEnded) {
            return;
        }

        // Player controls
        if (Phaser.Input.Keyboard.JustDown(my.SPACEKey)) {
            const proj = this.add.sprite(my.sprite.ship.x, my.sprite.ship.y, "playerprojectile");
            proj.setScale(0.1);
            my.projectiles.push(proj);
            if(my.score !== 0){
                my.score -= 5;
                my.scoreText.setText("SCORE:" + my.score);
                }
                this.sound.play("regularfire", {
                    volume: 0.3   // Can adjust volume using this, goes from 0 to 1
                });
        }

        my.projectiles = my.projectiles.filter(proj => {    // if projectile offscreen, remove it from the projectile array
            if (proj.y < this.game.config.height || proj.y > 0) {
                return true;
            } else {
                proj.destroy();
                return false;
            }
        });

        if (my.AKey.isDown) {                               // player ship movement
            my.sprite.ship.x -= my.moveSpeed;
        }

        if (my.DKey.isDown) {
            my.sprite.ship.x += my.moveSpeed;
        }

                                                            // boundaries for player
        if (my.sprite.ship.x < 0) {
            my.sprite.ship.x = 0;
        }
        if (my.sprite.ship.x > 1000) {
            my.sprite.ship.x = 1000;
        }

        // Projectile Handling
        for (let proj of this.my.projectiles) {
            if (proj.isEnemyProjectile) {
                if (proj.velocityX !== undefined && proj.velocityY !== undefined) {         // If following curve checked in enemyShootCheck(), shoot directly AT the player
                    proj.x += proj.velocityX;                                                                       
                    proj.y += proj.velocityY;
                } else {
                    proj.y -= 8;                                                            // Default speed to fallback on
                }
            } else {
                proj.y += 10;                                                               // Player projectiles move downward, enemy projectiles move based on velocity given by enemy  
            }
        }

        // Enemy Movement
        for(let enemy of this.my.enemies) {                                                 // Iterate through the enemies
            if (enemy.x < 0){                                                               // if hit left boundary, change direction to the right and vice versa.
                enemy.direction = "right";
            }
            if (enemy.x > this.game.config.width){
                enemy.direction = "left";
            }
            if (enemy.type === 3 && !enemy.isFollowing && enemy.y < this.game.config.height - Phaser.Math.Between(100, 200)) {
                this.startType3Behavior(enemy);                                             // when special enemy type 3 reaches certain Y level, trigger its special behavior and shooting functino
            }
        }
        

        for (let enemy of this.my.enemies) {                                                // constantly move enemies upscreen towards the player
            if (enemy.active) {  // Check that enemy still exists   
                enemy.y -= 0.5;     // Move enemy down the screen
                
                if (enemy.type === 2 || enemy.type === 3) {
                    let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.my.sprite.ship.x, this.my.sprite.ship.y);  
                    enemy.rotation = angle + Phaser.Math.DegToRad(270);                     // If any type 2, face the player.
                }                                                                           // If enemy type II, constantly rotate towrads player and fire in their direction.
            if (enemy.direction == "left" && enemy.y < this.game.config.height - 100){      // Direction change to bounce off boundaries for enemies
                enemy.x -= 0.9;
                }
            if (enemy.direction == "right" && enemy.y < this.game.config.height - 100){
                enemy.x += 0.9;
                }
            }
        }
        
        // Enemy / Player Hit Handling
        for (let proj of my.projectiles) {                                                  // Iterate through projectiles and enemies. If enemy is hit by player projectile destroy sprite
            for (let enemy of my.enemies) {                                                 // mark as hit, and then add to score before setting it.
                if (proj.active && enemy.active && Phaser.Geom.Intersects.RectangleToRectangle(proj.getBounds(), enemy.getBounds()) && !proj.isEnemyProjectile) {
                    enemy.hit = true;          
                    proj.destroy();                                                         // play sound and animation
                    my.score += 100;
                    my.scoreText.setText("SCORE:" + my.score);
                    this.sound.play("death", {
                        volume: 0.3                                         
                    });
                    this.boom = this.add.sprite(enemy.x, enemy.y, "explode1").setScale(0.25).play("explosion");
                }
                if (proj.active && my.sprite.ship.active && Phaser.Geom.Intersects.RectangleToRectangle(proj.getBounds(), my.sprite.ship.getBounds()) && proj.isEnemyProjectile) {
                    my.health -= 1;                                                         // if player hit by enemy projectile, decrement health and update health text.
                    my.healthText.setText("HEALTH:" + my.health);                           // play sound, if health 0, then play animation
                    this.sound.play("death", {
                        volume: 0.3   // Can adjust volume using this, goes from 0 to 1
                    });
                    proj.destroy();
                    if(my.health == 0){
                        my.sprite.ship.destroy();
                        this.boom = this.add.sprite(my.sprite.ship.x, my.sprite.ship.y, "explode1").setScale(0.25).play("explosion");
                    }
                }                                                                           
            }
        }

        my.enemies = my.enemies.filter(enemy => {                                           // if enemy is hit or past the player, remove from array and destroy the sprite, also added case for type 3 escaping the player                                  
            if (enemy.hit || !enemy.active || enemy.y < 0 || enemy.y > game.config.height+95) {
                enemy.destroy();
                return false;
            }
            return true;
        });
        
    }

// other game functions
// function for when S is pressed, update() stops returning itself immediately
startGame() {  
    let my = this.my;
    this.gameStarted = true;
    }

// functions to create blinking "press S to start" text
blinkerOff() {
    let my = this.my;

    if(!this.gameStarted){
        my.startText.destroy();
    }
}

blinkerOn() {
    let my = this.my;

    if(!this.gameStarted){
        my.startText = this.add.text(this.game.config.width/3, this.game.config.height/2, "PRESS S TO START", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
    }
}

// functions for if player health is 0 or enemies are all defeated or out of screen, display player info and flag as gameEnded to unlock the R key to restart the scene.
endChecker() {
    let my = this.my
    if(my.health <= 0 && !this.gameEnded){
        this.gameEnded = true;
        my.endText = this.add.text(this.game.config.width/3, this.game.config.height/2, "GAME OVER", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.finalScoreText = this.add.text(this.game.config.width/3, (this.game.config.height/2) +30, "FINAL SCORE: " + my.score, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.resetText = this.add.text(this.game.config.width/3, (this.game.config.height/2) +60, "PRESS R TO RESET", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.returnText = this.add.text(this.game.config.width/3, (this.game.config.height/2) +90, "PRESS M FOR TITLE MENU", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        
        let storedScore = localStorage.getItem("highscore_LevelDos");                           // compare stored highscore, if none then store current
                                                                                                // https://rexrainbow.github.io/phaser3-rex-notes/docs/site/localstorage/ 
        if (storedScore === null || my.score > parseInt(storedScore)) {
            // Save the new high score
            localStorage.setItem("highscore_LevelDos", my.score);
        }
    }
}

endGame() {
    let my = this.my

    if (this.waveCount == 10 && my.enemies.length === 0 && !this.gameEnded){
        this.gameEnded = true;
        my.winText = this.add.text(150, (this.game.config.height/2) - 30, "YOU HAVE SUCCESSFULLY SURVIVED THE BLUE FLEET", {fontFamily: "Silkscreen", fontSize: "20px", fill: "#7CFC00"});
        my.endText = this.add.text(this.game.config.width/3, this.game.config.height/2, "GAME OVER", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.finalScoreText = this.add.text(this.game.config.width/3, (this.game.config.height/2) + 30, "FINAL SCORE: " + my.score, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.resetText = this.add.text(this.game.config.width/3, (this.game.config.height/2) + 60, "PRESS R TO RESET", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.returnText = this.add.text(this.game.config.width/3, (this.game.config.height/2) +90, "PRESS M FOR TITLE MENU", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});

        let storedScore = localStorage.getItem("highscore_LevelDos");
                                                                                                // compare stored highscore, if none then get current
        if (storedScore === null || my.score > parseInt(storedScore)) {
            // Save the new high score
            localStorage.setItem("highscore_LevelDos", my.score);
        }
    }
}

// functions to spawn lines of enemies
spawnEnemyRow() {                                       // consolidated enemy spawning, maybe fix in level 1
    let my = this.my;
    if (my.Warning.active){
    my.Warning.destroy();
    }
    let count = Phaser.Math.Between(10, 14);
    let startY1 = this.game.config.height;              // two startY properties to offset for 2 different rows of enemies.
    let startY2 = this.game.config.height + 50;
    let startX = Phaser.Math.Between(100, 200);         // where the left edge of the enemy line begins

    if (this.gameStarted && !this.gameEnded && this.waveCount != 10) {
        this.spawnEnemyRowAt(startX, startY1, count / 2);
        this.spawnEnemyRowAt(startX, startY2, count / 2);
                                                        // spawn half the enemies in teh front, half in the back. Increment the wave counter
        this.waveCount += 1;
        this.my.waveText.setText("WAVE: " + this.waveCount);
    }
}

spawnEnemyRowAt(startX, startY, count) {                // insantiate random value per each enemy spawned. Based on value assign type and sprite key, then spawn the enemy at the end of the loop based on the assigned properties.
    let my = this.my;                                   // rotate sprites because enemy sprites face down, they need to face up. Assign right or left at equal odds for when the line splits up. Push enemy into the enemy array for endstate tracking

    for (let i = 0; i < count; i++) {
        let rand = Math.random();
        let enemyType;
        let spriteKey;

        if (rand < 0.6) {
            enemyType = 1;
            spriteKey = "enemy3";
        } else if (rand < 0.9) {
            enemyType = 2;
            spriteKey = "enemy4";
        } else {
            enemyType = 3;
            spriteKey = "enemy5"; 
        }

        let enemy = this.add.sprite(startX + i * 100, startY, spriteKey);
        enemy.setRotation(Phaser.Math.DegToRad(180));
        enemy.setScale(0.5);
        enemy.direction = Math.random() < 0.5 ? "left" : "right";
        enemy.isFollowing = false;
        enemy.type = enemyType;

        my.enemies.push(enemy);
    }
}

// typical shoot call function
enemyShootCheck() {
    let my = this.my;

    for (let enemy of my.enemies) {                                             // ENEMY TYPE 1, 2 ONLY: if enemy is not too close to player, 30% to shoot straight
        if(enemy.active && enemy.y > this.game.config.height/3) {
            if (Math.random() < 0.3) {
                this.enemyShoot(enemy);
                }
            }
        }
    }

// shoot function
enemyShoot(enemy) {                                     
        let my = this.my;

    if(this.gameStarted && !this.gameEnded){
        if (enemy.type === 2) {                                                 // TYPE 2: calculate the angle in order to shoot AT the player
            const baseAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, my.sprite.ship.x, my.sprite.ship.y);
    
            const angleOffsets = [-0.3, 0, 0.3];                                // array of bullet offsets for the three bullet spread, first one should offset it a bit to the left, then no offset, then offset a bit to the right
    
            for (let offset of angleOffsets) {
                const angle = baseAngle + offset;
    
                const proj = this.add.sprite(enemy.x, enemy.y, "specialprojectile");
                proj.setScale(0.1);
                proj.isEnemyProjectile = true;
    
                proj.velocityX = Math.cos(angle) * 5/3;                        // calculate angle trajectory
                proj.velocityY = Math.sin(angle) * 5/3;
    
                my.projectiles.push(proj);                                     // push on the projectile to the array
            }

        } else if(enemy.type != 3){        
            const proj = this.add.sprite(enemy.x, enemy.y, "projectile");      // TYPE 1: No fancy stuff, just shoot straight with -8 velocity
            proj.setScale(0.5);
            proj.isEnemyProjectile = true;                                                                                        
            proj.velocityX = 0;                                                                               
            proj.velocityY = -8;
            my.projectiles.push(proj);  
        }
                                                                               // push projectile into projectiles array
    }
}

// this levels special enemy
startType3Behavior(enemy) {
    let my = this.my;
    
    let endX = my.sprite.ship.x;                                               // mark positions for endpoint which should be at players x at the time of calling, halfway down the screen.
    let endY = this.game.config.height / 2;
    
    let curve = new Phaser.Curves.Spline([                                     // create a curve based on 3 points; current enemy position, a random, slightly moved back random x position, and the current player x at position halfway up screen
        enemy.x, enemy.y,                                                      // basically, enemy will move ever so slightly backwards and sideways, and then curve into firing position on the curve
        Phaser.Math.Between(300, 700), enemy.y - 50,
        endX, endY
    ]);
    
    let follower = this.add.follower(curve, enemy.x, enemy.y, "enemy5");       // create new following enemy on the curve
    follower.setRotation(Phaser.Math.DegToRad(180));                           // flip sprite because it will be facing the wrong way
    follower.setScale(0.5);
    follower.type = 3;                                                         // set enemy type so it doesn't adopt the other firing behaviors
    follower.isFollowing = true;
    
    follower.startFollow({
        duration: 2000,
        onComplete: () => {
            let shotsFired = 0;
            const maxShots = 3;
    
            this.time.addEvent({                                               // three shot burst event that occurs after the curve has been followed through all the way.
                delay: 300,
                repeat: maxShots - 1,                                           // how many times shot - 1 because indexing starts at 0
                callback: () => {
                    if (!follower.active) return;
                    const baseAngle = Phaser.Math.Angle.Between(follower.x, follower.y, my.sprite.ship.x, my.sprite.ship.y);
                    const spread = [0, 0.5, -0.5];                             // almost the same projectile behavior as type 2 at this point, but don't slow the projecitles down (using different array name just in case)
                    for (let offset of spread) {
                        const angle = baseAngle + offset;
                        const proj = this.add.sprite(follower.x, follower.y, "projectile");
                        proj.setScale(0.5);
                        proj.isEnemyProjectile = true;
                        proj.velocityX = Math.cos(angle) * 5 ;                 // calculate bullet trajectories with offset after creating the projectile, and then push it onto the array.
                        proj.velocityY = Math.sin(angle) * 5 ;
                        my.projectiles.push(proj);
                    }
    
                    shotsFired++;                                              // increment how many times shot
                                                                               // create tween that moves the enemy type 3 instance off screen by 100 pixels (destroy is called twice, once here, once in update at enemy.y == 95 to be sure)       
                    if (shotsFired === maxShots) {                             // https://docs.phaser.io/phaser/concepts/tweens 
                        this.tweens.add({                                       
                            targets: follower,
                            y: this.game.config.height + 100,
                            duration: 3000,
                            ease: 'Linear',
                            onComplete: () => {
                                follower.destroy();
                            }
                        });
                    }
                },
                callbackScope: this
            });
        }
    });
    
    enemy.destroy();                                                          // replace the non-following enemy in the array
    let index = my.enemies.indexOf(enemy);
    if (index !== -1) {
        my.enemies[index] = follower;
        }
    }
}



