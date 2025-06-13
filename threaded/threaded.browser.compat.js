import { Thread, ThreadExecutor, ThreadGroup, ThreadError, ThreadedTools } from 'https://cdn.jsdelivr.net/gh/flame-opensource/threaded.js@main/threaded/threaded.js';

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