class ControlThree extends Phaser.Scene {
    constructor() {
        super("ControlThree");
        this.my = { sprite: {}, projectiles: [], enemies: []};
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio("click", "click.mp3");
    }

    create() {
        let my = this.my;
        // Player variables
        my.moveSpeed = 4;
        my.health = 999;
        my.once = false;
        my.complete = false;

        // Background creation
        my.sprite.background = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, "background");            // create tile sprites using black.png starting at 0,0 to the width and height borders
        my.sprite.background.setOrigin(0,0);                                                                                        //https://docs.phaser.io/api-documentation/class/gameobjects-tilesprite

        // create player sprites
        my.sprite.ship = this.add.sprite(500, 100, "ship");
        my.sprite.ship.setScale(0.5);

        my.tutorialText = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+40, "Use what you learned to shoot the enemy!", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});
        my.tutorialText = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+70, "IT WILL SHOOT BACK AT YOU!", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});

        // player control keys
        my.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        my.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        my.MKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        my.SPACEKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // enemy spawn
        this.time.addEvent({
            delay: 2000, 
            callback: this.spawnEnemySingular,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 2000,
            callback: this.enemyShootCheck,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        let my = this.my;
        // player screen change options if tutorial complete
        if (my.complete == true && my.once == false){
            my.tutorialTextComplete = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+100, "Good Job! THIS CONCLUDES THE TUTORIAL!", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});
            my.tutorialTextComplete = this.add.text(20, (this.game.config.height-50), "PRESS M: Return to Menu", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});
            my.once = true;
        }
        if(my.complete == true){
            if (Phaser.Input.Keyboard.JustDown(my.MKey)) {
                my.complete = false;
                my.once = false;
                this.sound.play("click", {
                    volume: 0.3   
                });
                this.scene.start("LoadOn");
        }
    }

        my.sprite.background.tilePositionY += 1;

        // Player controls
        if (Phaser.Input.Keyboard.JustDown(my.SPACEKey)) {
            const proj = this.add.sprite(my.sprite.ship.x, my.sprite.ship.y, "playerprojectile");
            proj.setScale(0.1);
            my.projectiles.push(proj);
            this.sound.play("regularfire", {
                volume: 0.3   
            });
        }

        my.projectiles = my.projectiles.filter(proj => {                                    // If projectile offscreen, remove it from the projectile array
            if (proj.y < this.game.config.height || proj.y > 0) {
                return true;
            } else {
                proj.destroy();
                return false;
            }
        });

        if (my.AKey.isDown) {                                                               // Player ship movement
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
        

        for (let enemy of this.my.enemies) {                                                // removed enemy moving towards the player for the tutorial
            if (enemy.active) {  
                
            if (enemy.isFollowing || enemy.type === 2) {
                    let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.my.sprite.ship.x, this.my.sprite.ship.y);  
                    enemy.rotation = angle + Phaser.Math.DegToRad(90);                      // If on the curve, then rotate enemy towards the player. (NOT USED HERE)
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
                    this.sound.play("death", {
                        volume: 0.3   // Can adjust volume using this, goes from 0 to 1
                    });
                    this.boom = this.add.sprite(enemy.x, enemy.y, "explode1").setScale(0.25).play("explosion");
                    if(my.once !== true){                                                   // for the first enemy shot, said tutorial complete flag to true
                        my.complete = true;
                    }
                }
                if (proj.active && my.sprite.ship.active && Phaser.Geom.Intersects.RectangleToRectangle(proj.getBounds(), my.sprite.ship.getBounds()) && proj.isEnemyProjectile) {
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
            if (enemy.hit || enemy.y < 0) {
                enemy.destroy();
                return false;
            }
            return true;
        });
        
    }

// other game functions
// function to spawn a single enemy
spawnEnemySingular() {
    let my = this.my;                                                                                   

    let startY = 600;                                                                                           // spawn a single enemy if enemy not on screen (player shot it).
    let startX = 200;
    if(my.enemies.length == 0){                                                
        if((Math.random() < 0.8)){                                                                              // 20% of enemies in the line will be type II, the other 80% type I
            let enemy = this.add.sprite(startX , startY, "enemy1");                                             // creating of enemy type 1
            enemy.setScale(0.5);
            if(Math.random() < 0.5){                                                                            // randomize enemy direction which the line splits into after y position specified in update()
                enemy.direction = "left";   
            } else {
                enemy.direction = "right";
            }
            enemy.isFollowing = false;                                                                          // flag for if the enemy is on the curve
            enemy.type = 1;                                                                                     // flag enemy type for different characteristics
            my.enemies.push(enemy);
        }                                                                                                       // push to enemies array
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