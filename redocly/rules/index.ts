import { noEmptyDescription } from "./no-empty-description.ts";
import { noNestedObject } from "./no-nested-object.ts";
import { noSchemaExample } from "./no-schema-example.ts";
import { noSingleValueEnum } from "./no-single-value-enum.ts";
import { operationIdConvention } from "./operation-id-convention.ts";
import { preferUnknown } from "./prefer-unknown.ts";
import { schemaTitle } from "./schema-title.ts";

export const rules = {
	"no-empty-description": noEmptyDescription,
	"no-nested-object": noNestedObject,
	"no-schema-example": noSchemaExample,
	"no-single-value-enum": noSingleValueEnum,
	"operation-id-convention": operationIdConvention,
	"prefer-unknown": preferUnknown,
	"schema-title": schemaTitle
};
