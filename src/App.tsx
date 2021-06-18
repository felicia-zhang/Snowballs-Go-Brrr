import { PhaserGame } from "./components/phaser";
import React from "react";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import { Button, ChakraProvider, Divider, HStack, Input, Link, VStack } from "@chakra-ui/react";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import { PlayFabClient } from "playfab-sdk";

interface IState {
	game: PhaserGame;
	isSignedIn: boolean;
	isRegistering: boolean;
	email: string;
	username: string;
	password: string;
}

class App extends React.PureComponent<any, IState> {
	constructor(props: any) {
		super(props);
		this.state = {
			game: null,
			isSignedIn: false,
			isRegistering: false,
			email: "",
			username: "",
			password: "",
		};
	}

	componentDidMount() {
		this.setState({
			game: new PhaserGame(),
			isSignedIn: PlayFabClient.IsClientLoggedIn(),
		});
	}

	componentWillUnmount() {
		this.state.game.destroy(true);
	}

	handlePlayFab = (success: boolean) => {
		this.setState({
			isSignedIn: success,
		});
	};

	signInWithPlayFab = () => {
		this.state.game.signInWithPlayFab(this.state.username, this.state.password, this.handlePlayFab);
	};

	registerWithPlayFab = () => {
		this.state.game.registerWithPlayFab(
			this.state.email,
			this.state.username,
			this.state.password,
			this.handlePlayFab
		);
	};

	onGoogleSuccess = (response: GoogleLoginResponse) => {
		this.setState({
			isSignedIn: true,
		});
		this.state.game.signInWithGoogle(response.accessToken, response.getBasicProfile().getName());
	};

	onGoogleFailure = (error: any) => {
		console.log("Something went wrong", error);
	};

	onFacebookSignin = response => {
		this.setState({
			isSignedIn: true,
		});
		this.state.game.signInWithFacebook(response.accessToken, response.name);
	};

	render() {
		return (
			<ChakraProvider>
				<div style={{ position: "absolute", left: "300px", top: "200px" }}>
					{this.state.isSignedIn ? null : (
						<VStack>
							{this.state.isRegistering ? (
								<Input
									fontFamily="Didact Gothic"
									color="white"
									size="md"
									placeholder="Email"
									onChange={e => {
										this.setState({ email: e.target.value });
									}}
								/>
							) : null}
							<Input
								fontFamily="Didact Gothic"
								color="white"
								size="md"
								placeholder="Username"
								onChange={e => {
									this.setState({ username: e.target.value });
								}}
							/>
							<Input
								fontFamily="Didact Gothic"
								color="white"
								size="md"
								type="password"
								placeholder="Enter password"
								onChange={e => {
									this.setState({ password: e.target.value });
								}}
							/>
							{this.state.isRegistering ? (
								<HStack>
									<Button fontFamily="Didact Gothic" onClick={this.registerWithPlayFab}>
										Register With PlayFab
									</Button>
									<Link
										fontFamily="Didact Gothic"
										color="white"
										onClick={() => this.setState({ isRegistering: false })}>
										Sign in
									</Link>
								</HStack>
							) : (
								<HStack>
									<Button fontFamily="Didact Gothic" onClick={this.signInWithPlayFab}>
										Sign in With PlayFab
									</Button>
									<Link
										fontFamily="Didact Gothic"
										color="white"
										onClick={() => this.setState({ isRegistering: true })}>
										Register
									</Link>
								</HStack>
							)}
							<Divider />
							<GoogleLogin
								clientId={process.env.REACT_APP_GOOGLE_ID}
								render={renderProps => (
									<Button
										fontFamily="Didact Gothic"
										onClick={renderProps.onClick}
										leftIcon={<FaGoogle />}>
										Sign in with Google
									</Button>
								)}
								buttonText="Login"
								onSuccess={this.onGoogleSuccess}
								onFailure={this.onGoogleFailure}
								isSignedIn={this.state.isSignedIn}
								cookiePolicy={"single_host_origin"}
							/>
							<FacebookLogin
								appId={process.env.REACT_APP_FACEBOOK_ID}
								autoLoad={true}
								render={renderProps => (
									<Button
										fontFamily="Didact Gothic"
										onClick={renderProps.onClick}
										leftIcon={<FaFacebook />}>
										Sign in with Facebook
									</Button>
								)}
								callback={this.onFacebookSignin}
							/>
						</VStack>
					)}
				</div>
			</ChakraProvider>
		);
	}
}

export default App;
