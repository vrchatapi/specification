import type { NodeType, UserContext } from "@redocly/openapi-core";

export type Node = Record<string, unknown>;

type Visit = (node: Node, context: UserContext) => void;

/**
 * A Redocly visitor over plain JSON: keyed by Redocly's node type names, such as
 * `Schema` or `Operation`, plus `ref` for every `$ref`.
 */
export type Visitor = Partial<Record<string, { enter?: Visit; leave?: Visit }>>;

export interface TransformOptions {
	/**
	 * The version the layer writes, for messages that name it.
	 */
	version: string;
	loosenUnions: boolean;
}

/**
 * A Redocly visitor factory. Each transform runs as its own walk over the whole
 * bundled description, so it reads a document every earlier transform has
 * finished with.
 */
export type Transform = (options: TransformOptions) => Visitor;

/**
 * Rewrites a description in `version` as the release one below it, `writes`.
 */
export interface Layer {
	version: string;
	writes: string;
	/**
	 * The type tree for `version`, which the layer's transforms walk.
	 */
	types: Record<string, NodeType>;
	specVersion: "oas3_0" | "oas3_1" | "oas3_2";
	/**
	 * Report what `writes` cannot say or would read differently, and change
	 * nothing. All of them run, so every problem is reported at once.
	 */
	checks: Array<Transform>;
	/**
	 * Rewrite the description, in order. The first to report ends the run: the
	 * ones after it would meet a construct it could not lower.
	 */
	transforms: Array<Transform>;
}
