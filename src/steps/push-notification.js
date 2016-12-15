import {v4} from "node-uuid";
import moment from "moment";

import {NOTIFICATIONS_INSERT, EVENT_EMAIL_INSERT, EMAIL_INTERVAL} from "../config";
import getMessage from "../lib/notification-message";
import {getUserEmail} from "./get-user-email";
import upsertLastEmailSent from "./upsert-last-email-sent.js";
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
        // check when last mail was sent
        const lastEmailSent = Number(alarm.lastEmailSent);
        const diff = moment().diff(moment(lastEmailSent*1000), "hours");
        const send = lastEmailSent ? diff >= EMAIL_INTERVAL : false;
        // if the last mail was sent not in the last hours send a new mail and update lastEmailSent
        if (send) {
            await dispatchEvent(EVENT_EMAIL_INSERT, eventEmail);
            await upsertLastEmailSent(alarm);
        }
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
