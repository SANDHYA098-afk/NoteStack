#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { NoteStackCdkStack } from '../lib/cdk-stack';

const app = new cdk.App();
new NoteStackCdkStack(app, 'NoteStackCdkStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '896823725438',
    region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
  },
  description: 'NoteStack — Serverless Student Notes Platform',
});
