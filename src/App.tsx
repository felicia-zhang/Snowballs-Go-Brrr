import { PhaserGame } from "./components/phaser";
import React from "react";
import { PlayFab, PlayFabClient } from "playfab-sdk";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";

interface IState {
	game: PhaserGame;
	isGoogleSignedIn: boolean;
}

class App extends React.PureComponent<any, IState> {
	constructor(props: any) {
		super(props);

		this.state = {
			game: null,
			isGoogleSignedIn: false,
		};
	}

	componentDidMount() {
		this.setState({
			game: new PhaserGame(),
		});
	}

	componentWillUnmount() {
		this.state.game.destroy(true);
	}

	private onGoogleSuccess = (a: GoogleLoginResponse) => {
		this.setState({
			isGoogleSignedIn: true,
		});
		this.state.game.signIn(a.accessToken);
	};

	private onGoogleFailure(a: any) {
		console.log("Something went wrong", a);
	}

	render() {
		return (
			<div style={{ position: "absolute", left: "300px", top: "400px" }}>
				<GoogleLogin
					clientId="168518881059-39uvi2d24ev5rjscb6go5q4cljni1tgd.apps.googleusercontent.com"
					buttonText="Sign in with Google"
					onSuccess={this.onGoogleSuccess}
					onFailure={this.onGoogleFailure}
					cookiePolicy={"single_host_origin"}
					isSignedIn={this.state.isGoogleSignedIn}
				/>
			</div>
		);
	}
}

export default App;
