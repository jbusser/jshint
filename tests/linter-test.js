var Redis = require("fakeredis");
var RSVP = require("rsvp");
var HoundJavascript = require("hound-javascript");
var Linter = require("../lib/linter");
var lastJob = require("./helpers/redis").lastJob;

QUnit.module("Linter");

RSVP.on("error", function(error) {
  throw new Error(error);
});

asyncTest("JSHint linting", function() {
  var payload = {
    content: "foo();",
    config: "{ \"undef\": true }",
    filename: "filename",
    commit_sha: "commit_sha",
    linter_name: "hound_assigned_name",
    pull_request_number: "pull_request_number",
    patch: "patch",
  };
  var redis = Redis.createClient();
  var houndJavascript = new HoundJavascript(redis);
  var linter = new Linter(houndJavascript);

  linter.lint(payload).then(function() {
    lastJob(redis, "high", function(job) {
      start();

      equal(
        job.class,
        "CompletedFileReviewJob",
        "pushes the proper job type"
      );
      deepEqual(
        job.args[0],
        {
          violations: [ { line: 1, message: "'foo' is not defined." } ],
          filename: "filename",
          commit_sha: "commit_sha",
          linter_name: "hound_assigned_name",
          pull_request_number: "pull_request_number",
          patch: "patch",
        },
        "pushes a job onto the queue"
      );
    });
  });
});

asyncTest("Reporting an invalid configuration file", function() {
  var payload = {
    content: "// TODO",
    config: "---\nyaml: is good\ntrue/false/syntax/error",
    filename: "filename",
    linter_name: "hound_assigned_name",
    commit_sha: "commit_sha",
    pull_request_number: "pull_request_number",
    patch: "patch",
  };
  var redis = Redis.createClient();
  var houndJavascript = new HoundJavascript(redis);
  var linter = new Linter(houndJavascript);

  linter.lint(payload).then(function() {
    lastJob(redis, "high", function(job) {
      start();

      equal(
        job.class,
        "ReportInvalidConfigJob",
        "pushes the proper job type"
      );
      deepEqual(
        job.args[0],
        {
          commit_sha: "commit_sha",
          pull_request_number: "pull_request_number",
          linter_name: "hound_assigned_name",
        },
        "pushes a job onto the queue"
      );
    });
  });
});
