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

    if (title === "APIConfig") {
      console.log(context);
      let abc = context.documentInventory.referencedDocuments['/home/foorack/Documents/git/specification/openapi/components/schemas/APIConfig.yaml'];
      console.log(abc);
      // console.log(JSON.stringify(abc.data) === JSON.stringify(input));
      console.log(JSON.stringify(abc.data));
      console.log(JSON.stringify(input));
    }

    // let match = false;
    // for (const doc of documents) {
    //   // console.log(doc);
    //   if (doc.endsWith(`${prefix}/${title}.yaml`)) {
    //     match = true;
    //   }
    // }

    // if (!match) {
    //   results.push({
    //     message: `Schema title "${title}" does not match filename, expected ${prefix}/${title}.yaml: ${context.path}`,
    //   });
    // }

    return results;
  }
);
