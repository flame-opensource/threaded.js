const acorn = require('acorn');
const walk = require('acorn-walk');
const escodegen = require('escodegen');
const { Worker } = require('worker_threads');

class ThreadedNodeCompat {
    static defaultSettings(ThreadedTools) {
        ThreadedTools.ast_generator = acorn;
        ThreadedTools.ast_walker = walk;
        ThreadedTools.escodegenerator = escodegen;
        ThreadedTools.isnodejs = true;
        ThreadedTools.createNodeWorker = (workerCode) => {
            return new Worker(workerCode, { eval: true });
        }
    }
}

module.exports = { ThreadedNodeCompat };