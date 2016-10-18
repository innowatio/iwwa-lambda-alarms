import assert from "assert";
import isString from "lodash.isstring";
import get from "lodash.get";

function getReadingSource (reading) {
    const source = (
        reading.source ? reading.source : get(reading, "measurements.0.source")
    );
    assert(isString(source), "Reading has no source");
    return source;
}

export default function spreadReadingByMeasurementType (reading) {
    const source = getReadingSource(reading);
    return reading.measurements.map(measurement => ({
        sensorId: reading.sensorId,
        date: reading.date,
        source,
        measurementType: measurement.type,
        measurementValue: measurement.value,
        unitOfMeasurement: measurement.unitOfMeasurement
    }));
}
