import { configure } from "@ariesclark/eslint-config";

export default configure({
	type: "app",
	react: false,
	yaml: true,
	rules: {
		"unicorn/prevent-abbreviations": "off",
	}
});
