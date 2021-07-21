import { Input } from "@chakra-ui/react";
import { InputHTMLAttributes, ChangeEvent } from "react";
import { fontFamily, normalFontSize } from "./utils/constants";

type CustomInputProps = InputHTMLAttributes<HTMLInputElement> & {
	placeholder: string;
	type?: string;
	handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export const CustomInput: React.FC<CustomInputProps> = props => {
	return (
		<Input
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
