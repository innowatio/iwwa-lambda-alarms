import get from "lodash.get";

export default function (reading) {
    return (
        !reading ||
        !reading.sensorId ||
        !reading.date,
        !reading.measurements ||
        !(reading.source || get(reading, "measurements.0.source"))
    );
}
