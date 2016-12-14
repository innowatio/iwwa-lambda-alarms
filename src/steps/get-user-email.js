import {getMongoClient} from "../services/mongodb";
import {getUserInfo} from "../services/axios-post";
import {USERS_COLLECTION_NAME} from "config";

export async function getUserEmail (userId) {
    const db = await getMongoClient();
    const user = await db.collection(USERS_COLLECTION_NAME).findOne({_id: userId});
    if (user && user.services) {
        const {uid, token} = user.services.sso;
        const ssoInfo = await getUserInfo(uid, token);
        return ssoInfo ? ssoInfo.mail : [];
    }
    return null;
}
