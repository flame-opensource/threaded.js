class ThreadedNodeCompat {
    static supportNode(ThreadedTools) {
        ThreadedTools.acorn = require('acorn');
        ThreadedTools.walk = require('acorn-walk');
        ThreadedTools.escodegen = require('escodegen');
    }
}

module.exports = { ThreadedNodeCompat };