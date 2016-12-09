import axios from "axios";

export async function getUserInfo (uid, token) {
    try {
        const result = await axios.get(`https://sso.innowatio.it/openam/json/users/${uid}`, {
            headers: {
                "iplanetDirectoryPro": token,
                "Content-Type": "application/json"
            }
        });
        if (200 != result.status && !result.data) {
            return null;
        }
        return result.data;
    } catch (err) {
        console.error(err);
    }
    return null;
}
