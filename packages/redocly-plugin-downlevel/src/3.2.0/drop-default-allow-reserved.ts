import type { Transform } from "../layer.ts";

/**
 * 3.2 accepts `allowReserved` beyond `in: query`; 3.1 forbids it there. Its
 * default, `false`, changes nothing wherever it is written, so it goes.
 *
 * https://spec.openapis.org/oas/v3.1.1#parameter-allow-reserved
 */
export const dropDefaultAllowReserved: Transform = () => ({
	Parameter: {
		leave: (parameter) => {
			if (parameter.in !== "query" && parameter.allowReserved === false) delete parameter.allowReserved;
		}
	}
});
