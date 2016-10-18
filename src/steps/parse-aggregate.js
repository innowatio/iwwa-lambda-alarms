function parse (measure, parseFunc) {
    return measure !== null ? (
        measure
            .split(",")
            .map(value => parseFunc(value))
    ) : [];
}

export default function parseAggregate (aggregate) {
    const measurementValues = parse(aggregate.measurementValues, parseFloat);
    const measurementTimes = parse(aggregate.measurementTimes, parseInt);
    const measurements = measurementValues.map((value, index) => {
        return {
            value,
            time: measurementTimes[index]
        };
    }).sort((x, y) => x.time - y.time);

    return {
        ...aggregate,
        measurements
    };
}
