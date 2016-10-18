function getType (type) {
    switch (type) {
    case "daily":
        return "giornaliero";
    case "monthly":
        return "mensile";
    default:
        return "realtime";
    }
}

function getMeasurementType (measurementType) {
    switch (measurementType) {
    case "activeEnergy":
        return "energia attiva";
    case "reactiveEnergy":
        return "energia reattiva";
    case "maxPower":
        return "potenza massima";
    default:
        return "energia";
    }
}

function getPeriodicMessage (type, reading) {
    const period = getType(type);
    const measurementType = getMeasurementType(reading.measurementType);
    return `I consumi hanno superato il limite ${period} di ${measurementType} impostato.`;
}

function getRealtimeMessageTriggered (reading, alarm) {
    const measurementType = getMeasurementType(reading.measurementType);
    return `È stato superato il limite impostato per l'allarme di ${measurementType} superando il valore limite di ${alarm.threshold} ${alarm.unitOfMeasurement} con un valore di ${reading.measurementValue} ${reading.unitOfMeasurement}.`;
}

function getRealtimeMessageEnded (reading) {
    const measurementType = getMeasurementType(reading.measurementType);
    return `L'allarme di ${measurementType} è stato risolto`;
}

export default function getMessage (alarm, reading, alarmAggregate, status) {
    if (alarm.type !== "realtime") {
        return getPeriodicMessage(alarm.type, reading);
    }
    return (
        status === "triggered" ?
        getRealtimeMessageTriggered(reading, alarm) :
        getRealtimeMessageEnded(reading)
    );
}
