import GameScene from "../components/game";

export default class Igloo extends Phaser.GameObjects.Sprite {
    level: number
    totalLevel: number

    constructor(scene: GameScene, x, y, level, totalLevel) {
      super(scene, x, y, 'igloo');
      this.level = level
      this.totalLevel = totalLevel
    }
  }