import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import moment from "moment";
chai.use(sinonChai);

import getAlarmReadingValue from "steps/get-alarm-reading-value";
import {
    alarmDaily,
    alarmMonthly,
    alarmRealtime,
    dayAggregateActiveEnergy,
    yearAggregateActiveEnergy
} from "../../utils";

describe("`getAlarmReadingValue` function", () => {
    const lastEmailSent = moment().subtract(1, "hour").unix();
    const getDailyAggregate = sinon.stub().returns(dayAggregateActiveEnergy);
    const getConsumptionAggregate = sinon.stub().returns(yearAggregateActiveEnergy);

    before(async () => {
        getAlarmReadingValue.__Rewire__("getDailyAggregate", getDailyAggregate);
        getAlarmReadingValue.__Rewire__("getConsumptionAggregate", getConsumptionAggregate);
    });

    after(async () => {
        getAlarmReadingValue.__ResetDependency__("getDailyAggregate");
        getAlarmReadingValue.__ResetDependency__("getConsumptionAggregate");
    });

    const readingActiveEnergy = {
        sensorId: "sensorId",
        date: "2016-01-27T01:05:00.000Z",
        source: "reading",
        measurementType: "activeEnergy",
        measurementValue: "3.560",
        unitOfMeasurement: "kWh"
    };

    describe("when alarm type is realtime", () => {

        it("return the parsed reading value", async () => {
            const ret = await getAlarmReadingValue(alarmRealtime, readingActiveEnergy);
            expect(ret).to.equal(3.56);
        });

    });

    describe("when alarm type is daily", () => {
        it("return the sum of the consumption of the day", async () => {
            const ret = await getAlarmReadingValue(alarmDaily(10, lastEmailSent), readingActiveEnergy);
            expect(ret).to.equal(16.66);
        });

        it("return the sum of the consumption of the day with the new value", async () => {
            const reading = {
                sensorId: "sensorId",
                date: "2016-01-27T23:16:40.000Z",
                source: "reading",
                measurementType: "activeEnergy",
                measurementValue: "2",
                unitOfMeasurement: "kWh"
            };
            const ret = await getAlarmReadingValue(alarmDaily(10, lastEmailSent), reading);
            expect(ret).to.equal(10.1);
        });

    });

    describe("when alarm type is monthly", () => {

        it("return the sum of the consumption of the month", async () => {
            const ret = await getAlarmReadingValue(alarmMonthly(10, lastEmailSent), readingActiveEnergy);
            expect(ret).to.equal(107.06);
        });

        it("return the sum of the consumption of the month with the new value", async () => {
            const reading = {
                sensorId: "sensorId",
                date: "2016-01-27T23:16:40.000Z",
                source: "reading",
                measurementType: "activeEnergy",
                measurementValue: "2",
                unitOfMeasurement: "kWh"
            };
            const ret = await getAlarmReadingValue(alarmMonthly(10, lastEmailSent), reading);
            expect(ret).to.equal(100.5);
        });

    });

    describe("when alarm is withot type key", () => {

        const alarm = {
            _id: "b391fbc3-8219-40f0-baac-9f4fdcebfe21",
            userId: "userId",
            sensorId: "sensorId",
            rule: "",
            threshold: ""
        };

        it("returns the reading value", async () => {
            const ret = await getAlarmReadingValue(alarm, readingActiveEnergy);
            expect(ret).to.equal(3.56);
        });

    });

});
