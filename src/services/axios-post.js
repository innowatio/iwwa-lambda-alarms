import axios from "axios";
import log from "../services/logger";

export async function getUserInfo (uid, token) {
    try {
        const result = await axios.get(`https://sso.innowatio.it/openam/json/users/${uid}`, {
            headers: {
                "iplanetDirectoryPro": token,
                "Content-Type": "application/json"
            }
        });
        return result.data;
    } catch (err) {
        log.error(err);
    }
    return null;
}
