import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import { fontFamily, normalFontSize } from "./utils/font";
import { Button } from "@chakra-ui/react";
import { FaFacebook, FaGoogle } from "react-icons/fa";

type SocialSigninsProps = {
    isSignedIn: boolean;
    onGoogleSuccess: (response: GoogleLoginResponse) => void;
    onGoogleFailure: (error: any) => void;
    onFacebookSignin: (response: any) => void;
};

export const SocialSignins: React.FC<SocialSigninsProps> = ({ isSignedIn, onGoogleSuccess, onGoogleFailure, onFacebookSignin }) => {
    return (
        <>
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
                onSuccess={onGoogleSuccess}
                onFailure={onGoogleFailure}
                isSignedIn={isSignedIn}
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
                callback={onFacebookSignin}
            />
        </>
    );
};