import siftValidator from "../lib/sift-validator";
import getAlarmReadingValue from "./get-alarm-reading-value";
import {getOrCreateAlarmAggregate} from "./get-or-create-alarm-aggregate";
import parseAggregate from "./parse-aggregate";
import pushNotification from "./push-notifications";
import log from "../services/logger";
import {triggerPushNotifications} from "./trigger-push-notifications";
import stringifyAggregate from "./stringify-aggregate";
import updateAlarmAggregate from "./update-alarm-aggregate";
import upsertAggregate from "./upsert-aggregate";

export default async function checkAndUpdateAlarm (alarm, reading, event) {
    log.debug("alarm", alarm);
    // Skip if alarm not match the rule
    if (!siftValidator(alarm.rule, reading)) {
        log.info("ALARM SKIPPED BY RULE");
        return null;
    }
    const alarmReadingValue = await getAlarmReadingValue(alarm, reading);
    const alarmTriggerStatus = siftValidator(alarm.thresholdRule, alarmReadingValue); // boolean
    log.debug("Alarm trigger status", alarmTriggerStatus);
    if (alarm.type !== "realtime" && !alarmTriggerStatus) {
        log.info("Periodic alarm skipped", alarm);
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
    }
}
