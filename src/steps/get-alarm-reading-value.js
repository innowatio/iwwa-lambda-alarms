import get from "lodash.get";
import sum from "lodash.sum";
import moment from "moment";

import getConsumptionAggregate from "./get-consumption-aggregate";
import getDailyAggregate from "./get-daily-aggregate";

function getMeasurementObject (aggregate) {
    const measurementTimes = get(aggregate, "measurementTimes", "").split(",");
    return (acc, value, index) => acc.concat({
        value,
        time: measurementTimes[index]
    });
}

function getSum (reading, aggregate) {
    const time = moment.utc(reading.date).valueOf();
    const readingMeasurementValue = parseFloat(reading.measurementValue);
    const measurements = aggregate ? (
        aggregate.measurementValues
            .split(",")
            // find if there is already the value passed from the reading at a time, and in case replace that.
            .reduce(getMeasurementObject(aggregate), [])
            .filter(x => x.time != time)
            .map(x => parseFloat(x.value))
            .concat(readingMeasurementValue)
    ) : [readingMeasurementValue];
    return parseFloat(sum(measurements).toFixed(3));
}

export default async function getAlarmReadingValue (alarm, reading) {
    switch (alarm.type) {
    case "daily": {
        const dailyAggregate = await getDailyAggregate(reading);
        return getSum(reading, dailyAggregate);
    }
    case "monthly": {
        const dailyAggregate = await getDailyAggregate(reading);
        const consumptionAggregate = await getConsumptionAggregate(reading);
        const readingDailyValue = getSum(reading, dailyAggregate);
        const index = {
            start: moment.utc(reading.date).startOf("month").dayOfYear(),
            end: moment.utc(reading.date).dayOfYear()
        };
        const monthlyConsumption = get(consumptionAggregate, "measurementValues", "")
            .split(",")
            .slice(index.start - 1, index.end - 1)
            .map(x => parseFloat(x) || 0);
        return parseFloat(sum(monthlyConsumption.concat(readingDailyValue)).toFixed(3));
    }
    case "realtime":
    default:
        return parseFloat(reading.measurementValue);
    }
}
