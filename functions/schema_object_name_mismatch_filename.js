import { createRulesetFunction } from "@stoplight/spectral-core";

// schema-object-name-mismatch-filename
// Check if the "title" property of a schema matches the filename
export default createRulesetFunction(
  {
    input: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
      },
      required: ["title"],
    },
    options: null,
  },
  function schema_object_name_mismatch_filename(input, options, context) {
    const results = [];
    const { title } = input;
    let prefix;
    if (context.path[3] === "requestBody" && context.path.length === 7) {
      prefix = "requests";
    } else if (context.path[3] === "response" && context.path.length === 7) {
      prefix = "responses";
    } else {
      prefix = "schemas";
    }

    const documents = Object.keys(
      context.documentInventory.referencedDocuments
    );

    let match = false;
    for (const doc of documents) {
      // console.log(doc);
      if (doc.endsWith(`${prefix}/${title}.yaml`)) {
        match = true;
      }
    }

    if (!match) {
      results.push({
        message: `Schema title "${title}" does not match filename, expected ${prefix}/${title}.yaml: ${context.path}`,
      });
    }

    return results;
  }
);
