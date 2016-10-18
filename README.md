[![Build Status](https://travis-ci.org/innowatio/iwwa-lambda-alarms.svg?branch=master)](https://travis-ci.org/innowatio/iwwa-lambda-alarms)
[![Dependency Status](https://david-dm.org/innowatio/iwwa-lambda-alarms.svg)](https://david-dm.org/innowatio/iwwa-lambda-alarms)
[![devDependency Status](https://david-dm.org/innowatio/iwwa-lambda-alarms/dev-status.svg)](https://david-dm.org/innowatio/iwwa-lambda-alarms#info=devDependencies)
[![codecov.io](https://codecov.io/github/innowatio/iwwa-lambda-alarms/coverage.svg?branch=master)](https://codecov.io/github/innowatio/iwwa-lambda-alarms?branch=master)

# iwwa-lambda-alarms    

Lambda function to handle alarms

## Deployment

This project deployment is automated with Lambdafile. For more info [`lambda-boilerplate`](https://github.com/lk-architecture/lambda-boilerplate/).

### Configuration

The following environment variables are needed to configure the function:

- `MONGODB_URL` __string__ *required*: URL of the MongoDB endpoint
- `DEBUG` __boolean__ *optional*: set to `true` if you want more log from [`kinesis-router`](https://github.com/lk-architecture/kkinesis-router/).

### Run test

In order to run tests locally a MongoDB instance and a `MONGODB_URL` environment
param are needed.
Then, just run `npm run test` command.
