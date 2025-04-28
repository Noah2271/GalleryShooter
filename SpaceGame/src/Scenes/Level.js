class Level extends Phaser.Scene {
    constructor() {
        super("Level");
        this.my = { sprite: {}, projectiles: [], enemies: []};
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("ship", "enemyGreen1.png");
        this.load.image("projectile", "numeralX.png");
        this.load.image("background", "black.png");
        this.load.image("enemy1", "playerShip2_red.png");
        this.load.image("enemy2", "playerShip1_red.png");
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

        // Create the player related text and sprites
        my.sprite.ship = this.add.sprite(500, 100, "ship");
        my.sprite.ship.setScale(0.5);

        my.scoreText = this.add.text(20, 20, "SCORE:" + my.score, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FFD700"});   // display player score
        my.healthText = this.add.text(my.sprite.ship.x - 80 , 20, "HEALTH:" + my.health, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});    // display player health
        my.waveText = this.add.text(this.game.config.width-200, 20, "WAVE:" + this.waveCount, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF2999"});    // display player health
        my.startText = this.add.text(this.game.config.width/3, this.game.config.height/2, "PRESS S TO START", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});    // display player health

        // Keyboard input
        my.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        my.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        my.RKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R); // R for Reset
        my.SKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S); // S for Start
        my.SPACEKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Array to track projectiles
        my.projectiles = [];

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
            delay: 1000,          // make it so after like, idk, 20 waves the game is able to be ended if all enemies are gone, stop spawning enemies after wave 20
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
        }
        
        if (Phaser.Input.Keyboard.JustDown(my.RKey) && this.gameEnded) {
            this.scene.restart();  // Restart the Level scene
        }
        
        if(!this.gameStarted || this.gameEnded) {
            return;
        }

        // Update background, player stats
        my.sprite.background.tilePositionY += 1;

        // Fire projectile
        if (Phaser.Input.Keyboard.JustDown(my.SPACEKey)) {
            const proj = this.add.sprite(my.sprite.ship.x, my.sprite.ship.y, "projectile");
            my.projectiles.push(proj);
        }

        my.projectiles = my.projectiles.filter(proj => {
            if (proj.y < this.game.config.height) {
                return true;
            } else {
                proj.destroy();
                return false;
            }
        });

        // Ship movement left
        if (my.AKey.isDown) {
            my.sprite.ship.x -= my.moveSpeed;
        }

        // Ship movement right
        if (my.DKey.isDown) {
            my.sprite.ship.x += my.moveSpeed;
        }

        // Clamp ship within screen bounds
        if (my.sprite.ship.x < 0) {
            my.sprite.ship.x = 0;
        }
        if (my.sprite.ship.x > 1000) {
            my.sprite.ship.x = 1000;
        }

        // Move all player projectiles downward
        for (let proj of this.my.projectiles) {
            if (proj.isEnemyProjectile) {
                if (proj.velocityX !== undefined && proj.velocityY !== undefined) {                                                                               // If following curve checked in enemyShootCheck(), shoot directly AT the player
                    proj.x += proj.velocityX;                                                                       
                    proj.y += proj.velocityY;
                } else {
                    proj.y -= 8;                                                                                                                                  // Error Catch
                }
            } else {
                proj.y += 10;                                                                                                                                     // Player projectiles move downward   
            }
        }
        // Enemy Bounds
        for(let enemy of this.my.enemies) {                                                                                                                       // Iterate through the enemies
            if (enemy.x < 0){                                                                                                                                     // if hit left boundary, change direction to the right and vice versa.
                enemy.direction = "right";
            }
            if (enemy.x > this.game.config.width){
                enemy.direction = "left";
            }
        }
        
        // Enemy Movement
        for (let enemy of this.my.enemies) {                                                                                                                      // constantly move enemies upscreen towards the player
            if (enemy.active) {  // Check that enemy still exists   
                enemy.y -= 0.5;     // Move enemy down the screen
                
                if (enemy.isFollowing || enemy.type === 2) {
                    let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.my.sprite.ship.x, this.my.sprite.ship.y);
                    enemy.rotation = angle + Phaser.Math.DegToRad(90);                                                                                            // If on the curve, then rotate enemy towards the player.
                }
            if (enemy.direction == "left" && enemy.y < this.game.config.height - 100){                                                                                                                       // Direction change to bounce off boundaries for enemies
                enemy.x -= 0.9;
                }
            if (enemy.direction == "right" && enemy.y < this.game.config.height - 100){
                enemy.x += 0.9;
                }
            }
        }
        // Enemy Removal
        my.enemies = my.enemies.filter(enemy => {
            if (enemy.y > 0) {                                                                                                                                    // if enemy passes the player and gets to the other side of the screen, remove their instance.
                return true;
            } else {
                enemy.destroy();
                return false;
            }
        });

        for (let proj of my.projectiles) {
            for (let enemy of my.enemies) {
                if (proj.active && enemy.active && Phaser.Geom.Intersects.RectangleToRectangle(proj.getBounds(), enemy.getBounds()) && !proj.isEnemyProjectile) {
                    enemy.hit = true;          // <-- just mark enemy hit
                    proj.destroy();            // destroy projectile immediately
                    my.score += 100;
                    my.scoreText.setText("SCORE:" + my.score);
                }
                if (proj.active && my.sprite.ship.active && Phaser.Geom.Intersects.RectangleToRectangle(proj.getBounds(), my.sprite.ship.getBounds()) && proj.isEnemyProjectile) {
                    my.health -= 1;
                    my.healthText.setText("HEALTH:" + my.health);
                    proj.destroy();
                }
            }
        }

        my.enemies = my.enemies.filter(enemy => {
            if (enemy.hit || enemy.y < 0) {
                enemy.destroy();
                return false;
            }
            return true;
        });
        
    }

