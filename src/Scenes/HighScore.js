class HighScore extends Phaser.Scene {
    constructor() {
        super("HighScore");
        this.my = { sprite: {}, projectiles: [], enemies: []};
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio("click", "click.mp3");
    }

    create() {
        let my = this.my;

        my.sprite.background = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, "background");                                                                                                // create tile sprites using black.png starting at 0,0 to the width and height borders
        my.sprite.background.setOrigin(0,0);     

        // player input
        my.MKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

        my.creditHeader= this.add.text((this.game.config.width/4) - 140, (this.game.config.height/2)-200, "HIGHSCORES", {fontFamily: "Silkscreen", fontSize: "40px", fill: "#FFFF00"});
        // screen text
        let highScore1 = localStorage.getItem("highscore_Level");                                                                                                                                                       // retrieve the scores for levels 
        let highScore2 = localStorage.getItem("highscore_LevelDos");                                                                                                                                                    // https://rexrainbow.github.io/phaser3-rex-notes/docs/site/localstorage/ 
        this.add.text((this.game.config.width/4) - 140, (this.game.config.height/2)+40, "Highest Score | RED FLEET: " + (highScore1 || 0), {fontFamily: "Silkscreen", fontSize: "32px", fill: "#FF0000"});
        this.add.text((this.game.config.width/4) - 140, (this.game.config.height/2)+80, "Highest Score | BLUE FLEET: " + (highScore2 || 0), {fontFamily: "Silkscreen", fontSize: "32px", fill: "#ADD8E6"});
        my.returnText = this.add.text(20, (this.game.config.height-50), "PRESS M: Return to Menu", {fontFamily: "Silkscreen", fontSize: "25px", fill: "#FFFF00"});                                                      

    }
    update() {
        let my = this.my;
        // let player go back to the menu screen
            if(Phaser.Input.Keyboard.JustDown(my.MKey)) {
                this.sound.play("click", {
                    volume: 0.3   // Can adjust volume using this, goes from 0 to 1
                });
                this.scene.start("LoadOn");
            }
        
        my.sprite.background.tilePositionY += 1;                                                                                                                                                                        // scroll the background
    }
}    