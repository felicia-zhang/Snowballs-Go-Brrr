import Phaser from 'phaser'; 
import Controller from './controller'

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600
};

export class PhaserGame extends Phaser.Game {
    constructor() {
        super(config);
        this.scene.add('Controller', new Controller());
        this.scene.start('Controller');
    }
}