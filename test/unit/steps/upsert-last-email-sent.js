import {expect} from "chai";
import {ALARMS_COLLECTION_NAME} from "config";
import {getMongoClient} from "services/mongodb";
import moment from "moment";

import upsertLastEmailSent from "steps/upsert-last-email-sent";

describe("`upsertLastEmailSent` function", () => {
    const sensorId = "alarmIdRealtime";
    const alarmRealtime = {
        "_id": "alarmIdRealtime",
        "userId": "userId",
        "sensorId": "sensorId",
        "rule": "{\"$and\": [{\"measurementType\": \"activeEnergy\"}, {\"source\": \"reading\"}]}",
        "type": "realtime",
        "thresholdRule": "{\"$gt\": 1}",
        "unitOfMeasurement": "kWh",
        "threshold": 1,
        "email": true
    };
    var db;
    var alarms;
    before(async () => {
        db = await getMongoClient();
        alarms = db.collection(ALARMS_COLLECTION_NAME);
    });

    after(async () => {
        await db.dropCollection(ALARMS_COLLECTION_NAME);
    });

    afterEach(async () => {
        await alarms.remove({});
    });

    beforeEach(async () => {
        await alarms.insert(alarmRealtime);
    });

    it("upsert alarm whit the time of last sent mail", async () => {
        await upsertLastEmailSent(alarmRealtime);

        const result = await alarms.findOne({_id: sensorId});
        expect(result).to.deep.equal({
            ...alarmRealtime,
            lastEmailSent: moment().unix()
        });

    });
});
