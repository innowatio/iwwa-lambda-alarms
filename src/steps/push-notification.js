import {v4} from "node-uuid";

import {NOTIFICATIONS_INSERT, EVENT_EMAIL_INSERT} from "../config";
import getMessage from "../lib/notification-message";
import {getUserEmail} from "../steps/get-user-email";
import dispatchEvent from "../services/lk-dispatcher";
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

async function createEventEmail (userId, message) {
    const toAddresses = await getUserEmail(userId);
    return {
        element: {
            timestamp: new Date().toISOString(),
            toAddresses: toAddresses,
            message: message,
            subject: "Lucy Alarm"
        }
    };
}

async function putNotificationRecordsInKinesis (alarm, message) {
    const eventData = createEvent(alarm, message);
    const eventEmail = await createEventEmail(alarm.userId, message);
    log.info({eventData});

    // check if is enabled email notifications
    if (alarm.email) {
        await dispatchEvent(EVENT_EMAIL_INSERT, eventEmail);
    }

    await dispatchEvent(NOTIFICATIONS_INSERT, eventData);
}

async function alarmTriggered (alarm, reading, alarmAggregate) {
    const message = await getMessage(alarm, reading, alarmAggregate, "triggered");
    return isAlarmTriggeredForTheFirstTime(reading, alarmAggregate) ? await putNotificationRecordsInKinesis(alarm, message) : null;
}

async function alarmNotTriggered (alarm, reading, alarmAggregate) {
    const message = await getMessage(alarm, reading, alarmAggregate, "ended");
    return isAlarmEnded(reading, alarmAggregate) ? await putNotificationRecordsInKinesis(alarm, message) : null;
}

export default async function pushNotification (alarm, alarmTriggerStatus, reading, alarmAggregate) {
    return (
        alarmTriggerStatus ?
        await alarmTriggered(alarm, reading, alarmAggregate) :
        await alarmNotTriggered(alarm, reading, alarmAggregate)
    );
}
