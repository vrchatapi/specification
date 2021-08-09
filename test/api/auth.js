const axios = require("axios");
const expect = require("chai").expect;
const { satisfyApiSpec, request } = require("../common");

let method = "";
let path = "";

module.exports = function () {
    method = "GET", path = "/auth/user"
    describe(`${method} ${path}`, () => {
        //satisfyApiSpec(method, path);
        // Temporary workaround due to https://github.com/openapi-library/OpenAPIValidators/issues/240
        // causing accountDeletionDate to fail due to expected string being null
        it("should authenticate", async () => {
            const res = await request(method, path);
            expect(res.status).to.equal(200);
        });
    });

    after(function() {
        // Remove Authorization header outside /auth
        axios.defaults.auth = null;
    });
}