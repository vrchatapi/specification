const expect = require("chai").expect;
const { satisfyApiSpec } = require("../common");

module.exports = function () {
    describe("GET /users", () => {
        satisfyApiSpec("get", "/users");
    });
}