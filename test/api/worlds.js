const { v4: uuidv4 } = require('uuid');
const { expect } = require("chai");
const { globalData, request, satisfyApiSpec } = require("../common");

module.exports = function () {
    describe("GET /worlds", () => {
        satisfyApiSpec("GET", "/worlds");
    });
    describe("GET /worlds/active", () => {
        satisfyApiSpec("GET", "/worlds/active");
    });
    describe("GET /worlds/recent", () => {
        satisfyApiSpec("GET", "/worlds/recent");
    });
    describe("GET /worlds/favorites", () => {
        satisfyApiSpec("GET", "/worlds/favorites");
    });
}