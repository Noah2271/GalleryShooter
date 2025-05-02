class Level extends Phaser.Scene {
    constructor() {
        super("Level");
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

        // Background creation
        my.sprite.background = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, "background");            // create tile sprites using black.png starting at 0,0 to the width and height borders
        my.sprite.background.setOrigin(0,0);                                                                                        //https://docs.phaser.io/api-documentation/class/gameobjects-tilesprite

        this.anims.create({
            key: "explosion",
            frames: [
                { key: "explode1" },
                { key: "explode2" },
                { key: "explode3" },
            ],
            frameRate: 20,    
            repeat: 5,
            hideOnComplete: true
        });

        // create player sprites
        my.sprite.ship = this.add.sprite(500, 100, "ship");
        my.sprite.ship.setScale(0.5);
        
        // player stat displays
        my.scoreText = this.add.text(20, 20, "SCORE:" + my.score, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FFD700"});   
        my.healthText = this.add.text(my.sprite.ship.x - 80 , 20, "HEALTH:" + my.health, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});    
        my.waveText = this.add.text(this.game.config.width-200, 20, "WAVE:" + this.waveCount, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF2999"});    
        my.startText = this.add.text(this.game.config.width/3, this.game.config.height/2, "PRESS S TO START", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});    
        
        // Keyboard input
        my.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        my.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        my.RKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R); // R for Reset
        my.SKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S); // S for Start
        my.MKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        my.SPACEKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // enemy spawn
        this.time.addEvent({
            delay: 10000, callback: this.spawnEnemyRow,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 5000,
            callback: this.checkTracking,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 2000,
            callback: this.enemyShootCheck,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 200,
            callback: this.enemyTrackingShoot,
            callbackScope: this,
            loop: true
        })

        this.time.addEvent({
            delay: 1000,
            callback: this.blinkerOff,
            callbackScope: this,
            loop: true
        })

        this.time.addEvent({
            delay: 2000, 
            callback: this.blinkerOn,
            callbackScope: this,
            loop: true
        })

        this.time.addEvent({
            delay: 100,
            callback: this.endChecker,
            callbackScope: this,
            loop: true
        })

        this.time.addEvent({
            delay: 1000,          
            callback: this.endGame,
            callbackScope: this,
            loop: true
        })
    }

    update() {
        let my = this.my;

        if (Phaser.Input.Keyboard.JustDown(my.SKey)) {
            my.startText.destroy();
            this.startGame();
            if (!my.once){
                my.Warning = this.add.text(this.game.config.width/3, this.game.config.height/2, "SPAWNING ENEMIES: PLEASE WAIT...", {fontFamily: "Silkscreen", fontSize: "20px", fill: "#FF0000"}); 
                my.once = true;
            }
        }
        
        if (Phaser.Input.Keyboard.JustDown(my.RKey) && this.gameEnded) {
            my.enemies = []                                 // Reset enemies so this condition doesn't break
            my.once = false;
            this.scene.restart();                           // Restart the Level scene when R pressed in endstate
        }

        if (Phaser.Input.Keyboard.JustDown(my.MKey) && this.gameEnded) {
            this.sound.play("click", {
                volume: 0.3   
            });
            my.once = false;
            this.scene.start("LoadOn");
        }

        if(!this.gameStarted || this.gameEnded) {
            return;
        }

        my.sprite.background.tilePositionY += 1;

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
                volume: 0.3   
            });
        }

        my.projectiles = my.projectiles.filter(proj => {    // If projectile offscreen, remove it from the projectile array
            if (proj.y < this.game.config.height || proj.y > 0) {
                return true;
            } else {
                proj.destroy();
                return false;
            }
        });

        if (my.AKey.isDown) {                               // Player ship movement
            my.sprite.ship.x -= my.moveSpeed;
        }

        if (my.DKey.isDown) {
            my.sprite.ship.x += my.moveSpeed;
        }

                                                            // Boundaries for player
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
        }
        

        for (let enemy of this.my.enemies) {                                                // constantly move enemies upscreen towards the player
            if (enemy.active) {  // Check that enemy still exists   
                enemy.y -= 0.5;     // Move enemy down the screen
                
                if (enemy.isFollowing || enemy.type === 2) {
                    let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.my.sprite.ship.x, this.my.sprite.ship.y);  
                    enemy.rotation = angle + Phaser.Math.DegToRad(90);                      // If on the curve, then rotate enemy towards the player.
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
                    proj.destroy();            
                    my.score += 100;
                    my.scoreText.setText("SCORE:" + my.score);
                    this.sound.play("death", {
                        volume: 0.3   // Can adjust volume using this, goes from 0 to 1
                    });
                    this.boom = this.add.sprite(enemy.x, enemy.y, "explode1").setScale(0.25).play("explosion");
                }
                if (proj.active && my.sprite.ship.active && Phaser.Geom.Intersects.RectangleToRectangle(proj.getBounds(), my.sprite.ship.getBounds()) && proj.isEnemyProjectile) {
                    my.health -= 1;                                                         // if player hit by enemy projectile, decrement health and update health text.
                    my.healthText.setText("HEALTH:" + my.health);
                    this.sound.play("death", {
                        volume: 0.3   // Can adjust volume using this, goes from 0 to 1
                    });
                    proj.destroy();
                    if(my.health == 0){
                        my.sprite.ship.destroy();
                        this.boom = this.add.sprite(my.sprite.ship.x, my.sprite.ship.y, "explode1").setScale(0.25).play("explosion");
                    }
                }                                                                           // both instances remove the projectile.
            }
        }

        my.enemies = my.enemies.filter(enemy => {                                           // if enemy is hit or past the player, remove from array and destroy the sprite                                   
            if (enemy.hit || !enemy.active ||  enemy.y < 0) {
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

        let storedScore = localStorage.getItem("highscore_Level");

        if (storedScore === null || my.score > parseInt(storedScore)) {                                      // compare my.score to stored score, if no stored score, then story my.score
            // Save the new high score                                                                       // https://rexrainbow.github.io/phaser3-rex-notes/docs/site/localstorage/
            localStorage.setItem("highscore_Level", my.score);
        }
    }
}

endGame() {
    let my = this.my

    if (this.waveCount == 10 && my.enemies.length === 0 && !this.gameEnded){
        this.gameEnded = true;
        my.winText = this.add.text(150, (this.game.config.height/2) - 30, "YOU HAVE SUCCESSFULLY SURVIVED THE RED FLEET", {fontFamily: "Silkscreen", fontSize: "20px", fill: "#7CFC00"});
        my.endText = this.add.text(this.game.config.width/3, this.game.config.height/2, "GAME OVER", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.finalScoreText = this.add.text(this.game.config.width/3, (this.game.config.height/2) + 30, "FINAL SCORE: " + my.score, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.resetText = this.add.text(this.game.config.width/3, (this.game.config.height/2) + 60, "PRESS R TO RESET", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.returnText = this.add.text(this.game.config.width/3, (this.game.config.height/2) +90, "PRESS M FOR TITLE MENU", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        
        let storedScore = localStorage.getItem("highscore_Level");

        if (storedScore === null || my.score > parseInt(storedScore)) {                                     // compare my.score to stored score, if no stored score, then story my.score
            // Save the new high score
            localStorage.setItem("highscore_Level", my.score);
        }
    }
}

// function to spawn lines of enemies
spawnEnemyRow() {
    let my = this.my;                                                                                   
    if (my.Warning.active){
        my.Warning.destroy();
        }
    let startY = this.game.config.height + 0;                                                                   // at bottom bounds, spawn 5-8 enemies with spacing of 100 pixels between
    let spacing = 100;
    let startX = 200;
    for (let i = 0; i < Phaser.Math.Between(5,8); i++) {                                                        
        if((Math.random() < 0.8) && this.gameStarted && !this.gameEnded && !(this.waveCount == 10)){            // 20% of enemies in the line will be type II, the other 80% type I
            let enemy = this.add.sprite(startX + i * spacing, startY, "enemy1");                                // creating of enemy type 1
            enemy.setScale(0.5);
            if(Math.random() < 0.5){                                                                            // randomize enemy direction which the line splits into after y position specified in update()
                enemy.direction = "left";   
            } else {
                enemy.direction = "right";
            }
            enemy.isFollowing = false;                                                                          // flag for if the enemy is on the curve
            enemy.type = 1;                                                                                     // flag enemy type for different characteristics
            my.enemies.push(enemy);
        } else if (this.gameStarted && !this.gameEnded && !(this.waveCount == 10)) {                            // creating of enemy type 2
            let enemy = this.add.sprite(startX + i * spacing, startY, "enemy2");
            enemy.setScale(0.5);
            if(Math.random() < 0.5){
                enemy.direction = "left";   
            } else {
                enemy.direction = "right";
            }
            enemy.isFollowing = false;
            enemy.type = 2;                                                                                                                                            
            my.enemies.push(enemy);
        }                                                                                                       // push to enemies array
    }
    if(this.waveCount != 10 && !this.gameEnded){                                                                // increment waveCount until desired wave limit for the level
    this.waveCount += 1;
    my.waveText.setText("WAVE: " + this.waveCount); 
    }  
}

// function to start enemy on a curve
checkTracking() {
    let my = this.my;

    for (let enemy of my.enemies) {                                                                             // iterate through all enemies on screen. If game still going and enemy not
        if (!enemy.isFollowing && enemy.active && this.gameStarted && !this.gameEnded) {                        // currently following, then 20% chance of calling startTrackingEnemy()
            // 30% chance to start tracking
            if (Math.random() < 0.2 && enemy.y > 400 && enemy.type === 1) {
                this.startTrackingEnemy(enemy);                                                                 // do not allow enemy to get on the curve if it is too close to the player or it would be impossible to dodge
            }
        }
    }
}

// function to set enemy on a curve towards the player
startTrackingEnemy(enemy) {                                                                                                                                             
        let my = this.my;                                                                                                                                     
    
        let startX = enemy.x;                                                                                   // create three points; one at current enemy position, random position at midpoint between enemy and player
        let startY = enemy.y;                                                                                   // one behind the players current position
    
        let midX = Phaser.Math.Between(100, 900);                                                               
        let midY = (startY + my.sprite.ship.y) / 2;
    
        let endX = my.sprite.ship.x + Phaser.Math.Between(-100, 100);
        let endY = my.sprite.ship.y - 200;
    
        let curve = new Phaser.Curves.Spline([                                                                  // create spline curve with points                                              
            startX, startY,
            midX, midY,
            endX, endY
        ]);
    
        // Turn into a follower!
        let follower = this.add.follower(curve, startX, startY, "enemy1");                                      // destroy the old non tracking enemy and replace it with a tracking one.
        follower.setScale(0.5);
    
        follower.isFollowing = true;
    
        follower.startFollow({
            from: 0,
            to: 1,
            delay: 0,
            duration: 4000,
            ease: 'Sine.easeInOut',
            repeat: 0,
            yoyo: false,
            rotateToPath: false
        });
    
        enemy.destroy();
    
        let index = my.enemies.indexOf(enemy);                                                                  // replace old enemy with tracking enemy
        if (index !== -1) {
            my.enemies[index] = follower;
        }
    }

// typical shoot call function
enemyShootCheck() {
    let my = this.my;

    for (let enemy of my.enemies) {                                                                             // if enemy is not too close to player, 50% chance to call shoot function
        if(enemy.active && enemy.y > this.game.config.height/3) {
            if (Math.random() < 0.5) {
                this.enemyShoot(enemy);
                }
            }
        }
    }

// special shoot call function
enemyTrackingShoot() {                                                                                          // special shooting function, could be consolidated into enemyShootCheck, but I want
    let my = this.my;                                                                                           // to keep enemy shoot check strictly on a 2 second cooldown

    for(let enemy of my.enemies){
        if(enemy.active && enemy.isFollowing && enemy.y > this.game.config.height/3) {
            if (Math.random() < 0.5) {
                this.enemyShoot(enemy);
                }
            }
            if(enemy.active && enemy.type === 2 && enemy.y > this.game.config.height/3) {
                if (Math.random() < 0.10) {
                    this.enemyShoot(enemy);
            }
        }
    }
}

// shoot function
enemyShoot(enemy) {                                                                                              // create projectile flagged as an enemis, if on curve calculate trajectory of the bullet to current player position using phaser math
        let my = this.my;
    
        const proj = this.add.sprite(enemy.x, enemy.y, "projectile");                                            // create projectile
        proj.setScale(0.5);
        proj.isEnemyProjectile = true;
    
        if (enemy.isFollowing || enemy.type === 2) {                                                            // if enemy type 2 or following, calculate angle to shoot DIRECTLY at the player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, my.sprite.ship.x, my.sprite.ship.y);                                                              
            proj.velocityX = Math.cos(angle) * 5;
            proj.velocityY = Math.sin(angle) * 5;
        } else {                                                                                                
            proj.velocityX = 0;                                                                                 // else shoot straight
            proj.velocityY = -8;
        }
    
        my.projectiles.push(proj);                                                                              // push projectile into projectiles array
    }
}

