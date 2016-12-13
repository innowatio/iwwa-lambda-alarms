import {map} from "bluebird";

import log from "./services/logger";
import findAlarmsBySensor from "./steps/find-alarms-by-sensor";
import checkAndUpdateAlarm from "./steps/check-and-update-alarm";
import skipReading from "./steps/skip-reading";
import spreadReadingByMeasurementType from "./steps/spread-reading-by-measurement-type";

export default async function pipeline (event) {
    log.info({event});
    /*
    *   Workaround: some events have been incorrectly generated and thus don't
    *   have an `element` property. When processing said events, just return and
    *   move on without failing, as failures can block the kinesis stream.
    */
    const rawReading = event.data.element;
    if (skipReading(rawReading)) {
        return null;
    }
    // find all the alarms for the selected sensor
    const alarms = await findAlarmsBySensor(rawReading.sensorId);
    log.info({alarms});
    const readings = spreadReadingByMeasurementType(rawReading);

    await map(alarms, alarm => {
        return map(readings, async reading => await checkAndUpdateAlarm(alarm, reading, event));
    });
    return null;
}
