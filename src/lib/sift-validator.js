import sift from "sift";
import isString from "lodash.isstring";

export default function siftValidator (rule, data) {
    const ruleString = isString(rule) ? JSON.parse(rule) : rule;
    const sifter = sift(ruleString);
    return sifter(data);
}
