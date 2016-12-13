import  {expect} from "chai";
import {getUserEmail} from "steps/get-user-email";
import nock from "nock";

import {USERS_COLLECTION_NAME} from "config";
import {getMongoClient} from "services/mongodb";
import {user} from "../../utils";

describe("`getUserEmail` function", () => {
    var db;
    var users;
    const email = "user.test@mail.com";

    nock("https://sso.innowatio.it/openam/json/users").get("/user.test").times(2).reply(200, {
        username: "user.test",
        realm: "/",
        uid: [ "user.test" ],
        inetUserStatus: [ "Active" ],
        mail: [ "user.test@mail.com" ]
    });

    before(async () => {
        db = await getMongoClient();
        users = db.collection(USERS_COLLECTION_NAME);
        await users.insert(user);
    });

    after(async () => {
        await db.dropCollection(USERS_COLLECTION_NAME);
    });

    it("return the user Info from SSO", async () => {
        const uid = "userId";
        const ret = await getUserEmail(uid);
        expect(ret[0]).to.equal(email);
    });

    it("return null if the user is not present in the db", async () => {
        const uid = "userIdWrong";
        const ret = await getUserEmail(uid);
        expect(ret).to.equal(null);
    });
});
