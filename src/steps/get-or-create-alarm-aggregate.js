import moment from "moment";

import {
    ALARMS_AGGREGATES_COLLECTION_NAME
} from "../config";
import {getMongoClient} from "../services/mongodb";

function getDateFromAlarm (type, date) {
    // The possible alarm types are "realtime", "daily", "monthly"
    switch (type) {
    case "realtime":
    case "daily": {
        return moment.utc(date, moment.ISO_8601, true).format("YYYY-MM-DD");
    }
    case "monthly":
        return moment.utc(date, moment.ISO_8601, true).format("YYYY-MM");
    }
}

function getAggregateId (reading, alarm) {
    const date = getDateFromAlarm(alarm.type, reading.date);
    return `${alarm._id}-${date}`;
}

function getDefaultAggregate (reading, alarm) {
    const _id = getAggregateId(reading, alarm);
    return {
        _id,
        date: getDateFromAlarm(alarm.type, reading.date),
        alarmId: alarm._id,
        triggered: false,
        measurementValues: null,
        measurementTimes: null
    };
}

export async function getOrCreateAlarmAggregate (reading, alarm) {
    const db = await getMongoClient();
    const aggregate = await db.collection(ALARMS_AGGREGATES_COLLECTION_NAME)
        .findOne({_id: getAggregateId(reading, alarm)});
    return aggregate || getDefaultAggregate(reading, alarm);
}
