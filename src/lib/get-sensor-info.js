import {getMongoClient} from "../services/mongodb";
import {SENSOR_COLLECTION_NAME} from "../config";

export async function getSensorInfo (sensorId) {
    const db = await getMongoClient();
    const sensor = await db.collection(SENSOR_COLLECTION_NAME).findOne({_id: sensorId});

    return {
        sensorId,
        sensorName: sensor ? sensor.name : null,
        sensorDescription: sensor ? sensor.description : null,
    };
}
