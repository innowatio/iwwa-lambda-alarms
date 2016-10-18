import {ALARMS_AGGREGATES_COLLECTION_NAME} from "../config";
import {getMongoClient} from "../services/mongodb";

export default async function upsertAggregate (aggregate) {
    const db = await getMongoClient();
    return db.collection(ALARMS_AGGREGATES_COLLECTION_NAME).update(
        {_id: aggregate._id},
        aggregate,
        {upsert: true}
    );
}
