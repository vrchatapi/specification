const { satisfyApiSpec } = require("./common");

// Set up Chai
const path = require("path");
const chai = require("chai");
const chaiResponseValidator = require("chai-openapi-response-validator");
chai.use(chaiResponseValidator(path.resolve("dist/openapi.yaml")));

// Import APIs
const auth = require("./api/auth");
const users = require("./api/users");
const system = require("./api/system");

describe("Testing Authentication API", () => {
    auth();
});

describe("Testing System API", () => {
    system();
});

describe("Testing Users API", () => {
    users();
});

after(() => {
    describe("Logout", () => {
        satisfyApiSpec("PUT", "/logout");
    });
})