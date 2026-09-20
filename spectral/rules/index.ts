import { description } from "./description.js";
import { nestedObject } from "./nested-object.js";
import { operationId } from "./operation-id";
import { title } from "./title.js";
import { typos } from "./typos.js";

export const rules = {
	"vrc-description": description,
	"vrc-nested-object": nestedObject,
	"vrc-operation-id": operationId,
	"vrc-title": title,
	"vrc-typos": typos,
};
