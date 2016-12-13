import {getSensorInfo} from "./get-sensor-info";

export function getType (type) {
    switch (type) {
    case "daily":
        return "giornaliero";
    case "monthly":
        return "mensile";
    default:
        return "realtime";
    }
}

export function getMeasurementType (measurementType) {
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

function getPeriodicMessage (type, reading, sensorInfo) {
    const period = getType(type);
    const measurementType = getMeasurementType(reading.measurementType);
    const {sensorName, siteName} = sensorInfo;
    return `I consumi per il sensore ${sensorName} del sito ${siteName} hanno superato il limite ${period} di ${measurementType} impostato.`;
}

function getRealtimeMessageTriggered (reading, alarm, sensorInfo) {
    const measurementType = getMeasurementType(reading.measurementType);
    const {sensorName, siteName} = sensorInfo;
    return `È stato superato il limite impostato per l'allarme del sensore ${sensorName} del sito ${siteName} di ${measurementType} superando il valore limite di ${alarm.threshold} ${alarm.unitOfMeasurement} con un valore di ${reading.measurementValue} ${reading.unitOfMeasurement}.`;
}

function getRealtimeMessageEnded (reading, sensorInfo) {
    const measurementType = getMeasurementType(reading.measurementType);
    const {sensorName, siteName} = sensorInfo;
    return `L'allarme del sensore ${sensorName} del sito ${siteName} di ${measurementType} è stato risolto`;
}

export default async function getMessage (alarm, reading, alarmAggregate, status) {
    const sensorInfo = await getSensorInfo(alarm.sensorId);
    if (alarm.type !== "realtime") {
        return getPeriodicMessage(alarm.type, reading, sensorInfo);
    }
    return (
        status === "triggered" ?
        getRealtimeMessageTriggered(reading, alarm, sensorInfo) :
        getRealtimeMessageEnded(reading, sensorInfo)
    );
}
