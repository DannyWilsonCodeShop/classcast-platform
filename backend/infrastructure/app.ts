#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClassCastStack } from './ClassCastStack';

const app = new cdk.App();

new ClassCastStack(app, 'ClassCastCleanStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: 'ClassCast Platform - Clean Backend Architecture'
});
