const path = require("path");
const axios = require("axios");

// Set up Chai
const chai = require("chai");
const expect = chai.expect;
const chaiResponseValidator = require("chai-openapi-response-validator");
chai.use(chaiResponseValidator(path.resolve("dist/openapi.yaml")));

const BASE_URL = "https://api.vrchat.cloud/api/1";


const auth = require("./api/auth");
const system = require("./api/system");

describe("Testing Authentication API", () => {
    auth();
});

describe("Testing Systems API", () => {
    system();
});