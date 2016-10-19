import {expect} from "chai";
import sinon from "sinon";

import {isAlarmEnded, isAlarmTriggeredForTheFirstTime, triggerPushNotifications} from "steps/trigger-push-notifications";
import {getEnergyReadings} from "../../utils";

describe("trigger-push-notifications file", () => {

    var clock;

    before(() => {
        clock = sinon.useFakeTimers(1453939200000);
    });

    after(() => {
        clock.restore();
    });

    describe("`triggerPushNotifications` function", () => {

        it("return `false` if event is archived", () => {
            const event = getEnergyReadings("2016-01-28T00:16:36.389Z", undefined, undefined, true);
            const ret = triggerPushNotifications(event);
            expect(ret).to.equal(false);
        });

        it("return `false` if there isn't a today reading", () => {
            const event = getEnergyReadings("2016-01-27T00:16:36.389Z", undefined);
            const ret = triggerPushNotifications(event, event.data.element);
            expect(ret).to.equal(false);
        });

    });

    describe("`isAlarmTriggeredForTheFirstTime` function", () => {

        it("return `false` if no aggregate passed as argument", () => {
            const event = getEnergyReadings("2016-01-28T00:16:36.389Z", undefined);
            const ret = isAlarmTriggeredForTheFirstTime(event.data.element);
            expect(ret).to.equal(false);
        });

        it("return `false` if alarm time is not present in alarm aggregate", () => {
            const event = getEnergyReadings("2016-01-28T00:16:36.389Z", undefined);
            const alarmAggregate = {
                _id: "alarmId-2016-01-28",
                alarmId: "alarmId",
                date: "2016-01-28",
                triggered: false,
                measurementValues: "0",
                measurementTimes: "1453940201950"
            };
            const ret = isAlarmTriggeredForTheFirstTime(event.data.element, alarmAggregate);
            expect(ret).to.equal(false);
        });

        it("return `true` if alarm time triggered is the first in the selected day", () => {
            const event = getEnergyReadings("2016-01-28T00:16:36.389Z", undefined);
            const alarmAggregate = {
                _id: "alarmId-2016-01-28",
                alarmId: "alarmId",
                date: "2016-01-28",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453940196389"
            };
            const ret = isAlarmTriggeredForTheFirstTime(event.data.element, alarmAggregate);
            expect(ret).to.equal(true);
        });

        it("return `false` if alarm time triggered is in a series", () => {
            const event = getEnergyReadings("2016-01-28T02:41:36.389Z", undefined);
            const alarmAggregate = {
                _id: "alarmId-2016-01-28",
                alarmId: "alarmId",
                date: "2016-01-28",
                triggered: true,
                measurementValues: "0,0,1,1",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453948896389"
            };
            const ret = isAlarmTriggeredForTheFirstTime(event.data.element, alarmAggregate);
            expect(ret).to.equal(false);
        });

        it("return `true` if alarm triggered is the first of a series", () => {
            const event = getEnergyReadings("2016-01-28T02:41:36.389Z", undefined);
            const alarmAggregate = {
                _id: "alarmId-2016-01-28",
                alarmId: "alarmId",
                date: "2016-01-28",
                triggered: true,
                measurementValues: "0,0,0,1",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453948896389"
            };
            const ret = isAlarmTriggeredForTheFirstTime(event.data.element, alarmAggregate);
            expect(ret).to.equal(true);
        });

    });

    describe("`isAlarmEnded` function", () => {

        it("return `false` if no aggregate passed as argument", () => {
            const event = getEnergyReadings("2016-01-28T00:16:36.389Z", undefined);
            const ret = isAlarmEnded(event.data.element);
            expect(ret).to.equal(false);
        });

        it("return `false` if alarm time is not present in alarm aggregate", () => {
            const event = getEnergyReadings("2016-01-28T00:16:36.389Z", undefined);
            const alarmAggregate = {
                _id: "alarmId-2016-01-28",
                alarmId: "alarmId",
                date: "2016-01-28",
                triggered: false,
                measurementValues: "0",
                measurementTimes: "1453940201950"
            };
            const ret = isAlarmEnded(event.data.element, alarmAggregate);
            expect(ret).to.equal(false);
        });

        it("return `false` if alarm time triggered is the first in the selected day", () => {
            const event = getEnergyReadings("2016-01-28T00:16:36.389Z", undefined);
            const alarmAggregate = {
                _id: "alarmId-2016-01-28",
                alarmId: "alarmId",
                date: "2016-01-28",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453940196389"
            };
            const ret = isAlarmEnded(event.data.element, alarmAggregate);
            expect(ret).to.equal(false);
        });

        it("return `false` if is not the end of a alarm", () => {
            const event = getEnergyReadings("2016-01-28T02:41:36.389Z", undefined);
            const alarmAggregate = {
                _id: "alarmId-2016-01-28",
                alarmId: "alarmId",
                date: "2016-01-28",
                triggered: true,
                measurementValues: "0,1,0,0",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453948896389"
            };
            const ret = isAlarmEnded(event.data.element, alarmAggregate);
            expect(ret).to.equal(false);
        });

        it("return `true` if alarm end", () => {
            const event = getEnergyReadings("2016-01-28T02:41:36.389Z", undefined);
            const alarmAggregate = {
                _id: "alarmId-2016-01-28",
                alarmId: "alarmId",
                date: "2016-01-28",
                triggered: true,
                measurementValues: "0,1,1,1",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453948896389"
            };
            const ret = isAlarmEnded(event.data.element, alarmAggregate);
            expect(ret).to.equal(true);
        });

    });

});
