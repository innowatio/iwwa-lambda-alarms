import {ALARMS_COLLECTION_NAME} from "../config";
import {getMongoClient} from "../services/mongodb";
import moment from "moment";

export default async function upsertLastEmailSent (alarm) {
    const db = await getMongoClient();
    const newAlarm = {
        ...alarm,
        lastEmailSent: moment().unix()
    };
    return db.collection(ALARMS_COLLECTION_NAME).update(
        {_id: alarm._id},
        newAlarm,
        {upsert: true}
    );
}
