import dispatchEvent from "../services/lk-dispatcher";
import {getMongoClient} from "../services/mongodb";
import {getUserInfo} from "../services/axios-post";
import {EVENT_EMAIL_INSERTED, USERS_COLLECTION_NAME} from "config";

export async function dispatchEmailEvent (rawReading) {
    const toAddresses = await getUserEmail(rawReading.userId);
    const kinesisEvent = {
        element: {
            timestamp: new Date().toISOString(),
            toAddresses: toAddresses,
            message: getMessage(rawReading),
            subject: getSubject(rawReading)
        }
    };
    await dispatchEvent(EVENT_EMAIL_INSERTED, kinesisEvent);
}

async function getUserEmail (userId) {
    const db = await getMongoClient();
    const user = await db.collection(USERS_COLLECTION_NAME).findOne({_id: userId});
    if (user && user.services) {
        const {uid, token} = user.services.sso;
        const ssoInfo = await getUserInfo(uid, token);
        return ssoInfo.mail;
    }
    return null;
}

function getSubject (rawReading) {
    return "Lucy Alarm - " + rawReading.name;
}

function getMessage (rawReading) {
    return "Alarm: " + rawReading.name + "\n"
    + "SensorId: " + rawReading.sensorId + "\n"
    + "Measurement Type: "+ rawReading.measurementType + "\n"
    + "Unit of Measure: " + rawReading.unitOfMeasurement + "\n"
    + "threshold: " + rawReading.threshold;
}