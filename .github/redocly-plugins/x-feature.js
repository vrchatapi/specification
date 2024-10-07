const id = 'x-feature';

/**
Example:
 
source file
/auth/user:
    get:
      summary: Login and/or Get Current User Info
      tags:
        - authentication
      x-codeSamples:
        $ref: "../codeSamples/authentication.yaml#/~1auth~1user/get"
      responses:
        '200':
            x-feature:
                required-features: [ oneOf ]
                desired:
                    schema: 
                        oneOf:
                            - $ref: ../responses/authentication/CurrentUserLoginResponse.yaml
                            - $ref: '#/components/schemas/TwoFactorRequired'
                fallback:
                    $ref: ../responses/authentication/CurrentUserLoginResponse.yaml
        '401':
            $ref: ../responses/MissingCredentialsError.yaml
 
rendered file with x-feature enabled with available features: [ oneOf ]
/auth/user:
    get:
      summary: Login and/or Get Current User Info
      tags:
        - authentication
      x-codeSamples:
        $ref: "../codeSamples/authentication.yaml#/~1auth~1user/get"
      responses:
        '200':
            schema: 
                oneOf:
                    - $ref: ../responses/authentication/CurrentUserLoginResponse.yaml
                    - $ref: '#/components/schemas/TwoFactorRequired'
        '401':
            $ref: ../responses/MissingCredentialsError.yaml


rendered file with x-feature enabled no features enabled:
/auth/user:
    get:
      summary: Login and/or Get Current User Info
      tags:
        - authentication
      x-codeSamples:
        $ref: "../codeSamples/authentication.yaml#/~1auth~1user/get"
      responses:
        '200':
            $ref: ../responses/authentication/CurrentUserLoginResponse.yaml
        '401':
            $ref: ../responses/MissingCredentialsError.yaml
 */



/** @type {import('@redocly/openapi-cli').CustomRulesConfig} */
const decorators = {
    oas3: {
        'fallback-replace': ({ available_features }) => {
            if (!Array.isArray(available_features)) {
                throw new Error('available_features must be an array');
            }
            return {
                any: {
                    leave(obj, _ctx) {
                        if (obj['x-feature']) {
                            const feature = obj['x-feature'];
                            valid_feature_configuration(feature); // throws if not valid
                            
                            if (feature['required-features'].every(f => available_features.includes(f))) {
                                mergeDeep(obj, feature['desired']);
                            } else {
                                mergeDeep(obj, feature['fallback']);
                            }

                            delete obj['x-feature'];
                        }
                    }
                },
            }
        },
        'remove-fallback-components': () => {} // not implemented should remove files / components that are not used
    }
}

function valid_feature_configuration(obj) {
    if (!obj['desired']) {
        throw new Error('x-feature: desired is required');
    }
    if (!obj['fallback']) {
        throw new Error('x-feature: fallback is required');
    }
    if (!obj['required-features'] || !Array.isArray(obj['required-features'])) {
        throw new Error('x-feature: required-features is required and must be an array');
    }
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Source: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

module.exports = {
    id,
    decorators,
};