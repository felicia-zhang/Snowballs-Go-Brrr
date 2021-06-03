import { PhaserGame } from "./components/phaser";
import React from "react";
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

	private onGoogleSuccess = (response: GoogleLoginResponse) => {
		this.setState({
			isGoogleSignedIn: true,
		});
		this.state.game.signIn(response.accessToken);
	};

	private onGoogleFailure(error: any) {
		console.log("Something went wrong", error);
	}

	render() {
		return (
			<div className="sign_in_buttons" style={{ position: "absolute", left: "300px", top: "400px" }}>
				{this.state.isGoogleSignedIn ? null : (
					<GoogleLogin
						clientId="168518881059-39uvi2d24ev5rjscb6go5q4cljni1tgd.apps.googleusercontent.com"
						buttonText="Sign in with Google"
						onSuccess={this.onGoogleSuccess}
						onFailure={this.onGoogleFailure}
						cookiePolicy={"single_host_origin"}
						isSignedIn={this.state.isGoogleSignedIn}
					/>
				)}
			</div>
		);
	}
}

export default App;
