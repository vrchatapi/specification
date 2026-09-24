import { closeSchemas } from "./close-schemas.ts";
import { infoExtensionOverride } from "./info-extension-override.ts";
import { removeXDeleted } from "./remove-x-deleted.ts";

export const decorators = {
	"close-schemas": closeSchemas,
	"info-extension-override": infoExtensionOverride,
	"remove-x-deleted": removeXDeleted
};
