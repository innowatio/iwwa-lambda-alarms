export default function stringifyAggregate (aggregate) {
    return {
        ...aggregate,
        measurementValues: aggregate.measurementValues.join(","),
        measurementTimes: aggregate.measurementTimes.join(",")
    };
}
