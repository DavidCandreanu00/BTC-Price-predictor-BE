#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkSystemStack } from '../lib/cdk-system-stack';

const app = new cdk.App();
new CdkSystemStack(app, 'CdkSystemStack');
