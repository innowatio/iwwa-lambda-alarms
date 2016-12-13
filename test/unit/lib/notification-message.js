import {expect} from "chai";
import {getType, getMeasurementType} from "lib/notification-message";


describe("`getType` function test default return", () => {
    it("return `realtime` if the type is null", () => {
        const ret = getType(null);
        expect(ret).to.equal("realtime");
    });
});

describe("`getMeasurementType` function test default return", () => {

    it("return `energia` if the type is null", () => {
        const ret = getMeasurementType("maxPower");
        expect(ret).to.equal("potenza massima");
    });

    it("return `energia` if the type is null", () => {
        const ret = getMeasurementType(null);
        expect(ret).to.equal("energia");
    });
});
