#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkSystemStack } from '../lib/cdk-system-stack';
import { Environment } from 'aws-cdk-lib';

const PLAYGROUND_ENV: Environment = {
    account: '144456183909',
    region: 'eu-central-1'
};

const app = new cdk.App();
new CdkSystemStack(app, 'CdkSystemStack', {
    env: PLAYGROUND_ENV
});
