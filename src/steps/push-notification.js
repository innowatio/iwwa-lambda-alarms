import {v4} from "node-uuid";

import {NOTIFICATIONS_INSERT} from "../config";
import getMessage from "../lib/notification-message";
import dispatchEvent from "../services/lk-dispatcher";
import {dispatchEmailEvent} from "../steps/dispatch-email-event";
import log from "../services/logger";
import {isAlarmTriggeredForTheFirstTime, isAlarmEnded} from "./trigger-push-notifications";

function createEvent (alarm, message) {
    return {
        element: {
            type: "alarm",
            title: "Allarme",
            message,
            usersId: [alarm.userId]
        },
        id: v4()
    };
}

async function putNotificationRecordsInKinesis (alarm, message) {
    const eventData = createEvent(alarm, message);
    log.info(eventData, "event put in kinesis");

    // check if is enabled email notifications
    if (alarm.email) {
        dispatchEmailEvent(alarm);
    }

    await dispatchEvent(NOTIFICATIONS_INSERT, eventData);
}

async function alarmTriggered (alarm, reading, alarmAggregate) {
    const message = getMessage(alarm, reading, alarmAggregate, "triggered");
    return isAlarmTriggeredForTheFirstTime(reading, alarmAggregate) ? await putNotificationRecordsInKinesis(alarm, message) : null;
}

async function alarmNotTriggered (alarm, reading, alarmAggregate) {
    const message = getMessage(alarm, reading, alarmAggregate, "ended");
    return isAlarmEnded(reading, alarmAggregate) ? await putNotificationRecordsInKinesis(alarm, message) : null;
}

export default async function pushNotification (alarm, alarmTriggerStatus, reading, alarmAggregate) {
    return (
        alarmTriggerStatus ?
        await alarmTriggered(alarm, reading, alarmAggregate) :
        await alarmNotTriggered(alarm, reading, alarmAggregate)
    );
}
