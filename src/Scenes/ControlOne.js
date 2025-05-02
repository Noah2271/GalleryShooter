class ControlOne extends Phaser.Scene {
    constructor() {
        super("ControlOne");
        this.my = { sprite: {}, projectiles: [], enemies: []};
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio("click", "click.mp3");
    }

    create() {
        let my = this.my;
        my.moved = false;
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

        // tutorial text
        my.tutorialText = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+40, "PRESS A TO MOVE RIGHT, D TO MOVE LEFT!", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});

    }
    update() {
        let my = this.my;

                                                            // Boundaries for player
        if (my.sprite.ship.x < 0) {
            my.sprite.ship.x = 0;
        }
        if (my.sprite.ship.x > 1000) {
            my.sprite.ship.x = 1000;
        }


        if (my.AKey.isDown) {                               // Player ship movement, if used set the move/complete flag to true
            my.sprite.ship.x -= my.moveSpeed;
            my.moved = true;
        }

        if (my.DKey.isDown) {
            my.sprite.ship.x += my.moveSpeed;
            my.moved = true;
        }
        // end state
        if(my.moved === true && my.once !== false){         // display special text if tutorial task complete
            my.tutorialTextComplete = this.add.text((this.game.config.width/3) - 140, (this.game.config.height/2)+70, "Good Job!", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});          
            my.tutorialTextComplete = this.add.text(20, (this.game.config.height-50), "PRESS M: Return to Menu | Press N: Next control", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});

            my.once = false;
        }
        // player screen change options
        if(my.moved === true){
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
                this.scene.start("ControlTwo");
            }
        }

        my.sprite.background.tilePositionY += 1;            // scroll the background
    }
}    

