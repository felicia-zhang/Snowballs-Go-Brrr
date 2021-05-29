import { PhaserGame } from "./components/phaser";
import React from 'react';

class App extends React.PureComponent {
constructor(props) {
  super(props)
}

componentDidMount() {
  var game = new PhaserGame();
}

  render() {
    return (
      <></>
    );
  }
}

export default App;
