import { PhaserGame } from "./components/phaser";
import React from "react";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import { Button, ChakraProvider, Input, InputGroup, Link, VStack } from "@chakra-ui/react";
import { FaFacebook, FaGoogle } from "react-icons/fa";

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
		this.state.game.registerWithPlayFab(this.state.username, this.state.password);
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
									color="white"
									size="md"
									placeholder="Email"
									onChange={e => {
										this.setState({ email: e.target.value });
									}}
								/>
							) : null}
							<Input
								color="white"
								size="md"
								placeholder="Username"
								onChange={e => {
									this.setState({ username: e.target.value });
								}}
							/>
							<Input
								color="white"
								size="md"
								type="password"
								placeholder="Enter password"
								onChange={e => {
									this.setState({ password: e.target.value });
								}}
							/>
							{this.state.isRegistering ? (
								<>
									<Button onClick={this.registerWithPlayFab}>Register</Button>
									<Link onClick={() => this.setState({ isRegistering: false })}>Sign in</Link>
								</>
							) : (
								<>
									<Button onClick={this.signInWithPlayFab}>Sign in</Button>
									<Link onClick={() => this.setState({ isRegistering: true })}>Register</Link>
								</>
							)}
							<GoogleLogin
								clientId="168518881059-39uvi2d24ev5rjscb6go5q4cljni1tgd.apps.googleusercontent.com"
								render={renderProps => (
									<Button onClick={renderProps.onClick} leftIcon={<FaGoogle />}>
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
								appId="533322048080315"
								autoLoad={true}
								render={renderProps => (
									<Button onClick={renderProps.onClick} leftIcon={<FaFacebook />}>
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
