var JSHint = require("jshint").JSHINT;
var Config = require("./config");

function Linter(houndJavascript) {
  this.houndJavascript = houndJavascript;
}

Linter.prototype.lint = function(payload) {
  var config = new Config(payload.config);

  if (config.isValid()) {
    JSHint(payload.content, config.parse());

    var violations = JSHint.errors.
      filter(function(el) { return el != undefined }).
      map(function(error) {
        return { line: error.line, message: error.reason };
      });

    return this.houndJavascript.completeFileReview({
      violations: violations,
      filename: payload.filename,
      linter_name: payload.linter_name,
      commit_sha: payload.commit_sha,
      pull_request_number: payload.pull_request_number,
      patch: payload.patch,
    });
  } else {
    return this.houndJavascript.reportInvalidConfig({
      pull_request_number: payload.pull_request_number,
      commit_sha: payload.commit_sha,
      linter_name: payload.linter_name,
    });
  }
};

module.exports = Linter;
