import moment from "moment";

import {
    CONSUMPTION_AGGREGATES_COLLECTION_NAME
} from "../config";
import {getMongoClient} from "../services/mongodb";

function getYearFromReading (date) {
    return moment.utc(date, moment.ISO_8601, true).format("YYYY");
}

function getAggregateId (reading) {
    const {sensorId, date, source, measurementType} = reading;
    return `${sensorId}-${getYearFromReading(date)}-${source}-${measurementType}`;
}

export default async function getOrCreateAggregate (reading) {
    const db = await getMongoClient();
    const aggregate = await db
        .collection(CONSUMPTION_AGGREGATES_COLLECTION_NAME)
        .findOne({_id: getAggregateId(reading)});
    return aggregate;
}
