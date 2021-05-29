import { PhaserGame } from "./components/phaser";
import React from 'react';

class App extends React.PureComponent {
  game;
constructor(props) {
  super(props)
  this.game = new PhaserGame();
}

  render() {
    return (
      <></>
    );
  }
}

export default App;
