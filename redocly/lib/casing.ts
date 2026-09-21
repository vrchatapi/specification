import { camelCase, pascalCase } from "change-case";

/**
 * Two or more capitals in a row read as an acronym. Where the run is followed by
 * a lowercase letter its last capital opens the next word instead, so `FAEmail`
 * is `FA` and `Email`.
 */
const acronyms = /[A-Z]{2,}/g;

/**
 * An acronym keeps every letter, so `getCSS` is already right where `getCss` is
 * what splitting it into words gives. Renaming one costs a method name in every
 * generated client and a redirect on the docs site, which is more than the
 * spelling is worth.
 */
export function isCamelCase(value: string) {
	if (value === camelCase(value)) return true;

	const spelled = value.replaceAll(acronyms, (run, index: number) => {
		const acronym = /[a-z]/.test(value[index + run.length] ?? "") ? run.slice(0, -1) : run;
		return pascalCase(acronym) + run.slice(acronym.length);
	});

	return camelCase(spelled) === spelled || spelled === camelCase(value);
}
