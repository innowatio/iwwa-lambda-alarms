import axios from "axios";

import {NOTIFICATIONS_API_ENDPOINT} from "../config";
import getMessage from "../lib/notification-message";
import log from "../services/logger";
import {isAlarmTriggeredForTheFirstTime, isAlarmEnded} from "./trigger-push-notifications";

function createBody (alarm, message) {
    return {
        type: "alarm",
        title: "Allarme",
        message,
        usersId: [alarm.userId]
    };
}

async function postPushNotification (alarm, message) {
    const body = createBody(alarm, message);
    log.info(body, `body of the post at: ${NOTIFICATIONS_API_ENDPOINT}`);
    if (body) {
        try {
            await axios.post(NOTIFICATIONS_API_ENDPOINT, body);
        } catch (e) {
            log.info(e, "error while performing post");
            throw new Error(e);
        }
    }
}

async function alarmTriggered (alarm, reading, alarmAggregate) {
    const message = getMessage(alarm, reading, alarmAggregate, "triggered");
    return isAlarmTriggeredForTheFirstTime(reading, alarmAggregate) ? await postPushNotification(alarm, message) : null;
}

async function alarmNotTriggered (alarm, reading, alarmAggregate) {
    const message = getMessage(alarm, reading, alarmAggregate, "ended");
    return isAlarmEnded(reading, alarmAggregate) ? await postPushNotification(alarm, message) : null;
}

export default async function pushNotification (alarm, alarmTriggerStatus, reading, alarmAggregate) {
    return (
        alarmTriggerStatus ?
        await alarmTriggered(alarm, reading, alarmAggregate) :
        await alarmNotTriggered(alarm, reading, alarmAggregate)
    );
}
