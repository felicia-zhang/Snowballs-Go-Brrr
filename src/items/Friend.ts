import GameScene from "../components/game";

export default class Friend extends Phaser.GameObjects.Sprite {
    level: number
    totalLevel: number

    constructor(scene: GameScene, x, y, level, totalLevel) {
      super(scene, x, y, 'penguin3');
      this.level = level
      this.totalLevel = totalLevel
      scene.friendsMultiplier += level

      this.anims.create({
        key: 'bounce',
        frames: [
            { key: 'penguin3' },
            { key: 'penguin2' },
            { key: 'penguin1' },
            { key: 'penguin2' }
        ],
        frameRate: 8,
        repeat: -1
    });
    this.anims.play('bounce');
    }
  }