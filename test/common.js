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

const axiosAuth = {
    username: USERNAME,
    password: PASSWORD,
};

// Set up Chai
const chai = require("chai");
const expect = chai.expect;
const chaiResponseValidator = require("chai-openapi-response-validator");
chai.use(chaiResponseValidator(path.resolve("dist/openapi.yaml")));

function request(method, path, data) {
    let body = {};
    if (data != undefined) {
        if (method.toUpperCase() == "GET") {
            var queryString = Object.keys(data).map((key) => {
                return encodeURIComponent(key) + '=' + encodeURIComponent(data[key])
            }).join('&');
            path += "?" + queryString;
        } else {
            body = data;
        }
    }
    return axios.request({
        method: method,
        url: BASE_URL + path,
        body
    });
}

function satisfyApiSpec(method, path) {
    it("should satisfy OpenAPI spec", (done) => {
        if (path == undefined) {
            expect(res).to.satisfyApiSpec;
            done();
        } else {
            // Get an HTTP response from your server (e.g. using axios)
            request(method, path).then(res => {
                // Assert that the HTTP response satisfies the OpenAPI spec
                expect(res).to.satisfyApiSpec;
                done();
            }).catch(err => done(err));
        }
    });
}

module.exports = {
    axiosAuth,
    BASE_URL,
    globalData: {
        currentUser: null,
        config: null,
    },
    satisfyApiSpec,
    request,
}