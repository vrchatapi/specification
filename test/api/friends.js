const { v4: uuidv4 } = require('uuid');
const { expect } = require("chai");
const { globalData, request, satisfyApiSpec } = require("../common");

module.exports = function () {
    describe("GET /auth/user/friends", () => {
        satisfyApiSpec("GET", "/auth/user/friends");
    });

    describe("GET /users/{userId}/friendStatus", () => {
        satisfyApiSpec("GET", "/user/usr_c1644b5b-3ca4-45b4-97c6-a2a0de70d469/friendStatus");
    });
}