import Phaser from 'phaser';
import Controller from './controller'
import InputTextPlugin from 'phaser3-rex-plugins/plugins/inputtext-plugin.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-container',
    dom: {
        createContainer: true
    },
    plugins: {
        global: [{
            key: 'rexInputText',
            plugin: InputTextPlugin,
            start: true
        }]
    }
};

export class PhaserGame extends Phaser.Game {
    constructor() {
        super(config);
        this.scene.add('Controller', new Controller());
        this.scene.start('Controller');
    }
}