const path = require("path");

// Config
const BASE_URL = "https://api.vrchat.cloud/api/1";
const USERNAME = process.env["VRC_USERNAME"];
const PASSWORD = process.env["VRC_PASSWORD"];

// Set up Axios
const axios = require("axios");
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
axiosCookieJarSupport(axios);
const { CookieJar } = require('tough-cookie');
axios.defaults.jar = new CookieJar();
axios.defaults.headers.common["User-Agent"] = "vrchatapi-specification openapi test suite";
axios.defaults.withCredentials = true;
axios.defaults.auth = {
    username: USERNAME,
    password: PASSWORD,
};

// Set up Chai
const chai = require("chai");
const expect = chai.expect;
const chaiResponseValidator = require("chai-openapi-response-validator");
chai.use(chaiResponseValidator(path.resolve("dist/openapi.yaml")));

function request(method, path) {
    return axios.request({
        method: method,
        url: BASE_URL + path
    });
}

function satisfyApiSpec(method, path) {
    it("should satisfy OpenAPI spec", async () => {
        // Get an HTTP response from your server (e.g. using axios)
        try {
            const res = await request(method, path);
            // Assert that the HTTP response satisfies the OpenAPI spec
            expect(res).to.satisfyApiSpec;
        } catch(e) {
            console.error(e);
        }
    });
}

module.exports = {
    satisfyApiSpec,
    request,
}