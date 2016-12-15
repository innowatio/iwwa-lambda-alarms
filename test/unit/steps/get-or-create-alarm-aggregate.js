import {expect} from "chai";
import moment from "moment";

import {ALARMS_AGGREGATES_COLLECTION_NAME} from "config";
import {alarmDaily, alarmMonthly, alarmRealtime, getEnergyReadings} from "../../utils";
import {getMongoClient} from "services/mongodb";
import {getOrCreateAlarmAggregate} from "steps/get-or-create-alarm-aggregate";

describe("`getOrCreateAlarmAggregate` function", () => {
    const lastEmailSent = moment().subtract(1, "hour").unix();
    var db;
    var alarmsAggregates;

    before(async () => {
        db = await getMongoClient();
        alarmsAggregates = db.collection(ALARMS_AGGREGATES_COLLECTION_NAME);
    });

    after(async () => {
        await db.dropCollection(ALARMS_AGGREGATES_COLLECTION_NAME);
    });

    beforeEach(async () => {
        await alarmsAggregates.remove({});
    });

    describe("with alarm of type realtime", () => {

        it("return the aggregate found in db", async () => {
            const alarmAggregate = {
                _id: "alarmIdRealtime-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdRealtime",
                triggered: true,
                measurementValues: "0,0,0,0,1,1,1,1,1,0",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000,1453964400000,1453968000000,1453971600000"
            };
            const reading = getEnergyReadings("2016-01-28T00:16:36.389Z").data.element;
            await alarmsAggregates.insert(alarmAggregate);
            const ret = await getOrCreateAlarmAggregate(reading, alarmRealtime(2, lastEmailSent));
            expect(ret).to.deep.equal(alarmAggregate);
        });

        it("return the default aggregate if the aggregate is not found in db", async () => {
            const expectedAggregate = {
                _id: "alarmIdRealtime-2016-10-28",
                date: "2016-10-28",
                alarmId: "alarmIdRealtime",
                triggered: false,
                measurementValues: null,
                measurementTimes: null
            };
            const reading = getEnergyReadings("2016-10-28T00:16:36.389Z").data.element;
            const ret = await getOrCreateAlarmAggregate(reading, alarmRealtime(3, lastEmailSent));
            expect(ret).to.deep.equal(expectedAggregate);
        });

    });

    describe("with alarm of type daily", () => {

        it("return the aggregate found in db", async () => {
            const alarmAggregate = {
                _id: "alarmIdDaily-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdDaily",
                triggered: true,
                measurementValues: "0,0,0,0,1,1,1,1,1,0",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000,1453964400000,1453968000000,1453971600000"
            };
            const reading = getEnergyReadings("2016-01-28T00:16:36.389Z").data.element;
            await alarmsAggregates.insert(alarmAggregate);
            const ret = await getOrCreateAlarmAggregate(reading, alarmDaily(10, lastEmailSent));
            expect(ret).to.deep.equal(alarmAggregate);
        });

        it("return the default aggregate if the aggregate is not found in db", async () => {
            const expectedAggregate = {
                _id: "alarmIdDaily-2016-10-28",
                date: "2016-10-28",
                alarmId: "alarmIdDaily",
                triggered: false,
                measurementValues: null,
                measurementTimes: null
            };
            const reading = getEnergyReadings("2016-10-28T00:16:36.389Z").data.element;
            const ret = await getOrCreateAlarmAggregate(reading, alarmDaily(10, lastEmailSent));
            expect(ret).to.deep.equal(expectedAggregate);
        });

    });

    describe("with alarm of type monthly", () => {

        it("return the aggregate found in db", async () => {
            const alarmAggregate = {
                _id: "alarmIdMonthly-2016-01",
                date: "2016-01",
                alarmId: "alarmIdMonthly",
                triggered: true,
                measurementValues: "0,0,0,0,1,1,1,1,1,0",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000,1453964400000,1453968000000,1453971600000"
            };
            const reading = getEnergyReadings("2016-01-28T00:16:36.389Z").data.element;
            await alarmsAggregates.insert(alarmAggregate);
            const ret = await getOrCreateAlarmAggregate(reading, alarmMonthly(10));
            expect(ret).to.deep.equal(alarmAggregate);
        });

        it("return the default aggregate if the aggregate is not found in db", async () => {
            const expectedAggregate = {
                _id: "alarmIdMonthly-2016-10",
                date: "2016-10",
                triggered: false,
                alarmId: "alarmIdMonthly",
                measurementValues: null,
                measurementTimes: null
            };
            const reading = getEnergyReadings("2016-10-28T00:16:36.389Z").data.element;
            const ret = await getOrCreateAlarmAggregate(reading, alarmMonthly(10));
            expect(ret).to.deep.equal(expectedAggregate);
        });

    });


});
