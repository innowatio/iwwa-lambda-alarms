import {expect} from "chai";

import parseAggregate from "steps/parse-aggregate";

describe("`parseAggregate` function", () => {

    const aggregate = {
        _id: "alarmIdRealtime-2016-01-28",
        date: "2016-01-28",
        alarmId: "alarmIdRealtime",
        triggered: true,
        measurementValues: "0,0,0,0,1,1,1",
        measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000"
    };

    it("return the parsed aggregate", () => {
        const ret = parseAggregate(aggregate);
        expect(ret).to.deep.equal({
            _id: "alarmIdRealtime-2016-01-28",
            date: "2016-01-28",
            alarmId: "alarmIdRealtime",
            triggered: true,
            measurementValues: "0,0,0,0,1,1,1",
            measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000",
            measurements: [{
                value: 0,
                time: 1453939200000
            }, {
                value: 0,
                time: 1453942800000
            }, {
                value: 0,
                time: 1453946400000
            }, {
                value: 0,
                time: 1453950000000
            }, {
                value: 1,
                time: 1453953600000
            }, {
                value: 1,
                time: 1453957200000
            }, {
                value: 1,
                time: 1453960800000
            }]
        });
    });

});
