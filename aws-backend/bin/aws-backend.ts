#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StudyHubBackendStack } from '../lib/study-hub-stack';

const app = new cdk.App();

new StudyHubBackendStack(app, 'StudyHubBackend', {
  description: 'Level Up Study Hub serverless backend: Cognito auth, DynamoDB, HTTP API (Phase 1)',
  // `cdk deploy` sets the stack's protection to match this value, so it must
  // stay true here or a deploy would quietly switch it off again.
  terminationProtection: true,
  // Env-agnostic so `cdk synth` works without credentials (e.g. in CI).
  // `cdk deploy` resolves account/region from the active AWS profile.
});