startGame() {
    let my = this.my;
    this.gameStarted = true;
    }

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

endChecker() {
    let my = this.my
    if(my.health <= 0){
        this.gameEnded = true;
        my.endText = this.add.text(this.game.config.width/3, this.game.config.height/2, "GAME OVER", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.finalScoreText = this.add.text(this.game.config.width/3, (this.game.config.height/2) +30, "FINAL SCORE: " + my.score, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.resetText = this.add.text(this.game.config.width/3, (this.game.config.height/2) +60, "PRESS R TO RESET", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
    }
}

endGame() {
    let my = this.my

    if (this.waveCount == 10 && my.enemies.length === 0){
        this.gameEnded = true;
        my.winText = this.add.text(150, (this.game.config.height/2) - 30, "YOU HAVE SUCCESSFULLY SURVIVED THE RED FLEET", {fontFamily: "Silkscreen", fontSize: "20px", fill: "#7CFC00"});
        my.endText = this.add.text(this.game.config.width/3, this.game.config.height/2, "GAME OVER", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.finalScoreText = this.add.text(this.game.config.width/3, (this.game.config.height/2) +30, "FINAL SCORE: " + my.score, {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
        my.resetText = this.add.text(this.game.config.width/3, (this.game.config.height/2) +60, "PRESS R TO RESET", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});
    }
}

spawnEnemyRow() {
    let my = this.my;                                                                                   

    let startY = this.game.config.height + 0;                                                                                                                     // at bottom bounds, spawn 6-7 enemies with spacing of 100 pixels between
    let spacing = 100;
    let startX = 150;
    for (let i = 0; i < Phaser.Math.Between(5,8); i++) {
        if((Math.random() < 0.8) && this.gameStarted && !this.gameEnded && !(this.waveCount == 10)){
            let enemy = this.add.sprite(startX + i * spacing, startY, "enemy1");
            enemy.setScale(0.5);
            if(Math.random() < 0.5){
                enemy.direction = "left";   
            } else {
                enemy.direction = "right";
            }
            enemy.isFollowing = false;
            enemy.type = 1;                                                                                                                                            // track if on the curve 
            my.enemies.push(enemy);
        } else if (this.gameStarted && !this.gameEnded && !(this.waveCount == 10)) {
            let enemy = this.add.sprite(startX + i * spacing, startY, "enemy2");
            enemy.setScale(0.5);
            if(Math.random() < 0.5){
                enemy.direction = "left";   
            } else {
                enemy.direction = "right";
            }
            enemy.isFollowing = false;
            enemy.type = 2;                                                                                                                                            // track if on the curve 
            my.enemies.push(enemy);
        }                                                                                                                        // push to enemies array
    }
    if(this.waveCount != 10){
    this.waveCount += 1;
    my.waveText.setText("WAVE: " + this.waveCount); 
    }  
}

checkTracking() {
    let my = this.my;

    for (let enemy of my.enemies) {
        if (!enemy.isFollowing && enemy.active && this.gameStarted && !this.gameEnded) {
            // 30% chance to start tracking
            if (Math.random() < 0.2 && enemy.y > 400 && enemy.type === 1) {
                this.startTrackingEnemy(enemy);                                                                                                                   // call startTrackingEnemy if not too close to the player 20% of the time
            }
        }
    }
}

startTrackingEnemy(enemy) {                                                                                                                                       // Create 3 point curve using players position at time of calling, a random point on midpoint of the screen
        let my = this.my;                                                                                                                                         // and enemy position
    
        let startX = enemy.x;
        let startY = enemy.y;
    
        let midX = Phaser.Math.Between(100, 900);
        let midY = (startY + my.sprite.ship.y) / 2;
    
        let endX = my.sprite.ship.x + Phaser.Math.Between(-100, 100);
        let endY = my.sprite.ship.y - 200;
    
        let curve = new Phaser.Curves.Spline([                                                                                                                    
            startX, startY,
            midX, midY,
            endX, endY
        ]);
    
        // Turn into a follower!
        let follower = this.add.follower(curve, startX, startY, "enemy1");                                                                                        // destroy the old non tracking enemy and replace it with a tracking one.
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
    
        let index = my.enemies.indexOf(enemy);                                                                                                                     // replace old enemy
        if (index !== -1) {
            my.enemies[index] = follower;
        }
    }

enemyShootCheck() {
    let my = this.my;

    for (let enemy of my.enemies) {                                                                                                                               // if enemy is not too close to play, 50% chance to call shoot function
        if(enemy.active && enemy.y > this.game.config.height/3) {
            if (Math.random() < 0.5) {
                this.enemyShoot(enemy);
                }
            }
        }
    }

enemyTrackingShoot() {                                                                                                                                             // if enemy currently on curve, shoot faster
    let my = this.my;

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


    enemyShoot(enemy) {                                                                                                                                           // create projectile flagged as an enemis, if on curve calculate trajectory of the bullet to current player position using phaser math
        let my = this.my;
    
        const proj = this.add.sprite(enemy.x, enemy.y, "projectile");
        proj.setScale(0.5);
        proj.isEnemyProjectile = true;
    
        if (enemy.isFollowing || enemy.type === 2) {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, my.sprite.ship.x, my.sprite.ship.y);                                                              
            proj.velocityX = Math.cos(angle) * 5;
            proj.velocityY = Math.sin(angle) * 5;
        } else {                                                                                                                                                 // else treat bullet as usual
            proj.velocityX = 0;
            proj.velocityY = -8;
        }
    
        my.projectiles.push(proj);
    }
}

