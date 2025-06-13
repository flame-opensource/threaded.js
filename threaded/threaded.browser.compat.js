import { Thread, ThreadExecutor, ThreadGroup, ThreadError, ThreadedTools } from './threaded.js';

window.Thread = Thread;
window.ThreadExecutor = ThreadExecutor;
window.ThreadGroup = ThreadGroup;
window.ThreadError = ThreadError;
window.ThreadedTools = ThreadedTools;

(function supportBrowser() {
    ThreadedTools.acorn = window.acorn;
    ThreadedTools.walk = window.walk;
    ThreadedTools.escodegen = window.escodegen;
})();