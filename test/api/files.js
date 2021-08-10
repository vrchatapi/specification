const { v4: uuidv4 } = require('uuid');
const { expect } = require("chai");
const { globalData, request, satisfyApiSpec } = require("../common");

module.exports = function () {
    describe("GET /files", () => {
        satisfyApiSpec("GET", "/files");
    });

    describe("Story test of creating and deleting a simple File", () => {
        it("create file", (done) => {
            request("POST", "/file", {
                name: "test file",
                mimeType: "image/png",
                extension: ".png",
                tags: [ "openapi_unit_test" ]
            }).then(res => {
                expect(res).to.satisfyApiSpec;
                expect(res.data.name).to.equal("test file");
                expect(res.data.mimeType).to.equal("image/png");
                expect(res.data.extension).to.equal(".png");
                expect(res.data.tags).to.include("openapi_unit_test");
                globalData.file = res.data;
                done();
            }).catch(err => {
                console.log(err); console.log(err.response.data.error); done(err)
            });
        });

        it("check file", (done) => {
            request("GET", "/files/" + globalData.file.id).then(res => {
                expect(res).to.satisfyApiSpec;
                expect(res.data.name).to.equal("test file");
                expect(res.data.mimeType).to.equal("image/png");
                expect(res.data.extension).to.equal(".png");
                expect(res.data.tags).to.include("openapi_unit_test");
                done();
            }).catch(err => done(err));
        });

        it("delete file", (done) => {
            request("DELETE", "/files/" + globalData.file.id).then(res => {
                expect(res).to.satisfyApiSpec;
                expect(res.status).to.equal(200);
                done();
            }).catch(err => done(err));
        });
    });
}