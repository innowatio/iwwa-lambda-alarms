import chai, {expect} from "chai";
import sinonChai from "sinon-chai";
import nock from "nock";
chai.use(sinonChai);

import {getUserInfo} from "services/axios-post";

describe("`getUserInfo` function", () => {
    it("return the user Info from SSO", async () => {
        const uid = "user.test";
        const token = "_tocken";
        const email = "user.test@mail.com";
        nock("https://sso.innowatio.it/openam/json/users").get("/user.test").reply(200,
            {
                username: "user.test",
                realm: "/",
                uid: [ "user.test" ],
                inetUserStatus: [ "Active" ],
                mail: [ "user.test@mail.com" ]
            }
        );
        const ret = await getUserInfo(uid, token);
        expect(ret.mail[0]).to.equal(email);
    });

    it("return null for Error 401", async () => {
        const uid = "user.test1";
        const token = "_tocken";
        nock("https://sso.innowatio.it/openam/json/users").get("/user.test1").reply(401, {});
        const ret = await getUserInfo(uid, token);
        expect(ret).to.equal(null);

    });
});
