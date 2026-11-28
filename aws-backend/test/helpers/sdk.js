// Lets tests load the Lambdas that have no node_modules of their own (pre-token, api). Lambda
// provides the AWS SDK at run time; here the DynamoDB packages come from lambda/callables' own
// node_modules, and the clients we never want to reach AWS (Cognito, SES, S3) are recording stubs.
"use strict";
const path = require("node:path");
const Module = require("node:module");

const CALLABLES_DIR = path.join(__dirname, "../../lambda/callables");
const STUB = path.join(__dirname, "aws-stubs.js");
const STUBBED = new Set(["@aws-sdk/client-cognito-identity-provider", "@aws-sdk/client-sesv2", "@aws-sdk/client-s3"]);

const resolve = Module._resolveFilename;
Module._resolveFilename = function resolveForTests(request, parent, isMain, options) {
  if (STUBBED.has(request)) return STUB;
  if (request.startsWith("@aws-sdk/")) return resolve.call(this, request, parent, isMain, { paths: [CALLABLES_DIR] });
  return resolve.call(this, request, parent, isMain, options);
};

/** The document client module the Lambdas load, so a test can replace `send`. */
const lib = require("@aws-sdk/lib-dynamodb");
/** Commands sent to the stubbed clients, in order: { client, command, input }. */
const { sent } = require(STUB);

module.exports = { lib, sent };
