// Stand-in for the AWS SDK clients the tests must never call for real (see sdk.js).
"use strict";
const sent = [];

const client = (name) =>
  class {
    async send(command) {
      sent.push({ client: name, command: command.constructor.name, input: command.input });
      return {};
    }
  };
const command = (name) =>
  ({
    [name]: class {
      constructor(input) {
        this.input = input;
      }
    },
  })[name];

module.exports = {
  sent,
  CognitoIdentityProviderClient: client("cognito"),
  AdminDeleteUserCommand: command("AdminDeleteUserCommand"),
  SESv2Client: client("ses"),
  SendEmailCommand: command("SendEmailCommand"),
  S3Client: client("s3"),
  GetObjectCommand: command("GetObjectCommand"),
  ListObjectsV2Command: command("ListObjectsV2Command"),
};
