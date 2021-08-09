const { expect } = require("chai");
const { satisfyApiSpec, request } = require("../common");

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
}