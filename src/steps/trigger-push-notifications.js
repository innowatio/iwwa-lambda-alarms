import moment from "moment";

function isTodayReading (reading) {
    return moment.utc(reading.date).format("YYYY-MM-DD") === moment.utc().format("YYYY-MM-DD");
}

export function triggerPushNotifications (event, reading) {
    return !event.archived && isTodayReading(reading);
}

export function isAlarmTriggeredForTheFirstTime (reading, alarmAggregate) {
    if (!alarmAggregate) {
        return false;
    }
    const {measurementValues, measurementTimes} = alarmAggregate;
    const date = moment.utc(reading.date).valueOf();
    const alarmReadingIndex = measurementTimes.split(",").indexOf(date.toString());
    // If reading date is not found in alarm reading date, not send push
    // notification
    if (alarmReadingIndex < 0) {
        return false;
    }
    // If the first reading in a day trigger an alarm, send the push
    // notification
    if (alarmReadingIndex === 0) {
        return true;
    }
    // If the alarm triggered before is 0, push notification should be triggered
    // The expected behaviour is to send the push notification only the first
    // time an alarm is triggered, and not all the time the value is over the
    // threshold
    return measurementValues.split(",")[alarmReadingIndex - 1] == 0;
}

export function isAlarmEnded (reading, alarmAggregate) {
    if (!alarmAggregate) {
        return false;
    }
    const {measurementValues, measurementTimes} = alarmAggregate;
    const date = moment.utc(reading.date).valueOf();
    const alarmReadingIndex = measurementTimes.split(",").indexOf(date.toString());
    // When alarm is not triggered and reading date is not found in alarm
    // reading date, or if is the first reading of the current day, not trigger
    // a push notification
    if (alarmReadingIndex <= 0) {
        return false;
    }
    // If the alarm triggered before is 1, push notification should be triggered
    // The expected behaviour is to send the push notification when the alarm is
    // ended, so the measurement values is passed from 1 to 0
    return measurementValues.split(",")[alarmReadingIndex - 1] == 1;
}
