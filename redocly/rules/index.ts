import { noEmptyDescription } from "./no-empty-description.ts";
import { noNestedObject } from "./no-nested-object.ts";
import { operationIdConvention } from "./operation-id-convention.ts";
import { schemaTitle } from "./schema-title.ts";

export const rules = {
	"no-empty-description": noEmptyDescription,
	"no-nested-object": noNestedObject,
	"operation-id-convention": operationIdConvention,
	"schema-title": schemaTitle
};
