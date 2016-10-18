function addSource (reading, source, measurementLevel) {
    if (measurementLevel) {
        reading.data.element.measurements.forEach(measurement => {
            measurement.source = source;
        });
        return reading;
    } else {
        reading.data.element.source = source;
        return reading;
    }
}

export function getEnergyReadings (date, source = "reading", measurementLevelSource, archived = true) {
    return addSource({
        "id": "eventId",
        "data": {
            "element": {
                "sensorId": "sensorId",
                "date": date,
                "measurements": [
                    {
                        "type": "activeEnergy",
                        "value": "3.808",
                        "unitOfMeasurement": "kWh"
                    },
                    {
                        "type": "reactiveEnergy",
                        "value": "2.085",
                        "unitOfMeasurement": "kVArh"
                    },
                    {
                        "type": "maxPower",
                        "value": "1.000",
                        "unitOfMeasurement": "VAr"
                    }
                ]
            },
            "id": "electricalReadingId"
        },
        "timestamp": 1420070400000,
        "type": "element inserted in collection readings",
        "archived": archived
    }, source, measurementLevelSource);
}

export const alarmRealtime = (thresholdValue) => ({
    "_id": "alarmIdRealtime",
    "userId": "userId",
    "sensorId": "sensorId",
    "rule": '{"$and": [{"measurementType": "activeEnergy"}, {"source": "reading"}]}',
    "type": "realtime",
    "thresholdRule": `{"$gt": ${thresholdValue}}`,
    "unitOfMeasurement": "kWh",
    "threshold": thresholdValue
});

export const alarmDaily  = (thresholdValue) => ({
    "_id": "alarmIdDaily",
    "userId": "userId",
    "sensorId": "sensorId",
    "rule": '{"$and": [{"measurementType": "activeEnergy"}, {"source": "reading"}]}',
    "type": "daily",
    "thresholdRule": `{"$gt": ${thresholdValue}}`,
    "unitOfMeasurement": "kWh",
    "threshold": thresholdValue
});

export const alarmMonthly = (thresholdValue) => ({
    "_id": "alarmIdMonthly",
    "userId": "userId",
    "sensorId": "sensorId",
    "rule": '{"$and": [{"measurementType": "activeEnergy"}, {"source": "reading"}]}',
    "type": "monthly",
    "thresholdRule": `{"$gt": ${thresholdValue}}`,
    "unitOfMeasurement": "kWh",
    "threshold": thresholdValue
});

export const dayAggregateActiveEnergy = {
    sensorId: "sensor1",
    day: "2016-01-27",
    source: "reading",
    measurementType: "activeEnergy",
    measurementValues: "1.1,1,5,6",
    measurementTimes: "1453935600000,1453935900000,1453936600000,1453938600000",
    unitOfMeasurement: "kWh"
};

export const yearAggregateActiveEnergy = {
    _id: "sensor1-2016-reading-activeEnergy",
    year: "2016",
    sensorId: "sensor1",
    source: "reading",
    measurementType: "activeEnergy",
    measurementValues: "1,2,,4,5,6,7,,,,8.8,3.6,,3,9,,6,,5,5,,6,7,5,4,3,2,4,6,7,8,9,7,,3,,7,5,4,,,,45,,7,5,",
    unitOfMeasurement: "kWh",
    measurementsDeltaInMs: 86400000
};
