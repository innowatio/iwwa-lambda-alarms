import moment from "moment";
import R from "ramda";
import siftValidator from "../lib/sift-validator";
import getAlarmReadingValue from "./get-alarm-reading-value";
import {getOrCreateAlarmAggregate} from "./get-or-create-alarm-aggregate";
import parseAggregate from "./parse-aggregate";
import pushNotification from "./push-notification";
import log from "../services/logger";
import {triggerPushNotifications} from "./trigger-push-notifications";
import stringifyAggregate from "./stringify-aggregate";
import updateAlarmAggregate from "./update-alarm-aggregate";
import upsertAggregate from "./upsert-aggregate";
import {EVENT_ALARM_INSERT} from "../config";
import dispatchEvent from "../services/lk-dispatcher";

export default async function checkAndUpdateAlarm (alarm, reading, event) {
    log.debug(alarm, "alarm");
    // Skip if alarm not match the rule
    if (!siftValidator(alarm.rule, reading)) {
        log.info({alarm});
        return null;
    }
    const alarmReadingValue = await getAlarmReadingValue(alarm, reading);
    const alarmTriggerStatus = siftValidator(alarm.thresholdRule, alarmReadingValue); // boolean
    log.debug(alarmTriggerStatus, "Alarm trigger status");
    if (alarm.type !== "realtime" && !alarmTriggerStatus) {
        log.info({alarm});
        return null;
    }

    const alarmAggregate = await getOrCreateAlarmAggregate(reading, alarm);
    const parsedAlarmAggregate = parseAggregate(alarmAggregate);
    const updatedAlarmAggregate = updateAlarmAggregate(parsedAlarmAggregate, reading, alarmTriggerStatus, alarm);
    if (!updateAlarmAggregate) {
        return null;
    }
    const aggregate = stringifyAggregate(updatedAlarmAggregate);
    await upsertAggregate(aggregate);
    if (triggerPushNotifications(event, reading)) {
        await pushNotification(alarm, alarmTriggerStatus, reading, aggregate);
        if (alarmTriggerStatus) {
            const alarmCount = countAlrmByTime(aggregate, alarm.sensorId);
            await dispatchEvent(EVENT_ALARM_INSERT, alarmCount);
        }

    }
}
function countAlrmByTime (aggregate, sensorId) {
    const measurementValues= aggregate.measurementValues.split(",");
    const measurementTimes= aggregate.measurementTimes.split(",");
    const lastMeasurementTimes = moment.utc(parseInt(R.last(measurementTimes))).format();
    var alarm = {
        sensorId,
        date: lastMeasurementTimes,
        count:{
            day:0,
            night:0
        }
    };
    measurementTimes.map((time, index) =>{
        const hour = moment.utc(parseInt(time)).format("H");
        if (hour < 5 || hour > 23) {
            alarm.count.night +=parseInt(measurementValues[index]);
        } else {
            alarm.count.day +=parseInt(measurementValues[index]);
        }
    });
    return alarm;
}
