import {expect} from "chai";

import siftValidator from "lib/sift-validator";

describe("`siftValidator` function", () => {

    const measureMaxPower = {
        "measurementType": "maxPower",
        "measurementValue": "13",
        "unitOfMeasurement": "kW"
    };

    const measureActiveEnergy = {
        "measurementType": "activeEnergy",
        "measurementValue": "11",
        "unitOfMeasurement": "kWh"
    };

    describe("when rule is a string", () => {

        const rule = '{"$and": [{"measurementValue": {"$gt": "12"}}, {"unitOfMeasurement": "kW"}]}';

        it("return `true` if the object pass the rule", () => {
            const ret = siftValidator(rule, measureMaxPower);
            expect(ret).to.equal(true);
        });

        it("return `false` if the object not pass the rule", () => {
            const ret = siftValidator(rule, measureActiveEnergy);
            expect(ret).to.equal(false);
        });

    });

    describe("when rule is not a string", () => {

        const rule = {"$and": [{"measurementValue": {"$gt": "12"}}]};

        it("return `true` if the object pass the rule", () => {
            const ret = siftValidator(rule, measureMaxPower);
            expect(ret).to.equal(true);
        });

        it("return `false` if the object not pass the rule", () => {
            const ret = siftValidator(rule, measureActiveEnergy);
            expect(ret).to.equal(false);
        });

    });

});
