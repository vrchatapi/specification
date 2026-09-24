import { closeSchemas } from "./close-schemas.ts";
import { infoExtensionOverride } from "./info-extension-override.ts";
import { removeXDeleted } from "./remove-x-deleted.ts";
import { versionOverride } from "./version-override.ts";
import { xLinks } from "./x-links.ts";

export const decorators = {
	"close-schemas": closeSchemas,
	"info-extension-override": infoExtensionOverride,
	"remove-x-deleted": removeXDeleted,
	"version-override": versionOverride,
	"x-links": xLinks
};
