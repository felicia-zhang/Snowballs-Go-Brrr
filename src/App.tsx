import { PhaserGame } from "./components/phaser";
import React from "react";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import { Button, ChakraProvider, Input, InputGroup, VStack } from "@chakra-ui/react";
import { FaFacebook, FaGoogle } from "react-icons/fa";

interface IState {
	game: PhaserGame;
	isSignedIn: boolean;
}

class App extends React.PureComponent<any, IState> {
	constructor(props: any) {
		super(props);
		this.state = {
			game: null,
			isSignedIn: false,
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

	onGoogleSuccess = (response: GoogleLoginResponse) => {
		this.setState({
			isSignedIn: true,
		});
		this.state.game.googleSignin(response.accessToken, response.getBasicProfile().getName());
	};

	onGoogleFailure = (error: any) => {
		console.log("Something went wrong", error);
	};

	onFacebookSignin = response => {
		this.setState({
			isSignedIn: true,
		});
		this.state.game.facebookSignin(response.accessToken, response.name);
	};

	render() {
		return (
			<ChakraProvider>
				<div style={{ position: "absolute", left: "300px", top: "200px" }}>
					{this.state.isSignedIn ? null : (
						<VStack>
							<Input color="white" size="md" placeholder="Username" />
							<Input color="white" size="md" type="password" placeholder="Enter password" />
							<Button>Sign in</Button>
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
