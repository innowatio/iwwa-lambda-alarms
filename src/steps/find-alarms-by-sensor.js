import {ALARMS_COLLECTION_NAME} from "../config";
import {getMongoClient} from "../services/mongodb";

export default async function findAlarmsBySensor (sensorId) {
    const db = await getMongoClient();
    const query = {
        sensorId
    };
    return db.collection(ALARMS_COLLECTION_NAME).find(query).toArray();
}
