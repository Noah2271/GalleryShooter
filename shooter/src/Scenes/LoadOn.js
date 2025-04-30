class LoadOn extends Phaser.Scene {
    constructor() {
        super("LoadOn");
        this.my = { sprite: {}, projectiles: [], enemies: []};
    }
    
    preload() {
        this.load.setPath("./assets/");
        this.load.image("ship", "enemyGreen1.png");
        this.load.image("enemy1", "playerShip2_red.png");
        this.load.image("enemy2", "playerShip1_red.png");
        this.load.image("enemy3", "enemyBlue2.png");
        this.load.image("enemy4", "enemyBlue3.png");
        this.load.image("enemy5", "enemyBlue4.png");
        this.load.image("projectile", "numeralX.png");
        this.load.image("background", "black.png");
        this.load.image("explode1", "scorch_01.png");
        this.load.image("explode2", "scorch_02.png");
        this.load.image("explode3", "scorch_03.png");
        this.load.audio("death", "explosionCrunch_000.ogg");
        this.load.audio("regularfire", "laserSmall_001.ogg");
        this.load.audio("click", "confirmation_004.ogg")
        this.load.image("specialprojectile", "light_03.png");
        this.load.image("playerprojectile", "trace_06.png");
    }

create() {
    let my = this.my;
    // Player variables
    my.moveSpeed = 4;
    my.direction = "left";

    // Background creation

    this.anims.create({
        key: "explosion",
        frames: [
            { key: "explode1" },
            { key: "explode2" },
            { key: "explode3" },
        ],
        frameRate: 20,    // Note: case sensitive (thank you Ivy!)
        repeat: 5,
        hideOnComplete: true
    });

    my.sprite.background = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, "background");            // create tile sprites using black.png starting at 0,0 to the width and height borders
    my.sprite.background.setOrigin(0,0);                                                                                        //https://docs.phaser.io/api-documentation/class/gameobjects-tilesprite

    // Create the player related text and sprites
    my.sprite.ship = this.add.sprite(500, 100, "ship");
    my.sprite.ship.setScale(0.5);

    my.startText1 = this.add.text((this.game.config.width/3) - 140, this.game.config.height/3, "GALAXY SHOOTER!", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FFFF00"});    // display player health
    my.startText2 = this.add.text((this.game.config.width/3) - 140, this.game.config.height/2, "PRESS 1: LEVEL ONE: RED FLEET", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FF0000"});    // display player health
    my.startText3 = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+40, "PRESS 2: LEVEL TWO: BLUE FLEET", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#ADD8E6"});    // display player health
    my.startText5 = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+120, "Press T: CONTROLS TUTORIAL", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FFFF00"});
    my.startText6 = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+160, "Press H: HIGHSCORES", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FFFF00"});  
    my.startText7 = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+200, "Press C: CREDITS", {fontFamily: "Silkscreen", fontSize: "35px", fill: "#FFFF00"});  
    // Keyboard input
    my.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    my.twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    my.tKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    my.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    my.hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);


    // Array to track projectiles
    my.projectiles = [];

    // enemy spawn
    this.time.addEvent({
        delay: 10000, callback: this.spawnEnemyRow,
        callbackScope: this,
        loop: true
    });

    this.time.addEvent({
        delay: 100, callback: this.titleScreenMove,
        callbackScope: this,
        loop: true
    });

    this.time.addEvent({
        delay: 1000, callback: this.titlePlayerShoot,
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
        delay: 5000,
        callback: this.checkTracking,
        callbackScope: this,
        loop: true
    });

    }

    update() {
        let my = this.my;

        if (Phaser.Input.Keyboard.JustDown(my.oneKey)) {
            this.sound.play("click", {
                volume: 0.3   // Can adjust volume using this, goes from 0 to 1
            });
            this.scene.start("Level");
        }

        if(Phaser.Input.Keyboard.JustDown(my.twoKey)) {
            this.sound.play("click", {
                volume: 0.3   // Can adjust volume using this, goes from 0 to 1
            });
            this.scene.start("LevelDos");
        }

        if(Phaser.Input.Keyboard.JustDown(my.tKey)) {
            this.sound.play("click", {
                volume: 0.3   // Can adjust volume using this, goes from 0 to 1
            });
            this.scene.start("ControlOne");
        }

        if(Phaser.Input.Keyboard.JustDown(my.cKey)) {
            this.sound.play("click", {
                volume: 0.3   // Can adjust volume using this, goes from 0 to 1
            });
            this.scene.start("Credits");
        }

        if(Phaser.Input.Keyboard.JustDown(my.hKey)) {
            this.sound.play("click", {
                volume: 0.3   // Can adjust volume using this, goes from 0 to 1
            });
            this.scene.start("HighScore");
        }



        //background movement
        my.sprite.background.tilePositionY += 1;

        // Player controls

        for(let enemy of this.my.enemies) {                                                 // Iterate through the enemies
            if (enemy.x < 0){                                                               // if hit left boundary, change direction to the right and vice versa.
                enemy.direction = "right";
            }
            if (enemy.x > this.game.config.width){
                enemy.direction = "left";
            }
        }

        if(my.direction == "left"){
            my.sprite.ship.x -= my.moveSpeed;
        } else if (my.direction == "right") {
            my.sprite.ship.x += my.moveSpeed;
        }
        if(my.sprite.ship.x == 0 || my.sprite.ship.x == this.game.config.width){
            my.moveSpeed = 0;
        }

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

        my.projectiles = my.projectiles.filter(proj => {    // If projectile offscreen, remove it from the projectile array
            if (proj.y < this.game.config.height || proj.y > 0) {
                return true;
            } else {
                proj.destroy();
                return false;
            }
        });
        

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

    }
    spawnEnemyRow() {
        let my = this.my;                                                                                   
    
        let startY = this.game.config.height + 0;                                                                   // at bottom bounds, spawn 5-8 enemies with spacing of 100 pixels between
        let spacing = 100;
        let startX = 200;
        for (let i = 0; i < Phaser.Math.Between(5,8); i++) {                                                        
            if((Math.random() < 0.8)){            // 20% of enemies in the line will be type II, the other 80% type I
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
            } else {                            // creating of enemy type 2
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
        }  

    titleScreenMove() {
        let my = this.my;
        let halfWidth = my.sprite.ship.displayWidth / 2;  
    
        // Correct the direction if about to go off-screen
        if (my.sprite.ship.x - halfWidth <= 0) {
            my.sprite.ship.x = halfWidth;    // Snap exactly to the edge
            my.direction = "right";
        } 
        else if (my.sprite.ship.x + halfWidth >= this.game.config.width) {
            my.sprite.ship.x = this.game.config.width - halfWidth;
            my.direction = "left";
        } 
        else {
            // 20% chance to randomly change direction each second
            if (Math.random() < 0.2) {   
                if (Math.random() < 0.5) {
                    my.direction = "left";
                } else {
                    my.direction = "right";
                }
            }
        }
    
        // Actually move the ship
        if (my.direction == "left") {
            my.sprite.ship.x -= 1;
        } else if (my.direction == "right") {
            my.sprite.ship.x += 1;
        }

        // Enemy / Player Hit Handling
        for (let proj of my.projectiles) {                                                  // Iterate through projectiles and enemies. If enemy is hit by player projectile destroy sprite
            for (let enemy of my.enemies) {                                                 // mark as hit, and then add to score before setting it.
                if (proj.active && enemy.active && Phaser.Geom.Intersects.RectangleToRectangle(proj.getBounds(), enemy.getBounds()) && !proj.isEnemyProjectile) {
                    this.boom = this.add.sprite(enemy.x, enemy.y, "explode1").setScale(0.25).play("explosion");
                    this.sound.play("death", {
                        volume: 0.3   // Can adjust volume using this, goes from 0 to 1
                    });
                    enemy.hit = true;          
                    proj.destroy();            
                }
                if (proj.active && my.sprite.ship.active && Phaser.Geom.Intersects.RectangleToRectangle(proj.getBounds(), my.sprite.ship.getBounds()) && proj.isEnemyProjectile) {
                    proj.destroy();
                    this.sound.play("death", {
                        volume: 0.3   // Can adjust volume using this, goes from 0 to 1
                    });
                }                                                                           // both instances remove the projectile.
            }
        }

        my.enemies = my.enemies.filter(enemy => {                                           // if enemy is hit or past the player, remove from array and destroy the sprite                                   
            if (enemy.hit || enemy.y < 0) {
                enemy.destroy();
                return false;
            }
            return true;
        });
    }

    titlePlayerShoot() { 
        let my = this.my;
    
        const proj = this.add.sprite(my.sprite.ship.x, my.sprite.ship.y, "playerprojectile");                      // create projectile
        proj.setScale(0.1);
        proj.isEnemyProjectile = false;                                                                                              
        proj.velocityX = 0;                                                                                 // else shoot straight
        proj.velocityY = 8;
        my.projectiles.push(proj);
        this.sound.play("regularfire", {
            volume: 0.3   // Can adjust volume using this, goes from 0 to 1
        });    
        }
     
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
    // function to start enemy on a curve
checkTracking() {
    let my = this.my;

    for (let enemy of my.enemies) {                                                                             // iterate through all enemies on screen. If game still going and enemy not
        if (!enemy.isFollowing && enemy.active) {                        // currently following, then 20% chance of calling startTrackingEnemy()
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
}

    

