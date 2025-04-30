class Credits extends Phaser.Scene {
    constructor() {
        super("Credits");
        this.my = { sprite: {}, projectiles: [], enemies: []};
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio("click", "click.mp3");
    }

    create() {
        let my = this.my;

        my.sprite.background = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, "background");            // create tile sprites using black.png starting at 0,0 to the width and height borders
        my.sprite.background.setOrigin(0,0);                                                                                          

        // player input 
        my.MKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

        // credit text
        my.creditHeader= this.add.text((this.game.config.width/4) - 140, (this.game.config.height/2)-200, "CREDITS", {fontFamily: "Silkscreen", fontSize: "40px", fill: "#FFFF00"});
        my.creditText1 = this.add.text((this.game.config.width/4) - 140, (this.game.config.height/2)+40, "Assets: KenneyNL : https://kenney.nl/assets", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});
        my.creditText2 = this.add.text((this.game.config.width/4) - 140, (this.game.config.height/2)+80, "Created By: Noah Billedo : CMPM 120 Assignment", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});
        my.returnText = this.add.text(20, (this.game.config.height-50), "PRESS M: Return to Menu", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});

    }
    update() {
        let my = this.my;
        // allow player to go back to the menu screen
            if(Phaser.Input.Keyboard.JustDown(my.MKey)) {
                this.sound.play("click", {
                    volume: 0.3   
                });
                this.scene.start("LoadOn");
            }
        
        my.sprite.background.tilePositionY += 1;                                                                                    // scroll the background
    }
}    

