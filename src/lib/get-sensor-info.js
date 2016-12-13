import {getMongoClient} from "../services/mongodb";
import {SITE_COLLECTION_NAME, SENSOR_COLLECTION_NAME} from "../config";

export async function getSensorInfo (sensorId) {
    const db = await getMongoClient();
    const sensor = await db.collection(SENSOR_COLLECTION_NAME).findOne({_id: sensorId});
    const site = await db.collection(SITE_COLLECTION_NAME).findOne({sensorsIds: sensorId});

    return {
        sensorId,
        sensorName: sensor ? sensor.name : null,
        sensorDescription: sensor ? sensor.description : null,
        siteName: site ? site.name : null
    };
}
