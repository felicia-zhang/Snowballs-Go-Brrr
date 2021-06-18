import { PhaserGame } from "./components/phaser";
import React from "react";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import { Button, ChakraProvider, Divider, Flex, HStack, Input, Link, Spacer, VStack } from "@chakra-ui/react";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import { PlayFabClient } from "playfab-sdk";
import { fontFamily, normalFontSize } from "./utils/font";

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
				<div
					style={{
						position: "absolute",
						left: 287.5,
						width: "225",
						top: "200px",
					}}>
					{this.state.isSignedIn ? null : (
						<VStack>
							{this.state.isRegistering ? (
								<Input
									fontFamily={fontFamily}
									fontSize={normalFontSize}
									color="white"
									size="md"
									placeholder="Email"
									onChange={e => {
										this.setState({ email: e.target.value });
									}}
								/>
							) : null}
							<Input
								fontFamily={fontFamily}
								fontSize={normalFontSize}
								color="white"
								size="md"
								placeholder="Username"
								onChange={e => {
									this.setState({ username: e.target.value });
								}}
							/>
							<Input
								fontFamily={fontFamily}
								fontSize={normalFontSize}
								color="white"
								size="md"
								type="password"
								placeholder="Enter password"
								onChange={e => {
									this.setState({ password: e.target.value });
								}}
							/>
							{this.state.isRegistering ? (
								<Flex width={225}>
									<Link
										fontFamily={fontFamily}
										fontSize={normalFontSize}
										color="white"
										onClick={() => this.setState({ isRegistering: false })}>
										Sign in
									</Link>
									<Spacer />
									<Button
										fontFamily={fontFamily}
										fontSize={normalFontSize}
										colorScheme="whiteAlpha"
										onClick={this.registerWithPlayFab}>
										Register
									</Button>
								</Flex>
							) : (
								<Flex width={225}>
									<Link
										fontFamily={fontFamily}
										fontSize={normalFontSize}
										color="white"
										onClick={() => this.setState({ isRegistering: true })}>
										Register
									</Link>
									<Spacer />
									<Button
										fontFamily={fontFamily}
										fontSize={normalFontSize}
										colorScheme="whiteAlpha"
										onClick={this.signInWithPlayFab}>
										Sign in
									</Button>
								</Flex>
							)}
							<Divider />
							<GoogleLogin
								clientId={process.env.REACT_APP_GOOGLE_ID}
								render={renderProps => (
									<Button
										width={225}
										fontFamily={fontFamily}
										fontSize={normalFontSize}
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
										width={225}
										fontFamily={fontFamily}
										fontSize={normalFontSize}
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
