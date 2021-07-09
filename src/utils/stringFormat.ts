const wrapString = (s: string) => s.replace(/(?![^\n]{1,21}$)([^\n]{1,21})\s/g, "$1\n");

const numberWithCommas = (num: number) => stringWithCommas(num.toString());

const stringWithCommas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export { wrapString, numberWithCommas, stringWithCommas };
