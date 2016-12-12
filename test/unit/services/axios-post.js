import chai, {expect} from "chai";
import sinonChai from "sinon-chai";
import nock from "nock";
chai.use(sinonChai);

import {getUserInfo} from "services/axios-post";



describe("`getUserInfo` function", () => {
    nock("https://sso.innowatio.it/openam/json/users").get("/user.test").times(1).reply(200,
        {
            username: "user.test",
            realm: "/",
            uid: [ "user.test" ],
            inetUserStatus: [ "Active" ],
            mail: [ "user.test@mail.com" ]
        }
    );
    const uid = "user.test";
    const token = "_tocken";
    const email = "user.test@mail.com";
    it("return the user Info from SSO", async () => {
        const ret = await getUserInfo(uid, token);
        expect(ret.mail[0]).to.equal(email);
    });
});
