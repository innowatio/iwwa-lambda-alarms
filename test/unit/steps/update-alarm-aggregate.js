import {expect} from "chai";

import updateAlarmAggregate from "steps/update-alarm-aggregate";
import {alarmDaily, alarmRealtime, getEnergyReadings} from "../../utils";

describe("`updateAlarmAggregate` function", () => {

    const reading = getEnergyReadings("2016-01-28T02:16:36.389Z").data.element;

    describe("with alarm realtime", () => {

        it("update aggregate with the new value [CASE: alarm status `true`]", () => {
            const alarmStatus = true;
            const aggregate = {
                _id: "alarmIdRealtime-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdRealtime",
                triggered: true,
                measurementValues: "0,0,0,0,1,1,1",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000",
                measurements: [{
                    value: 0, time: 1453939200000
                }, {
                    value: 0, time: 1453942800000
                }, {
                    value: 0, time: 1453946400000
                }, {
                    value: 0, time: 1453950000000
                }, {
                    value: 1, time: 1453953600000
                }, {
                    value: 1, time: 1453957200000
                }, {
                    value: 1, time: 1453960800000
                }]
            };
            const ret = updateAlarmAggregate(aggregate, reading, alarmStatus, alarmRealtime(10));
            expect(ret).to.deep.equal({
                _id: "alarmIdRealtime-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdRealtime",
                triggered: true,
                measurementValues: [0, 0, 0, 1, 0, 1, 1, 1],
                measurementTimes: [
                    1453939200000,
                    1453942800000,
                    1453946400000,
                    1453947396389,
                    1453950000000,
                    1453953600000,
                    1453957200000,
                    1453960800000
                ]
            });
        });

        it("update aggregate with the new value [CASE: alarm status `false`]", () => {
            const alarmStatus = false;
            const aggregate = {
                _id: "alarmIdRealtime-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdRealtime",
                triggered: true,
                measurementValues: "0,0,0,0,1,1,1",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000",
                measurements: [{
                    value: 0, time: 1453939200000
                }, {
                    value: 0, time: 1453942800000
                }, {
                    value: 0, time: 1453946400000
                }, {
                    value: 0, time: 1453950000000
                }, {
                    value: 1, time: 1453953600000
                }, {
                    value: 1, time: 1453957200000
                }, {
                    value: 1, time: 1453960800000
                }]
            };
            const ret = updateAlarmAggregate(aggregate, reading, alarmStatus, alarmRealtime(10));
            expect(ret).to.deep.equal({
                _id: "alarmIdRealtime-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdRealtime",
                triggered: true,
                measurementValues: [0, 0, 0, 0, 0, 1, 1, 1],
                measurementTimes: [
                    1453939200000,
                    1453942800000,
                    1453946400000,
                    1453947396389,
                    1453950000000,
                    1453953600000,
                    1453957200000,
                    1453960800000
                ]
            });
        });

        it("update aggregate with the new value and set triggered to true if is the first alarm triggered", () => {
            const alarmStatus = true;
            const aggregate = {
                _id: "alarmIdRealtime-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdRealtime",
                triggered: false,
                measurementValues: null,
                measurementTimes: null,
                measurements: []
            };
            const ret = updateAlarmAggregate(aggregate, reading, alarmStatus, alarmRealtime(10));
            expect(ret).to.deep.equal({
                _id: "alarmIdRealtime-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdRealtime",
                triggered: true,
                measurementValues: [1],
                measurementTimes: [1453947396389]
            });
        });

    });

    describe("with periodic alarm triggered", () => {

        it("not update the aggregate if is already triggered", () => {
            const alarmStatus = true;
            const aggregate = {
                _id: "alarmId-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmId",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453939200000",
                measurements: [{
                    value: 1, time: 1453939200000
                }]
            };
            const ret = updateAlarmAggregate(aggregate, reading, alarmStatus, alarmDaily(1));
            expect(ret).to.deep.equal({
                _id: "alarmId-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmId",
                triggered: true,
                measurementValues: [1],
                measurementTimes: [1453939200000]
            });
        });

        it("update aggregate with the new value", () => {
            const alarmStatus = true;
            const aggregate = {
                _id: "alarmId-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmId",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453957200000",
                measurements: [{
                    value: 1, time: 1453957200000
                }]
            };
            const ret = updateAlarmAggregate(aggregate, reading, alarmStatus, alarmDaily(1));
            expect(ret).to.deep.equal({
                _id: "alarmId-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmId",
                triggered: true,
                measurementValues: [1],
                measurementTimes: [1453947396389]
            });
        });

        it("update aggregate with the new value and set triggered to true if is the first triggered alarm", () => {
            const alarmStatus = true;
            const aggregate = {
                _id: "alarmId-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmId",
                triggered: false,
                measurementValues: null,
                measurementTimes: null,
                measurements: []
            };
            const ret = updateAlarmAggregate(aggregate, reading, alarmStatus, alarmRealtime(1));
            expect(ret).to.deep.equal({
                _id: "alarmId-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmId",
                triggered: true,
                measurementValues: [1],
                measurementTimes: [1453947396389]
            });
        });

    });

    describe("with alarm periodic not triggered", () => {

        it("not update the aggregate [CASE: alarm already triggered]", () => {
            const alarmStatus = false;
            const aggregate = {
                _id: "alarmId-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmId",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453939200000",
                measurements: [{
                    value: 1, time: 1453939200000
                }]
            };
            const ret = updateAlarmAggregate(aggregate, reading, alarmStatus, alarmDaily(10));
            expect(ret).to.deep.equal({
                _id: "alarmId-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmId",
                triggered: true,
                measurementValues: [1],
                measurementTimes: [1453939200000]
            });
        });

        it("not update the aggregate [CASE: alarm not already triggered]}", () => {
            const alarmStatus = false;
            const aggregate = {
                _id: "alarmId-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmId",
                triggered: true,
                measurementValues: null,
                measurementTimes: null,
                measurements: []
            };
            const ret = updateAlarmAggregate(aggregate, reading, alarmStatus, alarmDaily(10));
            expect(ret).to.deep.equal(null);
        });

    });

});
