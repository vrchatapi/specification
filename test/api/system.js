const expect = require("chai").expect;
const { satisfyApiSpec } = require("../common");

module.exports = function () {
    describe("GET /health", () => {
        satisfyApiSpec("get", "/health");
    });
    describe("GET /config", () => {
        satisfyApiSpec("get", "/config");
    });
    describe("GET /visits", () => {
        satisfyApiSpec("get", "/visits");
    });
    describe("GET /time", () => {
        satisfyApiSpec("get", "/time");
    });
}