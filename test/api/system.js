const expect = require("chai").expect;
const { globalData, request, satisfyApiSpec } = require("../common");

module.exports = function () {
    describe("GET /health", async () => {
        satisfyApiSpec("GET", "/health");
    });
    describe("GET /config", async () => {
        it("should satisfy OpenAPI spec", (done) => {
            request("GET", "/config").then(res => {
                expect(res).to.satisfyApiSpec;
                globalData.config = res.data;
                done();
            }).catch(err => done(err));
        });
    });
    describe("GET /visits", async () => {
        satisfyApiSpec("GET", "/visits");
    });
    describe("GET /time", async () => {
        satisfyApiSpec("GET", "/time");
    });
}