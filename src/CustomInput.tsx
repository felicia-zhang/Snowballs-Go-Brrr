import { Input } from "@chakra-ui/react";
import { InputHTMLAttributes, ChangeEvent } from "react";
import { errorHex, fontFamily, normalFontSize } from "./utils/constants";

type CustomInputProps = InputHTMLAttributes<HTMLInputElement> & {
	errors: string[];
	seen: boolean;
	placeholder: string;
	type?: string;
	handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export const CustomInput: React.FC<CustomInputProps> = props => {
	return (
		<Input
			isInvalid={props.errors.includes(props.placeholder)}
			errorBorderColor={errorHex}
			isReadOnly={!props.seen}
			cursor={props.seen ? "text" : "default"}
			backgroundColor="blackAlpha.300"
			fontFamily={fontFamily}
			fontSize={normalFontSize}
			color="white"
			size="md"
			placeholder={props.placeholder}
			type={props.type}
			onChange={e => props.handleChange(e)}
		/>
	);
};
