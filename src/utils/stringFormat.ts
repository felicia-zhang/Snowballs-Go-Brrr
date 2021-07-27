const wrapString = (s: string, length: number) =>
	s.replace(new RegExp(`(?![^\\n]{1,${length}}$)([^\\n]{1,${length}})\\s`, "g"), "$1\n");

const numberWithCommas = (num: number) => stringWithCommas(num.toString());

const stringWithCommas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export { wrapString, numberWithCommas };
