// @ts-check

import { createRulesetFunction } from "@stoplight/spectral-core";
import { camelCase, pascalCase } from "change-case";

const types = {
  camelCase,
  pascalCase
};

export const casing = createRulesetFunction({
  input: {
    type: "string",
  },
  options: {
    type: "object",
    properties: {
      type: {
        enum: Object.keys(types),
      }
    },
  }
}, (value, { type }) => {
  // @ts-expect-error
  const suggestedName = types[type](value);
  if (value === suggestedName) return [];

  return [{
    message: `Consider renaming to "${suggestedName}".`,
  }];
});
