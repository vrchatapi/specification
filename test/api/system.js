const expect = require("chai").expect;
const { satisfyApiSpec } = require("../common");

module.exports = function () {
    describe("GET /health", async () => {
        satisfyApiSpec("GET", "/health");
    });
    describe("GET /config", async () => {
        satisfyApiSpec("GET", "/config");
    });
    describe("GET /visits", async () => {
        satisfyApiSpec("GET", "/visits");
    });
    describe("GET /time", async () => {
        satisfyApiSpec("GET", "/time");
    });
}