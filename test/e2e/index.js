import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import nock from "nock";
chai.use(sinonChai);

import {handler} from "index";
import {
    SITE_COLLECTION_NAME,
    SENSOR_COLLECTION_NAME,
    ALARMS_COLLECTION_NAME,
    ALARMS_AGGREGATES_COLLECTION_NAME,
    DAILY_AGGREGATES_COLLECTION_NAME,
    CONSUMPTION_AGGREGATES_COLLECTION_NAME,
    NOTIFICATIONS_INSERT,
    EVENT_EMAIL_INSERT,
    USERS_COLLECTION_NAME
} from "config";
import pipeline from "pipeline";
import {getMongoClient} from "services/mongodb";
import {run, getEventFromObject} from "../mocks";
import {
    alarmDaily,
    alarmMonthly,
    alarmRealtime,
    getEnergyReadings,
    sensor,
    site,
    user,
} from "../utils";
import pushNotification from "steps/push-notification";


describe("On reading", () => {
    const realtimeMessageTriggered = "È stato superato il limite impostato per l'allarme del sensore Sensor Name del sito Site Name di energia attiva superando il valore limite di 2 kWh con un valore di 3.808 kWh.";
    const realtimeMessageTriggered2 = "È stato superato il limite impostato per l'allarme del sensore Sensor Name del sito Site Name di energia reattiva superando il valore limite di 2 kVArh con un valore di 2.085 kVArh.";
    const realtimeMessageEnded = "L'allarme del sensore Sensor Name del sito Site Name di energia attiva è stato risolto";
    const dailyMessage = "I consumi per il sensore Sensor Name del sito Site Name hanno superato il limite giornaliero di energia attiva impostato.";
    const monthlyMessage = "I consumi per il sensore Sensor Name del sito Site Name hanno superato il limite mensile di energia attiva impostato.";

    const dayAggregateActiveEnergy = {
        _id: "sensorId-2016-01-28-reading-activeEnergy",
        sensorId: "sensorId",
        day: "2016-01-28",
        source: "reading",
        measurementType: "activeEnergy",
        measurementValues: "1.1,1,5,6",
        measurementTimes: "1453935600000,1453935900000,1453936600000,1453938600000",
        unitOfMeasurement: "kWh"
    };

    const dayAggregateReactiveEnergy = {
        _id: "sensorId-2016-01-28-reading-reactiveEnergy",
        sensorId: "sensorId",
        day: "2016-01-28",
        source: "reading",
        measurementType: "reactiveEnergy",
        measurementValues: "3.1,2,1,6",
        measurementTimes: "1453935600000,1453935900000,1453936600000,1453938600000",
        unitOfMeasurement: "kWh"
    };

    const dayAggregateActiveEnergyForecast = {
        _id: "sensorId-2016-01-28-forecast-activeEnergy",
        sensorId: "sensorId",
        day: "2016-01-28",
        source: "forecast",
        measurementType: "activeEnergy",
        measurementValues: "5,6,2,1",
        measurementTimes: "1453935600000,1453935900000,1453936600000,1453938600000",
        unitOfMeasurement: "kWh"
    };

    const yearAggregateActiveEnergy = {
        _id: "sensorId-2016-reading-activeEnergy",
        year: "2016",
        sensorId: "sensorId",
        source: "reading",
        measurementType: "activeEnergy",
        measurementValues: "1,2,,4,5,6,7,,,,8.8,3.6,,3,9,,6,,5,5,,6,7,5,4,3,2,4,6,7,8,9,7,,3,,7,5,4,,,,45,,7,5,",
        unitOfMeasurement: "kWh",
        measurementsDeltaInMs: 86400000
    };

    const yearAggregateReactiveEnergy = {
        _id: "sensorId-2016-reading-reactiveEnergy",
        year: "2016",
        sensorId: "sensorId",
        source: "reading",
        measurementType: "reactiveEnergy",
        measurementValues: "1,2,,4,5,6,7,,,,8.8,3.6,,3,9,,6,,5,5,,6,7,5,4,3,2,4,6,7,8,9,7,,3,,7,5,4,,,,45,,7,5,",
        unitOfMeasurement: "kWh",
        measurementsDeltaInMs: 86400000
    };

    const expectedEventData = {
        element: {
            type: "alarm",
            title: "Allarme",
            message: realtimeMessageTriggered,
            usersId: ["userId"]
        },
        id: "d9b16d2d-9e08-4466-939f-534c8c25a00a"
    };

    const expectedEventDataSolved = {
        element: {
            type: "alarm",
            title: "Allarme",
            message: realtimeMessageEnded,
            usersId: ["userId"]
        },
        id: "d9b16d2d-9e08-4466-939f-534c8c25a00a"
    };

    var db;
    var users;
    var sites;
    var sensors;
    var alarms;
    var clock;
    var alarmsAggregates;
    var dailyAggregates;
    var yearlyAggregates;
    const v4 = sinon.stub().returns("d9b16d2d-9e08-4466-939f-534c8c25a00a");
    const dispatchEvent = sinon.spy();

    before(async () => {
        clock = sinon.useFakeTimers(1453939200000);

        nock("https://sso.innowatio.it/openam/json/users").get("/user.test").times(14).reply(200, {
            username: "user.test",
            realm: "/",
            uid: [ "user.test" ],
            inetUserStatus: [ "Active" ],
            mail: [ "user.test@mail.com" ]
        });

        db = await getMongoClient();
        users = db.collection(USERS_COLLECTION_NAME);
        sites = db.collection(SITE_COLLECTION_NAME);
        sensors = db.collection(SENSOR_COLLECTION_NAME);
        alarms = db.collection(ALARMS_COLLECTION_NAME);
        alarmsAggregates = db.collection(ALARMS_AGGREGATES_COLLECTION_NAME);
        dailyAggregates = db.collection(DAILY_AGGREGATES_COLLECTION_NAME);
        yearlyAggregates = db.collection(CONSUMPTION_AGGREGATES_COLLECTION_NAME);

        pushNotification.__Rewire__("dispatchEvent", dispatchEvent);
        pushNotification.__Rewire__("v4", v4);

    });

    after(async () => {
        clock.restore();
        await db.dropCollection(USERS_COLLECTION_NAME);
        await db.dropCollection(SITE_COLLECTION_NAME);
        await db.dropCollection(SENSOR_COLLECTION_NAME);
        await db.dropCollection(ALARMS_COLLECTION_NAME);
        await db.dropCollection(ALARMS_AGGREGATES_COLLECTION_NAME);
        await db.dropCollection(DAILY_AGGREGATES_COLLECTION_NAME);
        await db.dropCollection(CONSUMPTION_AGGREGATES_COLLECTION_NAME);
        pushNotification.__ResetDependency__("dispatchEvent");
        pushNotification.__ResetDependency__("v4");

    });

    afterEach(async () => {
        await alarms.remove({});
        await sites.remove({});
        await sensors.remove({});
        await users.remove({});
        await alarmsAggregates.remove({});
        await dailyAggregates.remove({});
        await yearlyAggregates.remove({});
    });

    beforeEach(async () => {
        dispatchEvent.reset();
        await sites.insert(site);
        await sensors.insert(sensor);
        await users.insert(user);
        await dailyAggregates.insert(dayAggregateActiveEnergy);
        await dailyAggregates.insert(dayAggregateReactiveEnergy);
        await dailyAggregates.insert(dayAggregateActiveEnergyForecast);
        await yearlyAggregates.insert(yearAggregateActiveEnergy);
        await yearlyAggregates.insert(yearAggregateReactiveEnergy);
    });

    describe("realtime alarm for the selected sensorId", () => {

        describe("without an alarm aggregate", () => {

            it("save the correct reading on alarm aggregated collection [CASE: alarm not triggered]", async () => {
                await alarms.insert(alarmRealtime(10));
                const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
                const expectedAlarmAggregate = [{
                    _id: "alarmIdRealtime-2016-01-28",
                    alarmId: "alarmIdRealtime",
                    date: "2016-01-28",
                    triggered: false,
                    measurementValues: "0",
                    measurementTimes: "1453940196389"
                }];
                await run(handler, event);
                const alarmAggregate = await alarmsAggregates.find({}).toArray();
                expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
            });

            it("don't put the event in kinesis stream [CASE: alarm triggered]", async () => {
                await alarms.insert(alarmRealtime(10));
                const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
                await run(handler, event);
                expect(dispatchEvent).to.have.callCount(0);
            });

            it("save the correct reading on alarm aggregated collection [CASE: alarm triggered]", async () => {
                await alarms.insert(alarmRealtime(2));
                const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
                const expectedAlarmAggregate = [{
                    _id: "alarmIdRealtime-2016-01-28",
                    alarmId: "alarmIdRealtime",
                    date: "2016-01-28",
                    triggered: true,
                    measurementValues: "1",
                    measurementTimes: "1453940196389"
                }];
                await run(handler, event);
                const alarmAggregate = await alarmsAggregates.find({}).toArray();
                expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
            });

            it("put the event in kinesis stream [CASE: alarm triggered]", async () => {
                await alarms.insert(alarmRealtime(2));
                const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));

                const expectedEventEmail = {
                    element: {
                        timestamp: new Date().toISOString(),
                        toAddresses: ["user.test@mail.com"],
                        message: realtimeMessageTriggered,
                        subject: "Lucy Alarm"
                    }
                };

                await run(handler, event);
                expect(dispatchEvent).to.have.callCount(2);

                expect(dispatchEvent.firstCall).to.have.been.calledWith(
                    EVENT_EMAIL_INSERT,
                    expectedEventEmail
                );

                expect(dispatchEvent.secondCall).to.have.been.calledWith(
                    NOTIFICATIONS_INSERT,
                    expectedEventData
                );
            });
            it("don't put the event in kinesis stream [CASE: alarm triggered but already archived]", async () => {
                await alarms.insert(alarmRealtime(2));
                const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading", undefined, true));
                await run(handler, event);
                expect(dispatchEvent).to.have.callCount(0);
            });
        });

        describe("with an alarm aggregate [CASE: alarm already triggered]", () => {

            const realtimeAlarmAggregate = {
                _id: "alarmIdRealtime-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdRealtime",
                triggered: true,
                measurementValues: "0,0,0,0,1,1,1,1,1,0",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000,1453964400000,1453968000000,1453971600000"
            };

            it("save the correct reading on alarm aggregated collection [CASE: alarm not triggered]", async () => {
                await alarms.insert(alarmRealtime(10));
                await alarmsAggregates.insert(realtimeAlarmAggregate);
                const event = getEventFromObject(getEnergyReadings("2016-01-28T07:41:36.389Z", "reading"));
                const expectedAlarmAggregate = [{
                    _id: "alarmIdRealtime-2016-01-28",
                    date: "2016-01-28",
                    alarmId: "alarmIdRealtime",
                    triggered: true,
                    measurementValues: "0,0,0,0,1,1,1,1,0,1,0",
                    measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000,1453964400000,1453966896389,1453968000000,1453971600000"
                }];
                await run(handler, event);
                const alarmAggregate = await alarmsAggregates.find({}).toArray();
                expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
            });

            it("put the correct notifications event in kinesis stream [CASE: alarm ended]", async () => {
                await alarms.insert(alarmRealtime(10));
                await alarmsAggregates.insert(realtimeAlarmAggregate);
                const event = getEventFromObject(getEnergyReadings("2016-01-28T07:41:36.389Z", "reading"));

                const expectedEventEmail = {
                    element: {
                        timestamp: new Date().toISOString(),
                        toAddresses: ["user.test@mail.com"],
                        message: realtimeMessageEnded,
                        subject: "Lucy Alarm"
                    }
                };

                await run(handler, event);
                expect(dispatchEvent).to.have.callCount(2);

                expect(dispatchEvent.firstCall).to.have.been.calledWith(
                    EVENT_EMAIL_INSERT,
                    expectedEventEmail
                );

                expect(dispatchEvent.secondCall).to.have.been.calledWith(
                    NOTIFICATIONS_INSERT,
                    expectedEventDataSolved
                );
            });

            it("save the correct reading on alarm aggregated collection [CASE: alarm triggered]", async () => {
                await alarms.insert(alarmRealtime(2));
                await alarmsAggregates.insert(realtimeAlarmAggregate);
                const event = getEventFromObject(getEnergyReadings("2016-01-28T07:41:36.389Z", "reading"));
                const expectedAlarmAggregate = [{
                    _id: "alarmIdRealtime-2016-01-28",
                    date: "2016-01-28",
                    alarmId: "alarmIdRealtime",
                    triggered: true,
                    measurementValues: "0,0,0,0,1,1,1,1,1,1,0",
                    measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000,1453957200000,1453960800000,1453964400000,1453966896389,1453968000000,1453971600000"
                }];
                await run(handler, event);
                const alarmAggregate = await alarmsAggregates.find({}).toArray();
                expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
            });

            it("put the correct notifications event in kinesis stream [CASE: alarm triggered]", async () => {
                await alarms.insert(alarmRealtime(2));
                await alarmsAggregates.insert(realtimeAlarmAggregate);
                const event = getEventFromObject(getEnergyReadings("2016-01-28T04:00:00.000Z", "reading"));

                const expectedEventEmail = {
                    element: {
                        timestamp: new Date().toISOString(),
                        toAddresses: ["user.test@mail.com"],
                        message: realtimeMessageTriggered,
                        subject: "Lucy Alarm"
                    }
                };

                await run(handler, event);
                expect(dispatchEvent).to.have.callCount(2);

                expect(dispatchEvent.firstCall).to.have.been.calledWith(
                    EVENT_EMAIL_INSERT,
                    expectedEventEmail
                );

                expect(dispatchEvent.secondCall).to.have.been.calledWith(
                    NOTIFICATIONS_INSERT,
                    expectedEventData
                );
            });

        });

        describe("with an alarm aggregate [CASE: alarm never triggered]", () => {

            const realtimeAlarmAggregate = {
                _id: "alarmIdRealtime-2016-01-28",
                date: "2016-01-28",
                alarmId: "alarmIdRealtime",
                triggered: false,
                measurementValues: "0,0,0,0,0",
                measurementTimes: "1453939200000,1453942800000,1453946400000,1453950000000,1453953600000"
            };

            it("save the correct reading on alarm aggregated collection [CASE: alarm not triggered]", async () => {
                await alarms.insert(alarmRealtime(10));
                await alarmsAggregates.insert(realtimeAlarmAggregate);
                const event = getEventFromObject(getEnergyReadings("2016-01-28T02:41:36.389Z", "reading"));
                const expectedAlarmAggregate = [{
                    _id: "alarmIdRealtime-2016-01-28",
                    date: "2016-01-28",
                    alarmId: "alarmIdRealtime",
                    triggered: false,
                    measurementValues: "0,0,0,0,0,0",
                    measurementTimes: "1453939200000,1453942800000,1453946400000,1453948896389,1453950000000,1453953600000"
                }];
                await run(handler, event);
                const alarmAggregate = await alarmsAggregates.find({}).toArray();
                expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
            });

            it("don't call the dispatchEvent function [CASE: alarm not triggered]", async () => {
                await alarms.insert(alarmRealtime(10));
                await alarmsAggregates.insert(realtimeAlarmAggregate);
                const event = getEventFromObject(getEnergyReadings("2016-01-28T02:41:36.389Z", "reading"));
                await run(handler, event);
                expect(dispatchEvent).to.have.callCount(0);
            });

            it("save the correct reading on alarm aggregated collection [CASE: alarm triggered]", async () => {
                await alarms.insert(alarmRealtime(2));
                await alarmsAggregates.insert(realtimeAlarmAggregate);
                const event = getEventFromObject(getEnergyReadings("2016-01-28T02:41:36.389Z", "reading"));
                const expectedAlarmAggregate = [{
                    _id: "alarmIdRealtime-2016-01-28",
                    date: "2016-01-28",
                    alarmId: "alarmIdRealtime",
                    triggered: true,
                    measurementValues: "0,0,0,1,0,0",
                    measurementTimes: "1453939200000,1453942800000,1453946400000,1453948896389,1453950000000,1453953600000"
                }];
                await run(handler, event);
                const alarmAggregate = await alarmsAggregates.find({}).toArray();
                expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
            });

            it("put the correct notifications event in kinesis stream [CASE: alarm triggered]", async () => {
                await alarms.insert(alarmRealtime(2));
                await alarmsAggregates.insert(realtimeAlarmAggregate);
                const event = getEventFromObject(getEnergyReadings("2016-01-28T02:41:36.389Z", "reading"));

                const expectedEventEmail = {
                    element: {
                        timestamp: new Date().toISOString(),
                        toAddresses: ["user.test@mail.com"],
                        message: realtimeMessageTriggered,
                        subject: "Lucy Alarm"
                    }
                };

                await run(handler, event);
                expect(dispatchEvent).to.have.callCount(2);

                expect(dispatchEvent.firstCall).to.have.been.calledWith(
                    EVENT_EMAIL_INSERT,
                    expectedEventEmail
                );

                expect(dispatchEvent.secondCall).to.have.been.calledWith(
                    NOTIFICATIONS_INSERT,
                    expectedEventData
                );
            });

        });

    });

    describe("daily alarm for the selected sensorId", () => {

        it("with alarm not triggered skip the alarm aggregate update step", async () => {
            await alarms.insert(alarmDaily(20));
            const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
            await run(handler, event);
            const alarmAggregate = await alarmsAggregates.find({}).toArray();
            expect(alarmAggregate).to.deep.equal([]);
        });

        it("with alarm not triggered don't call the dispatchEvent function", async () => {
            await alarms.insert(alarmDaily(20));
            const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
            await run(handler, event);
            expect(dispatchEvent).to.have.callCount(0);
        });

        it("on alarm triggered save the correct reading on alarm aggregated collection", async () => {
            await alarms.insert(alarmDaily(16.907));
            const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
            const expectedAlarmAggregate = [{
                _id: "alarmIdDaily-2016-01-28",
                alarmId: "alarmIdDaily",
                date: "2016-01-28",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453940196389"
            }];
            await run(handler, event);
            const alarmAggregate = await alarmsAggregates.find({}).toArray();
            expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
        });

        it("on alarm triggered call the dispatchEvent function with correct event", async () => {
            await alarms.insert(alarmDaily(16));
            const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
            const expectedEventData = {
                element: {
                    type: "alarm",
                    title: "Allarme",
                    message: dailyMessage,
                    usersId: ["userId"]
                },
                id: "d9b16d2d-9e08-4466-939f-534c8c25a00a"
            };

            const expectedEventEmail = {
                element: {
                    timestamp: new Date().toISOString(),
                    toAddresses: ["user.test@mail.com"],
                    message: dailyMessage,
                    subject: "Lucy Alarm"
                }
            };

            await run(handler, event);
            expect(dispatchEvent).to.have.callCount(2);

            expect(dispatchEvent.firstCall).to.have.been.calledWith(
                EVENT_EMAIL_INSERT,
                expectedEventEmail
            );

            expect(dispatchEvent.secondCall).to.have.been.calledWith(
                NOTIFICATIONS_INSERT,
                expectedEventData
            );
        });

        it("on multiple reading save only the correct one on alarm aggregated collection", async () => {
            await alarms.insert(alarmDaily(16.907));
            const event1 = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
            const event2 = getEventFromObject(getEnergyReadings("2016-01-28T03:25:00.544Z", "reading"));
            const event3 = getEventFromObject(getEnergyReadings("2016-01-28T08:25:00.544Z", "reading"));
            const expectedAlarmAggregate = [{
                _id: "alarmIdDaily-2016-01-28",
                alarmId: "alarmIdDaily",
                date: "2016-01-28",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453940196389"
            }];
            await run(handler, event1);
            await run(handler, event2);
            await run(handler, event3);
            const alarmAggregate = await alarmsAggregates.find({}).toArray();
            expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
        });

    });

    describe("monthly alarm for the selected sensorId", () => {

        it("with alarm not triggered skip the alarm aggregate update step", async () => {
            await alarms.insert(alarmMonthly(110));
            const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
            await run(handler, event);
            const alarmAggregate = await alarmsAggregates.find({}).toArray();
            expect(alarmAggregate).to.deep.equal([]);
        });

        it("with alarm not triggered don't call the dispatchEvent function", async () => {
            await alarms.insert(alarmDaily(20));
            const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
            await run(handler, event);
            expect(dispatchEvent).to.have.callCount(0);
        });

        it("on alarm triggered save the correct reading on alarm aggregated collection", async () => {
            await alarms.insert(alarmMonthly(80));
            const event = getEventFromObject(getEnergyReadings("2016-01-28T01:14:26.389Z", "reading"));
            const expectedAlarmAggregate = [{
                _id: "alarmIdMonthly-2016-01",
                alarmId: "alarmIdMonthly",
                date: "2016-01",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453943666389"
            }];
            await run(handler, event);
            const alarmAggregate = await alarmsAggregates.find({}).toArray();
            expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
        });

        it("on alarm triggered call the dispatchEvent function with correct event", async () => {
            await alarms.insert(alarmMonthly(80));
            const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));

            const expectedEventData = {
                element: {
                    type: "alarm",
                    title: "Allarme",
                    message: monthlyMessage,
                    usersId: ["userId"]
                },
                id: "d9b16d2d-9e08-4466-939f-534c8c25a00a"
            };

            const expectedEventEmail = {
                element: {
                    timestamp: new Date().toISOString(),
                    toAddresses: ["user.test@mail.com"],
                    message: monthlyMessage,
                    subject: "Lucy Alarm"
                }
            };

            await run(handler, event);
            expect(dispatchEvent).to.have.callCount(2);

            expect(dispatchEvent.firstCall).to.have.been.calledWith(
                EVENT_EMAIL_INSERT,
                expectedEventEmail
            );

            expect(dispatchEvent.secondCall).to.have.been.calledWith(
                NOTIFICATIONS_INSERT,
                expectedEventData
            );
        });

        it("on multiple reading save only the correct one on alarm aggregated collection", async () => {
            await alarms.insert(alarmMonthly(80));
            const event1 = getEventFromObject(getEnergyReadings("2016-01-28T01:14:26.389Z", "reading"));
            const event2 = getEventFromObject(getEnergyReadings("2016-01-28T03:25:00.544Z", "reading"));
            const event3 = getEventFromObject(getEnergyReadings("2016-01-28T08:25:00.544Z", "reading"));
            const expectedAlarmAggregate = [{
                _id: "alarmIdMonthly-2016-01",
                alarmId: "alarmIdMonthly",
                date: "2016-01",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453943666389"
            }];
            await run(handler, event1);
            await run(handler, event2);
            await run(handler, event3);
            const alarmAggregate = await alarmsAggregates.find({}).toArray();
            expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
        });

    });

    describe("with more alarm on a sensorId", () => {

        it("save the correct reading on alarm aggregated collection and call dispatchEvent function with correct arguments", async () => {
            const alarm = {
                _id: "alarmIdRealtimeReactive",
                userId: "userId",
                sensorId: "sensorId",
                rule: '{"$and": [{"measurementType": "reactiveEnergy"}, {"source": "reading"}]}',
                type: "realtime",
                thresholdRule: '{"$gt": 2}',
                threshold: 2,
                unitOfMeasurement: "kVArh"
            };
            await alarms.insert(alarmRealtime(10));
            await alarms.insert(alarmDaily(20));
            await alarms.insert(alarmMonthly(2));
            await alarms.insert(alarm);
            const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
            const expectedAlarmAggregate = [{
                _id: "alarmIdRealtime-2016-01-28",
                alarmId: "alarmIdRealtime",
                date: "2016-01-28",
                triggered: false,
                measurementValues: "0",
                measurementTimes: "1453940196389"
            }, {
                _id: "alarmIdRealtimeReactive-2016-01-28",
                alarmId: "alarmIdRealtimeReactive",
                date: "2016-01-28",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453940196389"
            }, {
                _id: "alarmIdMonthly-2016-01",
                alarmId: "alarmIdMonthly",
                date: "2016-01",
                triggered: true,
                measurementValues: "1",
                measurementTimes: "1453940196389"
            }];
            const expectedBody1 = {
                element: {
                    type: "alarm",
                    title: "Allarme",
                    message: realtimeMessageTriggered2,
                    usersId: ["userId"]
                },
                id: "d9b16d2d-9e08-4466-939f-534c8c25a00a"
            };
            const expectedBody2 = {
                element: {
                    type: "alarm",
                    title: "Allarme",
                    message: monthlyMessage,
                    usersId: ["userId"]
                },
                id: "d9b16d2d-9e08-4466-939f-534c8c25a00a"
            };

            const expectedEventEmail = {
                element: {
                    timestamp: new Date().toISOString(),
                    toAddresses: ["user.test@mail.com"],
                    message: monthlyMessage,
                    subject: "Lucy Alarm"
                }
            };

            await run(handler, event);
            expect(dispatchEvent).to.have.callCount(3);
            expect(dispatchEvent.firstCall).to.have.been.calledWith(
                NOTIFICATIONS_INSERT,
                expectedBody1
            );
            expect(dispatchEvent.secondCall).to.have.been.calledWith(
                EVENT_EMAIL_INSERT,
                expectedEventEmail
            );
            expect(dispatchEvent.thirdCall).to.have.been.calledWith(
                NOTIFICATIONS_INSERT,
                expectedBody2
            );
            const alarmAggregate = await alarmsAggregates.find({}).toArray();
            expect(alarmAggregate).to.deep.equal(expectedAlarmAggregate);
        });

    });

    describe("without alarms on db for the selected sensorId", () => {

        const checkAndUpdateAlarm = sinon.spy();

        before(() => {
            pipeline.__Rewire__("checkAndUpdateAlarm", checkAndUpdateAlarm);
        });

        after(() => {
            pipeline.__ResetDependency__("checkAndUpdateAlarm");
        });

        beforeEach(() => {
            checkAndUpdateAlarm.reset();
        });

        it("skip the lambda", async () => {
            const event = getEventFromObject(getEnergyReadings("2016-01-28T00:16:36.389Z", "reading"));
            await alarms.insert({
                userId: "userId",
                sensorId: "notARealSensorId",
                rule: "",
                type: "realtime",
                threshold: ""
            });
            await run(handler, event);
            expect(checkAndUpdateAlarm).to.have.callCount(0);
        });

    });
});
