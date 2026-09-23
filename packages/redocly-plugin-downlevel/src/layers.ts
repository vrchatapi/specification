import { layer as from301 } from "./3.0.1/index.ts";
import { layer as from302 } from "./3.0.2/index.ts";
import { layer as from303 } from "./3.0.3/index.ts";
import { layer as from304 } from "./3.0.4/index.ts";
import { layer as from310 } from "./3.1.0/index.ts";
import { layer as from311 } from "./3.1.1/index.ts";
import { layer as from312 } from "./3.1.2/index.ts";
import { layer as from320 } from "./3.2.0/index.ts";
import { layer as from321 } from "./3.2.1/index.ts";
import type { Layer } from "./layer.ts";

/**
 * One layer per OpenAPI release, each named after the release it reads and
 * writing the release below it. 3.0.0, the first 3.x release, has none.
 */
export const layers: Array<Layer> = [
	from321,
	from320,
	from312,
	from311,
	from310,
	from304,
	from303,
	from302,
	from301
];
