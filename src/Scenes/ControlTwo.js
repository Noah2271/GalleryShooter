class ControlTwo extends Phaser.Scene {
    constructor() {
        super("ControlTwo");
        this.my = { sprite: {}, projectiles: [], enemies: []};
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio("click", "click.mp3");
    }

    create() {
        let my = this.my;
        my.complete = false;
        my.once = true;

        my.sprite.background = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, "background");            // create tile sprites using black.png starting at 0,0 to the width and height borders
        my.sprite.background.setOrigin(0,0);     
        
        // player variables
        my.moveSpeed = 4;
        
        // create player sprite
        my.sprite.ship = this.add.sprite(500, 100, "ship");
        my.sprite.ship.setScale(0.5);
        
        // player control keys
        my.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        my.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        my.MKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        my.NKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
        my.SPACEKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // tutorial text
        my.tutorialText = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+40, "Press SPACE to shoot!", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});
        my.tutorialText = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+80, "In game, shooting takes away 5 points! Accuracy = higher score!", {fontFamily: "Silkscreen", fontSize: "15px", fill: "#FFFF00"});

    }
    update() {
        let my = this.my;

        if (my.AKey.isDown) {                               // Player ship movement
            my.sprite.ship.x -= my.moveSpeed;
        }

        if (my.DKey.isDown) {
            my.sprite.ship.x += my.moveSpeed;
        }

        if (Phaser.Input.Keyboard.JustDown(my.SPACEKey)) {
            const proj = this.add.sprite(my.sprite.ship.x, my.sprite.ship.y, "playerprojectile");
            proj.setScale(0.1);
            my.projectiles.push(proj);
            my.complete = true;
            this.sound.play("regularfire", {
                volume: 0.3                                 // space shooting handling from Level.js, but if used set complete to true to end the tutorial
            });
        }

        if(my.complete === true && my.once !== false){
            my.tutorialTextComplete = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+120, "Good Job!", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});
            my.tutorialTextComplete = this.add.text(20, (this.game.config.height-50), "PRESS M: Return to Menu | Press N: Next control", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});

            my.once = false;
        }
        // player screen change options
        if(my.complete === true){
            if(Phaser.Input.Keyboard.JustDown(my.MKey)) {
                this.sound.play("click", {
                    volume: 0.3   
                });
                this.scene.start("LoadOn");
            }
            if(Phaser.Input.Keyboard.JustDown(my.NKey)) {
                this.sound.play("click", {
                    volume: 0.3   
                });
                this.scene.start("ControlThree");
            }
        }

        my.sprite.background.tilePositionY += 1;            // scroll the background

        my.projectiles = my.projectiles.filter(proj => {    // if projectile offscreen, remove it from the projectile array
            if (proj.y < this.game.config.height || proj.y > 0) {
                return true;
            } else {
                proj.destroy();
                return false;
            }
        });

        // Projectile Handling
        for (let proj of this.my.projectiles) {
            if (proj.isEnemyProjectile) {
                if (proj.velocityX !== undefined && proj.velocityY !== undefined) {         // If following curve checked in enemyShootCheck(), shoot directly AT the player (NOT USED HERE)
                    proj.x += proj.velocityX;                                                                       
                    proj.y += proj.velocityY;
                } else {
                    proj.y -= 8;                                                            // Default speed to fallback on
                }
            } else {
                proj.y += 10;                                                               // Player projectiles move downward, enemy projectiles move based on velocity given by enemy  
            }
        }
    }
}    