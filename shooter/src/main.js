// Jim Whitehead
// Created: 4/14/2024
// Phaser: 3.70.0
//
// Cubey
//
// An example of putting sprites on the screen using Phaser
// 
// Art assets from Kenny Assets "Shape Characters" set:
// https://kenney.nl/assets/shape-characters

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 1000,
    height: 800,
<<<<<<< HEAD:GalleryShooter-main/GalleryShooter-main/SpaceGame/src/main.js
    scene: [LoadOn, LevelDos, Level],
=======
    scene: [LoadOn, Level],
>>>>>>> d3f4ddc4dd47b6f11bc7fcb3a23e1fc41fb06df1:SpaceGame/src/main.js
    fps: { forceSetTimeOut: true, target: 60 }
}

// Global variable to hold sprites
var my = {sprite: {}};

const game = new Phaser.Game(config);
