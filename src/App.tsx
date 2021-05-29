import { Game } from "./game";
import React from 'react';

class App extends React.PureComponent {
  game;
constructor(props) {
  super(props)
  this.game = new Game();
}

  render() {
    return (
      <></>
    );
  }
}

export default App;
