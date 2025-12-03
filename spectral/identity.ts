import type { RuleDefinition, RulesetDefinition } from "@stoplight/spectral-core";

const identity = <T>(value: T) => value;

export const rule = (value: RuleDefinition) => identity(value);
export const ruleset = (value: RulesetDefinition) => identity(value);
