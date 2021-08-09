const axios = require("axios");
const expect = require("chai").expect;
const { axiosAuth, BASE_URL, satisfyApiSpec } = require("../common");

module.exports = function () {
    describe("GET /auth/user", () => {
        it("should authenticate", (done) => {
            axios.request({
                method: "GET",
                url: BASE_URL + "/auth/user",
                auth: axiosAuth
            }).then(res => {
                // Temporary workaround due to https://github.com/openapi-library/OpenAPIValidators/issues/240
                // causing accountDeletionDate to fail due to expected string being null
                expect(res.status).to.equal(200);
                done();
            }).catch(err => {
                console.log(err);
                done(err)
            });
        });
    });

    describe("PUT /logout", () => {
        satisfyApiSpec("PUT", "/logout");
    });

    describe("GET /auth", () => {
        it("should authenticate", (done) => {
            axios.request({
                method: "GET",
                url: BASE_URL + "/auth/user",
                auth: axiosAuth
            }).then(res => {
                expect(res).to.satisfyApiSpec;
                done();
            }).catch(err => {
                console.log(err);
                done(err)
            });
        });
    });
}