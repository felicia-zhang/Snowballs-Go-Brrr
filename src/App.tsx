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

		PlayFab.settings.titleId = "7343B";
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
		console.log("Google success?", a);
		PlayFabClient.LoginWithGoogleAccount(
			{
				ServerAuthCode: a.accessToken,
				CreateAccount: true,
			},
			(a, b) => {
				console.log("Callback", a, b);
				this.onPlayFabResponse(a, b);
			}
		);
	};

	private onPlayFabResponse(response, error) {
		// testing to see if below api call works
		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (r, e) => console.log(r, e));
	}

	private onGoogleFailure(a: any) {
		console.log("Something went wrong", a);
	}

	render() {
		return (
			<div>
				<GoogleLogin
					clientId="168518881059-39uvi2d24ev5rjscb6go5q4cljni1tgd.apps.googleusercontent.com"
					buttonText="Login"
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
