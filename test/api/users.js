const { expect } = require("chai");
const { globalData, request, satisfyApiSpec } = require("../common");

module.exports = function () {
    describe("GET /users", () => {
        satisfyApiSpec("GET", "/users");

        it("n = 0", (done) => {
            request("GET", "/users").then(res => {
                expect(res.data).to.have.lengthOf(0);
                done();
            }).catch(err => done(err));
        });

        it("n = 1", (done) => {
            request("GET", "/users", {
                search: "f",
                n: 1,
            }).then(res => {
                expect(res.data).to.have.lengthOf(1);
                satisfyApiSpec(res);
                done();
            }).catch(err => done(err));
        });

        it("n = -1", (done) => {
            request("GET", "/users", {
                n: -1,
            }).then(res => {
                expect.fail("expected /users?n=-1 to fail");
            }).catch(err => {
                expect(err.response.status).to.equal(400);
                done();
            });
        });
    });

    describe("GET /users/{userId}", () => {
        satisfyApiSpec("GET", "/users/usr_c1644b5b-3ca4-45b4-97c6-a2a0de70d469");
    });

    describe("GET /users/{userId}/name", () => {
        satisfyApiSpec("GET", "/users/tupper/name");
    });

    describe("PUT /users/{userId}", () => {
        it("should satisfy OpenAPI spec", (done) => {
            request("PUT", "/users/" + globalData.currentUser.id).then(res => {
                expect(res).to.satisfyApiSpec;
                done();
            }).catch(err => done(err));
        });
    });
}