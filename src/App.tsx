import { PhaserGame } from "./phaser/phaser";
import React from "react";
import { GoogleLoginResponse } from "react-google-login";
import {
	Button,
	ChakraProvider,
	Divider,
	Flex,
	HStack,
	Input,
	Link,
	Spacer,
	Text,
	VStack,
} from "@chakra-ui/react";
import { fontFamily, largeFontSize, normalFontSize } from "./utils/constants";
import { SocialSignins } from "./SocialSignins";

interface IState {
	game: PhaserGame;
	isSignedIn: boolean;
	isRegistering: boolean;
	isLoading: boolean;
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
			isRegistering: true,
			isLoading: true,
			email: "",
			username: "",
			password: "",
		};
	}

	componentDidMount() {
		this.setState({
			game: new PhaserGame(this.finishLoading),
			isSignedIn: false,
		});
	}

	componentWillUnmount() {
		this.state.game.destroy(true);
	}

	finishLoading = () => {
		this.setState({
			isLoading: false,
		});
	};

	finishSignIn = () => {
		this.setState({
			isSignedIn: true,
		});
		this.state.game.registry.set("FinishedSignIn", true);
	};

	signInWithPlayFab = () => {
		this.state.game.signInWithPlayFab(this.state.username, this.state.password, this.finishSignIn);
	};

	registerWithPlayFab = () => {
		this.state.game.registerWithPlayFab(
			this.state.email,
			this.state.username,
			this.state.password,
			this.finishSignIn
		);
	};

	onGoogleSuccess = (response: GoogleLoginResponse) => {
		this.state.game.signInWithGoogle(response.accessToken, response.getBasicProfile().getName(), this.finishSignIn);
	};

	onGoogleFailure = (error: any) => {
		console.log("Something went wrong", error);
	};

	onFacebookSignin = response => {
		this.state.game.signInWithFacebook(response.accessToken, response.name, this.finishSignIn);
	};

	render() {
		return (
			<ChakraProvider>
				{this.state.isSignedIn || this.state.isLoading ? null : (
					<HStack position="absolute" width={500} left={0} right={0} top={340} marginLeft="auto" marginRight="auto">
						<VStack>
							<Flex width={225}>
								<Text fontFamily={fontFamily} fontSize={largeFontSize} color="white">
									{this.state.isRegistering ? "Register" : "Sign In"}
								</Text>
								<Spacer />
							</Flex>
							{this.state.isRegistering ? (
								<Input
									backgroundColor="blackAlpha.300"
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
								backgroundColor="blackAlpha.300"
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
								backgroundColor="blackAlpha.300"
								fontFamily={fontFamily}
								fontSize={normalFontSize}
								color="white"
								size="md"
								type="password"
								placeholder="Password"
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
										onClick={this.signInWithPlayFab}>
										Sign in
									</Button>
								</Flex>
							)}
						</VStack>
						<Spacer />
						<Divider orientation="vertical" />
						<Spacer />
						<SocialSignins
							isSignedIn={this.state.isSignedIn}
							onGoogleSuccess={this.onGoogleSuccess}
							onGoogleFailure={this.onGoogleFailure}
							onFacebookSignin={this.onFacebookSignin}
						/>
					</HStack>
				)}
			</ChakraProvider>
		);
	}
}

export default App;
