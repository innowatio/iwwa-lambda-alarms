import getDispatch from "lk-dispatch";

import * as config from "config";
import kinesis from "services/kinesis";

export default getDispatch({
    kinesisClient: kinesis,
    kinesisStream: config.KINESIS_STREAM_NAME,
    producerId: config.PRODUCER
});
