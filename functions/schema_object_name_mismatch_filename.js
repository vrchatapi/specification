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
    const documents = Object.keys(
      context.documentInventory.referencedDocuments
    );

    let match = false;
    for (const doc of documents) {
      // console.log(doc);
      if (doc.endsWith(`schemas/${title}.yaml`)) {
        match = true;
      }
    }

    if (!match) {
      results.push({
        message: `Schema title "${title}" does not match filename`,
      });
    }

    return results;
  }
);
