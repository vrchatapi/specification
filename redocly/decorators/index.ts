import { addImpliedTypes } from "./add-implied-types.ts";
import { closeSchemas } from "./close-schemas.ts";
import { infoExtensionOverride } from "./info-extension-override.ts";
import { rejectUnknown } from "./reject-unknown.ts";
import { removeDiscriminators } from "./remove-discriminators.ts";
import { removeXDeleted } from "./remove-x-deleted.ts";
import { unknownEnums } from "./unknown-enums.ts";
import { versionOverride } from "./version-override.ts";
import { xLinks } from "./x-links.ts";

export const decorators = {
	"add-implied-types": addImpliedTypes,
	"close-schemas": closeSchemas,
	"info-extension-override": infoExtensionOverride,
	"reject-unknown": rejectUnknown,
	"remove-discriminators": removeDiscriminators,
	"remove-x-deleted": removeXDeleted,
	"unknown-enums": unknownEnums,
	"version-override": versionOverride,
	"x-links": xLinks
};
