import moment from "moment";

function updateRealtimeAlarmAggregate (aggregate, sortedMeasurements) {
    const measurementValues = sortedMeasurements.map(x => x.value);
    return {
        _id: aggregate._id,
        date: aggregate.date,
        alarmId: aggregate.alarmId,
        triggered: measurementValues.indexOf(1) >= 0,
        measurementValues,
        measurementTimes: sortedMeasurements.map(x => x.time)
    };
}

function updatePeriodicAlarmAggregate (aggregate, sortedMeasurements) {
    const measurement = sortedMeasurements.find(agg => agg.value === 1);
    return measurement ? {
        _id: aggregate._id,
        date: aggregate.date,
        alarmId: aggregate.alarmId,
        triggered: true,
        measurementValues: [measurement.value],
        measurementTimes: [measurement.time]
    } : null;
}

export default function updateAlarmAggregate (aggregate, reading, alarmStatus, alarm) {
    const value = alarmStatus ? 1 : 0;
    const time = moment.utc(reading.date).valueOf();
    const filteredMeasurements = aggregate.measurements.filter(x => x.time != time);
    const updatedMeasurements = [...filteredMeasurements, {
        value,
        time
    }];
    const sortedMeasurements = updatedMeasurements.sort((x, y) => x.time - y.time);
    return alarm.type === "realtime" ?
        updateRealtimeAlarmAggregate(aggregate, sortedMeasurements) :
        updatePeriodicAlarmAggregate(aggregate, sortedMeasurements);
}
