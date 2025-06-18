/*
* MIT License
* 
* Copyright (c) 2025 Flame
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:

* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.

* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

/* Version 1.1.6 */

class ThreadedTools {
    static workerSourceCode(generatorFunc) {
        return  (ThreadedTools.isnodejs ? "import { parentPort } from 'node:worker_threads';\n" : "") +
            'class ThreadExecutor {' + '\n' +
            '    static __threadExceptionOccurred__(ex) {' + '\n' +
            '        ' + (ThreadedTools.isnodejs ? 'parentPort' : 'self') + '.postMessage({ error: ex });' + '\n' +
            '        throw ex;' + '\n' +
            '    }' + '\n' +
            '}' + '\n' +
            'ThreadExecutor.currentThread = {};' + '\n' +
            ThreadedTools.toString() + '\n' +
            'ThreadedTools.postMessageToWorker = (worker, data) => ' + (ThreadedTools.isnodejs ? 'global' : 'worker') + '.onmessage(data);' + '\n' +
            IsolatedThread.toString() + '\n' +
            ThreadError.toString() + '\n' +
            'IsolatedThread.this = new IsolatedThread();' + '\n' +
            'IsolatedThread.this.__createInternalWebWorker__ = () => {}' + '\n' +
            'IsolatedThread.this.terminate = () => {' + '\n' +
            '    ' + (ThreadedTools.isnodejs ? 'parentPort' : 'self') + '.postMessage({ terminate: true });' + '\n' +
            '}' + '\n' +
            'IsolatedThread.this.__worker__ = ' + (ThreadedTools.isnodejs ? 'parentPort' : 'self') + ';' + '\n' +
            'let generatorFunc = ' + generatorFunc.toString() + '\n' +
            'let generator = null;' + '\n' +
            'let args = [];' + '\n' +
            (ThreadedTools.isnodejs ? 'global.' : 'let ') + 'onmessage = function(e) {' + '\n' +
            '    try {' + '\n' +
            '        let data = e.data === undefined ? e : e.data;' + '\n' +
            '        ' + (ThreadedTools.isnodejs ? 'global' : 'self') + '.id = data.id;' + '\n' +
            '        let started = data.started;' + '\n' +
            '        let running = data.running;' + '\n' +
            '        let stopped = data.stopped;' + '\n' +
            '        let sleeping = data.sleeping;' + '\n' +
            '        let paused = data.paused;' + '\n' +
            '        let restarted = data.restarted;' + '\n' +
            '        let argschanged = data.argschanged;' + '\n' +
            '        IsolatedThread.this.id = data.id;' + '\n' +
            '        IsolatedThread.this.__started__ = started;' + '\n' +
            '        IsolatedThread.this.__running__ = running;' + '\n' +
            '        IsolatedThread.this.__stopped__ = stopped;' + '\n' +
            '        IsolatedThread.this.__sleeping__ = sleeping;' + '\n' +
            '        IsolatedThread.this.__paused__ = paused;' + '\n' +
            '        IsolatedThread.this.__argschanged__ = argschanged;' + '\n' +
            '        if (argschanged || restarted) {' + '\n' +
            '            args = data.args !== null ? data.args : args;' + '\n' +
            '            generator = generatorFunc(...args);' + '\n' +
            '        }' + '\n' +
            '        let stepscount = 1;' + '\n' +
            '        function loop() {' + '\n' +
            '            if (' + (ThreadedTools.isnodejs ? 'global' : 'self') + '.__looptimer__ !== undefined) try { clearTimeout(' + (ThreadedTools.isnodejs ? 'global' : 'self') + '.__looptimer__); } catch (ex) {}' + '\n' +
            '            if (!started || !running || stopped) return;' + '\n' +
            '            let done = false;' + '\n' +
            '            if (!sleeping && !paused) {' + '\n' +
            '                let result = generator.next();' + '\n' +
            '                done = result.done === true;' + '\n' +
            '                if (result instanceof Error) return result;' + '\n' +
            '                stepscount = !done ? result : stepscount;' + '\n' +
            '                ' + (ThreadedTools.isnodejs ? 'parentPort' : 'self') + '.postMessage({' + '\n' +
            '                    id: ' + (ThreadedTools.isnodejs ? 'global' : 'self') + '.id,' + '\n' +
            '                    result: result.value,' + '\n' +
            '                    done: done,' + '\n' +
            '                });' + '\n' +
            '            }' + '\n' +
            '            if (!done) ' + (ThreadedTools.isnodejs ? 'global' : 'self') + '.__looptimer__ = setTimeout(loop, 10);' + '\n' +
            '        }' + '\n' +
            '        loop();' + '\n' +
            '    } catch (ex) {' + '\n' +
            '        ThreadExecutor.__threadExceptionOccurred__(ex);' + '\n' +
            '        return ex;' + '\n' +
            '    }' + '\n' +
            '}' + '\n' +
            (ThreadedTools.isnodejs ? "parentPort.on('message', global.onmessage);" : "self.onmessage = onmessage;");
    }
}
ThreadedTools.createWorker = (isolatedThread, generatorFunc, onmessage) => {
    let workerCode = ThreadedTools.workerSourceCode(generatorFunc);
    if (ThreadedTools.isnodejs === true) {
        isolatedThread.__worker__ = ThreadedTools.createNodeWorker(workerCode);
        isolatedThread.__worker__.on('message', onmessage);
    } else {
        isolatedThread.__blob__ = new Blob([workerCode], { type: "application/javascript" });
        isolatedThread.__workerURL__ = URL.createObjectURL(isolatedThread.__blob__);
        isolatedThread.__worker__ = new Worker(isolatedThread.__workerURL__, ThreadedTools.isesm === true ? { type: 'module' } : undefined);
        isolatedThread.__worker__.onmessage = onmessage;
    }
}
ThreadedTools.postMessageToWorker = (worker, data) => {
    worker.postMessage(data);
}

ThreadedTools.ast_generator = {parse: undefined};
ThreadedTools.ast_walker = {fullAncestor: undefined, simple: undefined, base: undefined};
ThreadedTools.escodegenerator = {generate: undefined};

class Thread {
    constructor(givenfunc, prioritylevel, id, innerfunctionsisolation) {
        if (Thread.this === undefined) Thread.this = this;
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        
        if (Thread.__count__ === undefined || Thread.__count__ === null || Number.isNaN(Thread.__count__)) {
            Thread.__count__ = 0;
        }
        Thread.__count__++;
        this.__func__ = givenfunc;
        this.innerfunctionsisolation = innerfunctionsisolation == undefined || innerfunctionsisolation === null ?
                                       false :
                                       innerfunctionsisolation;
        this.__generatorFunc__ = ThreadExecutor.__generatorFunc__(givenfunc, this.innerfunctionsisolation);
        this.id = id === undefined ? ('anonymous thread n-' + Thread.__count__) : (id + ' (thread n-' + Thread.__count__ + ')');
        if (ThreadExecutor.queue === undefined) {
            ThreadExecutor.queue = [];
        }

        this.__sleepingpriority__ = false;
        this.__resumingpriority__ = false;
        this.__stepscount__ = 0;
        if (prioritylevel !== undefined) {
            if (typeof prioritylevel !== 'number') {
                throw new ThreadError('thread priority level must be a valid number', this);
            }
            if (! Number.isInteger(prioritylevel)) {
                throw new ThreadError('thread priority level must be an integer number', this);
            }
            if (prioritylevel < 0) {
                throw new ThreadError('thread priority level must be a positive number', this);
            }

            this.prioritylevel = prioritylevel;
        } else {
            this.prioritylevel = (prioritylevel ?? 1) | 1;
        }
        this.__args__ = [];
        this.__result__ = null;
        this.__sleepingtimeout__ = null;
        this.__delaytimeout__ = null;
        this.__isolateErrors__ = false;
        this.__done__ = false;
        this.__sleeping__ = false;
        this.__started__ = false;
        this.__running__ = false;
        this.__stopped__ = false;
        this.__paused__ = false;
    }

    static count() {
        return Thread.__count__;
    }

    static innerThreadFor(outerThread, func, prioritylevel, id, innerfunctionsisolation) {
        if (Thread.__sharedinnerthreads__ === undefined) {
            Thread.__sharedinnerthreads__ = new Map();
        }

        if (! Thread.__sharedinnerthreads__.has(outerThread)) {
            Thread.__sharedinnerthreads__.set(outerThread, new Map());
        }
        if (! Thread.__sharedinnerthreads__.get(outerThread).has(func)) {
            Thread.__sharedinnerthreads__.get(outerThread).set(func, [new Thread(func, prioritylevel, id, innerfunctionsisolation)]);
        }

        let thread = null;
        for (const i in Thread.__sharedinnerthreads__.get(outerThread).get(func)) {
            const thr = Thread.__sharedinnerthreads__.get(outerThread).get(func)[i];
            if (! thr.__running__) {
                thread = thr;
                break;
            }
        }
        if (thread === null) {
            thread = new Thread(func, prioritylevel, id, innerfunctionsisolation);
            Thread.__sharedinnerthreads__.get(outerThread).get(func).push(thread);
        }

        if (prioritylevel !== undefined) {
            thread.setPriorityLevel(prioritylevel !== undefined ? prioritylevel : outerThread.prioritylevel);
        }
        if (id !== undefined) {
            thread.setId(id);
        }
        if (innerfunctionsisolation !== undefined) {
            thread.isolateInnerFunctions(innerfunctionsisolation);
        }

        return thread;
    }

    setId(id) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.id = (id === undefined || id === null) ? ('anonymous thread n-' + Thread.__count__) : (id + ' (thread n-' + Thread.__count__ + ')');
        return this;
    }

    setArgs(...args) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.__args__ = args;
        return this;
    }

    isolateErrors(flag) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (flag === undefined || flag === null) {
            this.__isolateErrors__ = false;
        }

        this.__isolateErrors__ = flag;
        return this;
    }

    setFunction(fn) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (! this.__paused__) this.pause();
        this.__func__ = fn;
        this.__generatorFunc__ = ThreadExecutor.__generatorFunc__(this.__func__, this.innerfunctionsisolation);
        if (this.__started__) this.start();
        return this;
    }

    isolateInnerFunctions(flag) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        let innerfunctionsisolation = flag;
        if (innerfunctionsisolation === undefined || innerfunctionsisolation === null) {
            innerfunctionsisolation = true; // if user just types isolateInnerFunctions()...
        }
        this.innerfunctionsisolation = innerfunctionsisolation;
        if (! this.__paused__) this.pause();
        this.__generatorFunc__ = ThreadExecutor.__generatorFunc__(this.__func__, innerfunctionsisolation);
        if (this.__started__) this.start();
        return this;
    }

    toString() {
        return this.id;
    }

    stepsCount() {
        return this.__stepscount__;
    }

    setPriorityLevel(prioritylevel) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (typeof prioritylevel !== 'number') {
            throw new ThreadError('thread priority level must be a valid number', this);
        }
        if (! Number.isInteger(prioritylevel)) {
            throw new ThreadError('thread priority level must be an integer number', this);
        }
        if (prioritylevel < 0) {
            throw new ThreadError('thread priority level must be a positive number', this);
        }

        this.prioritylevel = prioritylevel;
        ThreadExecutor.notifyForPriority();
        return this;
    }

    start() {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__sleepingtimeout__ !== null) try {
            clearTimeout(this.__sleepingtimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__generator__ = undefined;
        this.__stepscount__ = 0;
        this.__sleepingpriority__ = false;
        this.__resumingpriority__ = false;
        this.__result__ = null;
        this.__done__ = false;
        this.__sleeping__ = false;
        this.__started__ = true;
        this.__paused__ = false;
        this.__stopped__ = false;
        this.__running__ = true;
        ThreadExecutor.__timeSpentOutsideThreads__ = undefined;
        ThreadExecutor.queue.push(this);
        if (this.prioritylevel > 1) {
            ThreadExecutor.notifyForPriority(false);
        }
        if (! ThreadExecutor.isHandling()) {
            ThreadExecutor.handleThreadQueue();
        }
        return this;
    }

    startAfter(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        if (! this.__paused__) this.pause();
        this.__delaytimeout__ = setTimeout(() => this.start(), ms);
        return this;
    }

    interrupt() {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        return this.stop();
    }

    static interrupt() {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.interrupt called outside thread environment");
        }

        currentThread.interrupt();
    }

    interruptAfter(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        if (! this.__paused__) this.pause();
        this.__delaytimeout__ = setTimeout(() => this.interrupt(), ms);
        return this;
    }

    static interruptAfter(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.interruptAfter called outside thread environment");
        }

        currentThread.interruptAfter(ms);
    }

    stop() {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (! this.__started__) {
           console.error("Thread not started yet");
           return this;
        }
        if (this.__stopped__) {
           console.error("Thread already stopped");
           return this;
        }
        this.__stopped__ = true;
        this.__running__ = false;
        const previousIndex = ThreadExecutor.queue.indexOf(this);
        if (previousIndex === -1) {
            throw new ThreadError("Cannot stop thread \"" + this.id + ", the thread is not in the execution queue");
        }
        ThreadExecutor.queue.splice(previousIndex, 1);
        return this;
    }

    static stop() {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.stop called outside thread environment");
        }

        currentThread.stop();
    }

    stopAfter(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.stop(), ms);
        return this;
    }

    static stopAfter(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.stopAfter called outside thread environment");
        }

        currentThread.stopAfter(ms);
    }

    pause() {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__paused__) {
           console.error("Thread already paused");
           return this;
        }
        this.__paused__ = true;
        return this;
    }

    static pause() {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.pause called outside thread environment");
        }

        currentThread.pause();
    }

    pauseAfter(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.pause(), ms);
        return this;
    }

    static pauseAfter(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.pauseAfter called outside thread environment");
        }

        currentThread.pauseAfter(ms);
    }

    resume() {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (!this.__paused__ && !this.__sleeping__) {
           console.error("Thread is neither paused nor sleeping");
           return this;
        }
        const previousIndex = ThreadExecutor.queue.indexOf(this);
        if (previousIndex === -1) {
            throw new ThreadError("Cannot resume thread \"" + this.id + ", the thread is not in the execution queue");
        }
        if (this.__sleepingtimeout__ !== null) try {
            clearTimeout(this.__sleepingtimeout__);
        } catch(ex) {
            // Ignored...
        }

        if (this.__paused__) {
            this.__sleeping__ = false;
            this.__sleepingpriority__ = false;
            this.__paused__ = false;
            this.__resumingpriority__ = true;
            ThreadExecutor.notifyForResuming(this, previousIndex);
        } else if (this.__sleeping__) {
            this.__paused__ = false;
            this.__resumingpriority__ = false;
            this.__sleeping__ = false;
            this.__sleepingpriority__ = true;
            ThreadExecutor.notifyForSleeping(this, previousIndex);
        }

        return this;
    }

    static resume() {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.resume called outside thread environment");
        }

        currentThread.resume();
    }

    resumeAfter(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.resume(), ms);
        return this;
    }

    static resumeAfter(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.resumeAfter called outside thread environment");
        }

        currentThread.resumeAfter(ms);
    }

    sleep(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__sleepingtimeout__ !== null) try {
            clearTimeout(this.__sleepingtimeout__);
        } catch(ex) {
            // Ignored...
        }
        if (! this.__started__) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is not started yet");
        }
        if (this.__stopped__) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is stopped");
        }
        if (! this.__running__) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is not running");
        }
        if (this.__paused__) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is paused");
        }
        const previousIndex = ThreadExecutor.queue.indexOf(this);
        if (previousIndex === -1) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is not in the execution queue");
        }
        this.__sleeping__ = true;
        this.__sleepingpriority__ = true;
        this.__sleepingtimeout__ = setTimeout(() => ThreadExecutor.notifyForSleeping(this, previousIndex), ms);
        return this;
    }

    static sleep(ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.sleep called outside thread environment");
        }

        currentThread.sleep(ms);
    }

    sleepAfter(delay, ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.sleep(ms), delay);
        return this;
    }

    static sleepAfter(delay, ms) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.sleepAfter called outside thread environment");
        }

        currentThread.sleepAfter(delay, ms);
    }

    join(timeoutms) {
        if (Thread.__stopcontrols__ === true) return; // Used in AST processing to prevent premature execution
        // The design of joining can't be achieved just by looping until the thread finishes executing
        // That will block the entire event loop
        // Instead...
        // For efficiency...
        // thread.join()
        // Will be replaced with :
        // while (thread.isrunning()) {
        //    yield __thefunctionstepscount__; // or just yield; for custom generator functions
        // }
        // And
        // thread.join(timeoutms)
        // Will be replaced with :
        // let __isjointimeoutN__ = false;
        // let __jointimeoutN__ = setTimeout(function () { __isjointimeoutN__ = true; }, timeoutms)
        // while (thread.isrunning() && !__isjointimeoutN__) {
        //    yield __thefunctionstepscount__; // or just yield; for custom generator functions
        // }
        // clearTimeout(__jointimeoutN__);
        // Using the AST processor...
        // Only inside a thread environment (inside a thread)
        // Using it somewhere else will throw the error below...
        if (true) throw new ThreadError("Thread.join method can't be called outside thread environment");
    }

    catch(exceptionFunc) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.__exceptionFunc__ = exceptionFunc;
        return this;
    }

    onfinish(finishFunc) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.__finishFunc__ = finishFunc;
        return this;
    }

    onyield(yieldFunc) {
        if (Thread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.__yieldFunc__ = yieldFunc;
        return this;
    }

    isdone() {
        return this.__done__;
    }

    issleeping() {
        return this.__sleeping__;
    }

    isstarted() {
        return this.__started__;
    }

    isrunning() {
        return this.__running__;
    }

    isstopped() {
        return this.__stopped__;
    }

    ispaused() {
        return this.__paused__;
    }

    result() {
        return this.__result__;
    }
}

Thread.LOW_PRIORITY_LEVEL = 1;
Thread.MID_PRIORITY_LEVEL = 2;
Thread.HIGH_PRIORITY_LEVEL = 3;

Thread.innerfunctionsisolation = false;

Thread.__stopcontrols__ = false;

class ThreadExecutor {
    static handleThreadQueue() {
        if (ThreadExecutor.queue === undefined) {
            return;
        }
        if (ThreadExecutor.queue.length === 0) {
            return;
        }

        ThreadExecutor.__isLooping__ = true;

        ThreadExecutor.__isHandling__ = false;

        ThreadExecutor.__timeSpentOutsideThreads__ = undefined;

        ThreadExecutor.queueIndex = 0;

        ThreadExecutor.currentThread = null;

        ThreadExecutor.handlerLoop(false);
    }

    static handlerLoop(calledFromNotification) {
        if (ThreadExecutor.__timeSpentOutsideThreads__ !== undefined) {
            ThreadExecutor.__timeSpentOutsideThreads__ = Date.now() - ThreadExecutor.__timeSpentOutsideThreads__;
        } else {
            ThreadExecutor.__timeSpentOutsideThreads__ = 10;
        }
        ThreadExecutor.__timeSpentOutsideThreads__ = Math.min(ThreadExecutor.__timeSpentOutsideThreads__, 20);

        if (! calledFromNotification) if (ThreadExecutor.__isHandling__) {
            return;
        }

        if (ThreadExecutor.handlerlooptimeout !== undefined && ThreadExecutor.handlerlooptimeout !== null) {
            try {
                clearTimeout(ThreadExecutor.handlerlooptimeout);
            } catch(ex) {
                // Ignored...
            }
        }

        const thread = ThreadExecutor.queue[ThreadExecutor.queueIndex];

        if (thread !== undefined && thread !== null) if ((! thread.__sleeping__) &&
                (thread.__started__ && !thread.__stopped__ && thread.__running__ && !thread.__paused__)) {
            ThreadExecutor.__isHandling__ = true;

            ThreadExecutor.currentThread = thread;
            Thread.this = thread;

            thread.__sleepingpriority__ = false;
            thread.__resumingpriority__ = false;

            if (thread.__generator__ === undefined) {
                thread.__generator__ = thread.__generatorFunc__(...thread.__args__);
            }
            const result = thread.__generator__.next();
            thread.__stepscount__ = result.done !== true ? result.value : thread.__stepscount__;

            if (!(result instanceof Error) && result.done === true) {
                ThreadExecutor.queue.splice(ThreadExecutor.queueIndex, 1);
                thread.__result__ = result.value;
                thread.__done__ = true;
                //thread.__stopped__ = true;
                thread.__running__ = false;
                thread.__sleepingpriority__ = false;
                thread.__resumingpriority__ = false;
                if (thread.__finishFunc__ !== undefined) {
                    thread.__finishFunc__(result.value);
                }
                if (ThreadExecutor.__globalFinishFunc__ !== undefined && ThreadExecutor.__globalFinishFunc__ !== null) {
                    ThreadExecutor.__globalFinishFunc__(result.value, thread);
                }
                if (thread.__threadgroup__ !== undefined &&
                    thread.__threadgroup__ !== null) {
                        if (thread.__threadgroup__.__finishFunc__ !== undefined &&
                            thread.__threadgroup__.__finishFunc__ !== null) {
                            thread.__threadgroup__.__finishFunc__(result.value, thread);
                       }
                }
                if (ThreadExecutor.queueIndex >= ThreadExecutor.queue.length) {
                    ThreadExecutor.queueIndex = 0;
                }
            } else {
                if (thread.__yieldFunc__ !== undefined) {
                    thread.__yieldFunc__(result.value);
                }
                if (ThreadExecutor.__globalYieldFunc__ !== undefined && ThreadExecutor.__globalYieldFunc__ !== null) {
                    ThreadExecutor.__globalYieldFunc__(result.value, thread);
                }
                if (thread.__threadgroup__ !== undefined &&
                    thread.__threadgroup__ !== null) {
                        if (thread.__threadgroup__.__yieldFunc__ !== undefined &&
                            thread.__threadgroup__.__yieldFunc__ !== null) {
                            thread.__threadgroup__.__yieldFunc__(result.value, thread);
                       }
                }
                ThreadExecutor.queueIndex++;
                ThreadExecutor.queueIndex = ThreadExecutor.queueIndex % ThreadExecutor.queue.length;
            }

            ThreadExecutor.__isHandling__ = false;
        } else {
            ThreadExecutor.queueIndex++;
            ThreadExecutor.queueIndex = ThreadExecutor.queueIndex % ThreadExecutor.queue.length;
        }

        if (ThreadExecutor.queue.length !== 0) {
            ThreadExecutor.handlerlooptimeout = setTimeout(() => ThreadExecutor.handlerLoop(false), (ThreadExecutor.__loopingbeattime__ === undefined || ThreadExecutor.__loopingbeattime__ === ThreadExecutor.ADAPTIVE) ? ThreadExecutor.__timeSpentOutsideThreads__ : ThreadExecutor.__loopingbeattime__);
            ThreadExecutor.__timeSpentOutsideThreads__ = Date.now();
        } else {
            ThreadExecutor.__isLooping__ = false;
        }
        
    }

    static isHandling() {
        if (ThreadExecutor.__isHandling__ === undefined) {
            return false;
        }
        
        return ThreadExecutor.__isHandling__;
    }

    static isLooping() {
        if (ThreadExecutor.__isLooping__ === undefined) {
            return false;
        }
        
        return ThreadExecutor.__isLooping__;
    }

    static setBeatTime(beatTime) {
        ThreadExecutor.__loopingbeattime__ = beatTime;
    }

    static notifyForSleeping(sleptThread, previousIndex) {
        for (let i = 0; i < ThreadExecutor.queue.length; i++) {
            const thread = ThreadExecutor.queue[i];
            if (! thread.__sleepingpriority__) {
                ThreadExecutor.queue.splice(previousIndex, 1);
                ThreadExecutor.queue.splice(i, 0, sleptThread);
                break;
            }
        }

        sleptThread.__sleeping__ = false;

        ThreadExecutor.__timeSpentOutsideThreads__ = undefined;

        if (! ThreadExecutor.isLooping()) {
            ThreadExecutor.handleThreadQueue();
        } else {
            ThreadExecutor.handlerLoop(true);
        }
    }
    
    static notifyForResuming(resumedThread, previousIndex) {
        for (let i = 0; i < ThreadExecutor.queue.length; i++) {
            const thread = ThreadExecutor.queue[i];
            if (! thread.__sleepingpriority__ && ! thread.__resumingpriority__) {
                ThreadExecutor.queue.splice(previousIndex, 1);
                ThreadExecutor.queue.splice(i, 0, resumedThread);
                break;
            }
        }

        ThreadExecutor.__timeSpentOutsideThreads__ = undefined;

        if (! ThreadExecutor.isLooping()) {
            ThreadExecutor.handleThreadQueue();
        } else {
            ThreadExecutor.handlerLoop(true);
        }
    }

    static notifyForPriority(notifyhandler) {
        let start = ThreadExecutor.queue.length;
        for (let i = 0; i < ThreadExecutor.queue.length; i++) {
            const thread = ThreadExecutor.queue[i];
            if (! thread.__sleepingpriority__ && ! thread.__resumingpriority__) {
                start = i;
                break;
            }
        }

        if (ThreadExecutor.queue.length - start === 0) return;

        ThreadExecutor.queue = ThreadExecutor.queue.slice(0, start).concat(ThreadExecutor.queue.slice(start, ThreadExecutor.queue.length).sort((a, b) => ((a.prioritylevel ?? 1) | 1) - ((b.prioritylevel ?? 1) | 1)));
    
        ThreadExecutor.__timeSpentOutsideThreads__ = undefined;

        if (notifyhandler === undefined || notifyhandler == true) if (! ThreadExecutor.isLooping()) {
            ThreadExecutor.handleThreadQueue();
        } else {
            ThreadExecutor.handlerLoop(true);
        }
    }

    static catch(globalExceptionFunc) {
        ThreadExecutor.__globalExceptionFunc__ = globalExceptionFunc;
    }

    static __threadExceptionOccurred__(ex) {
        if (ex instanceof TypeError && ex.message === "Generator is already running") {
            // Ignored...
            return;
        }

        ex = new ThreadError(ex, ThreadExecutor.currentThread);

        let noExceptionFuncIsSet = true;

        if (ThreadExecutor.currentThread !== undefined && ThreadExecutor.currentThread !== null) {
            if (ThreadExecutor.currentThread.__exceptionFunc__ !== undefined &&
                ThreadExecutor.currentThread.__exceptionFunc__ !== null) {
                noExceptionFuncIsSet = false;
                ThreadExecutor.currentThread.__exceptionFunc__(ex);
            }

            if (ThreadExecutor.currentThread.__threadgroup__ !== undefined &&
                ThreadExecutor.currentThread.__threadgroup__ !== null) {
                    if (ThreadExecutor.currentThread.__threadgroup__.__exceptionFunc__ !== undefined &&
                        ThreadExecutor.currentThread.__threadgroup__.__exceptionFunc__ !== null) {
                        noExceptionFuncIsSet = false;
                        if (! ThreadExecutor.currentThread.__isolateErrors__) {
                            ThreadExecutor.currentThread.__threadgroup__.__exceptionFunc__(ex, ThreadExecutor.currentThread);
                        }
                    }
            }
            
            if (ThreadExecutor.__globalExceptionFunc__ !== undefined && ThreadExecutor.__globalExceptionFunc__ !== null) {
                noExceptionFuncIsSet = false;
                if (! ThreadExecutor.currentThread.__isolateErrors__) {
                    ThreadExecutor.__globalExceptionFunc__(ex, ThreadExecutor.currentThread);
                }
            }
            
            if (noExceptionFuncIsSet && !ThreadExecutor.currentThread.__isolateErrors__) {
                if (! ThreadExecutor.currentThread.__isolateErrors__) {
                    console.error(ex);
                }
            }
        } else {
            console.error("Error thrown outside thread environment : ", ex);
        }
    }

    static __generatorFunc__(func, innerfunctionsisolation) {
        let functionSource = `(${func.toString()})`;
        if (functionSource === null) throw new ThreadError("Failed to retrieve the function source code");
        if (ThreadExecutor.__isNativeFunction__(func)) throw new ThreadError("Can't execute native function \"" + functionSource + "\", the thread function has to be a normal function, try to wrap the function into a normal function instead...");
        
        // Parse the source into an AST
        const ast = ThreadedTools.ast_generator.parse(functionSource, { ecmaVersion: 'latest' });

        let alreadyAGeneratorFunction = typeof func === 'function' &&
                                        func.constructor &&
                                        func.constructor.name === 'GeneratorFunction';
                   
        ThreadedTools.ast_walker.simple(ast, {
            FunctionDeclaration(node) {
                node.body.istheouterfunction = true;
            },
            FunctionExpression(node) {
                node.body.istheouterfunction = true;
            },
            ArrowFunctionExpression(node) {
                node.body.istheouterfunction = true;
            }
        }, {
        // override default behavior: prevent descending into function bodies
        ...ThreadedTools.ast_walker.base,
        FunctionDeclaration() {}, // override walk behavior: skip body
        FunctionExpression() {},
        ArrowFunctionExpression() {}
        });

        ThreadedTools.ast_walker.fullAncestor(ast, (node, ancestors) => {
            // Inject `yield` after each statement in function body or block
            // Only if its not already a generator function
            Thread.__stopcontrols__ = true;
            IsolatedThread.__stopcontrols__ = true;
            ThreadGroup.__stopcontrols__ = true;

            let functionId = 0;
            let jointThreadId = 0;
            if (
                node.type === 'BlockStatement'
            ) {
                for (let i = ancestors.length - 1; i >= 0; i--) {
                    const ancestor = ancestors[i];
                    if (ancestor.type === 'FunctionDeclaration' ||
                        ancestor.type === 'FunctionExpression' ||
                        ancestor.type === 'ArrowFunctionExpression'
                    ) {
                        let functioncode = ThreadedTools.escodegenerator.generate(ancestor);
                        let innerfunc = null;
                        try {
                            innerfunc = eval(`(${functioncode})`);
                            ancestor.body.isFunctionGenerator = typeof innerfunc === 'function' &&
                                        innerfunc.constructor &&
                                        innerfunc.constructor.name === 'GeneratorFunction';
                        } catch (ex) {
                            // Then its not a generator function and its being processed...
                        }

                        if (ancestor.body.istheouterfunction !== true) ancestor.body.isinnerfunction = true;

                        if (ancestor.body.isFunctionGenerator) {
                            //return node;
                        } else if (ancestor.type === 'ArrowFunctionExpression') {
                            ancestor.type = 'FunctionExpression';
                            ancestor.id = null;
                            ancestor.expression = undefined;

                            if (node.body.type !== 'BlockStatement') {
                                ThreadExecutor.__wrapArrowFunctionInBlockStatement__(ancestor);
                            }
                        }
                    }
                }

                let isFunctionGenerator = node.isFunctionGenerator !== undefined ?
                                          node.isFunctionGenerator :
                                          alreadyAGeneratorFunction;

                function handleStatement(stmt, newBody) {
                    // Handling inline if else statements...
                    if (stmt.type === 'IfStatement') {
                        let current = stmt;

                        while (current) {
                            // Wrap 'then' body
                            if (current.consequent && current.consequent.type !== 'BlockStatement') {
                                let newBody = [];
                                handleStatement(current.consequent, newBody);
                                current.consequent = {
                                    type: 'BlockStatement',
                                    body: newBody,
                                };
                            }

                            // Handle 'else'
                            const alt = current.alternate;
                            if (!alt) break;

                            if (alt.type === 'IfStatement') {
                                // Continue walking the chain
                                current = alt;
                            } else {
                                // Else-final: wrap if needed
                                if (alt.type !== 'BlockStatement') {
                                    let newBody = [];
                                    handleStatement(alt, newBody);
                                    current.alternate = {
                                        type: 'BlockStatement',
                                        body: newBody,
                                    };
                                }
                                break; // End of chain
                            }
                        }
                    } else if (
                        stmt.type === 'WhileStatement' ||
                        stmt.type === 'DoWhileStatement' ||
                        stmt.type === 'ForStatement' ||
                        stmt.type === 'ForInStatement' ||
                        stmt.type === 'ForOfStatement'
                    ) {
                        // All loop types share a `body` property
                        if (stmt.body && stmt.body.type !== 'BlockStatement') {
                            const newBody = [];
                            handleStatement(stmt.body, newBody);
                            stmt.body = {
                                type: 'BlockStatement',
                                body: newBody,
                            };
                        }
                    }


                    let callee = null;
                    let calleeisthread = false;
                    let calleeisthreadgroup = false;
                    let calleeisisolatedthread = false;
                    
                    try {
                        callee = eval(ThreadedTools.escodegenerator.generate(stmt.expression.callee.object));
                        calleeisthread = callee instanceof Thread;
                        calleeisthreadgroup = callee instanceof ThreadGroup;
                        calleeisisolatedthread = callee instanceof IsolatedThread;
                    } catch(ex) {
                        // Ignored...
                    }
                    let stmtisjoin = stmt.type === 'ExpressionStatement' &&
                        stmt.expression.type === 'CallExpression' &&
                        stmt.expression.callee.type === 'MemberExpression' &&
                        stmt.expression.callee.property.type === 'Identifier' &&
                        stmt.expression.callee.property.name === 'join' &&
                        (calleeisthread || calleeisthreadgroup || calleeisisolatedthread);

                    if (stmtisjoin) {
                        // thread.join case...
                        const threadVar = stmt.expression.callee.object;
    
                        const callArgs = stmt.expression.arguments;

                        jointThreadId++;

                        if (callArgs.length >= 1) {
                            // thread.join(timeoutms) case...
                            newBody.push({
                                type: 'VariableDeclaration',
                                declarations: [{
                                    type: 'VariableDeclarator',
                                    id: { type: 'Identifier', name: `__isjointimeout${jointThreadId}__` },
                                    init: { type: 'Literal', value: false }
                                }],
                                kind: 'let',
                                leadingComments: [
                                    {
                                        type: 'Line',
                                        value: ` AUTO GENERATED : ${ThreadedTools.escodegenerator.generate(stmt).replaceAll(';', '')} call implementation...`
                                    }
                                ]
                            });

                            newBody.push({
                                type: 'VariableDeclaration',
                                declarations: [{
                                    type: 'VariableDeclarator',
                                    id: { type: 'Identifier', name: `__jointimeout${jointThreadId}__` },
                                    init: {
                                        type: 'ExpressionStatement',
                                        expression: {
                                            type: 'CallExpression',
                                            callee: { type: 'Identifier', name: 'setTimeout' },
                                            arguments: [
                                                {
                                                    type: 'FunctionExpression',
                                                    id: null,
                                                    params: [],
                                                    body: {
                                                        type: 'BlockStatement',
                                                        body: [
                                                            {
                                                                type: 'ExpressionStatement',
                                                                expression: {
                                                                    type: 'AssignmentExpression',
                                                                    operator: '=',
                                                                    left: { type: 'Identifier', name: `__isjointimeout${jointThreadId}__` },
                                                                    right: { type: 'Literal', value: true }
                                                                }
                                                            }
                                                        ],
                                                        processforbidden: true
                                                    }
                                                },
                                                callArgs[0] // the timeoutms argument
                                            ]
                                        }
                                    }
                                }],
                                kind: 'let'
                            });
                        }

                        newBody.push({
                            type: 'VariableDeclaration',
                            declarations: [{
                                type: 'VariableDeclarator',
                                id: { type: 'Identifier', name: `__jointthread${calleeisthread ? "" : "group"}${jointThreadId}__` },
                                init: threadVar
                            }],
                            kind: 'let',
                            leadingComments: callArgs.length >= 1 ? null : [
                                {
                                    type: 'Line',
                                    value: ` AUTO GENERATED : ${ThreadedTools.escodegenerator.generate(stmt).replaceAll(';', '')} call implementation...`
                                }
                            ]
                        });

                        newBody.push({
                            type: 'WhileStatement',
                            test: callArgs.length >= 1 ? {
                                type: 'LogicalExpression',
                                operator: '&&',
                                left: {
                                    type: 'CallExpression',
                                    callee: {
                                        type: 'MemberExpression',
                                        object: {
                                            type: 'Identifier',
                                            name: `__jointthread${calleeisthread ? "" : "group"}${jointThreadId}__`
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: 'isrunning'
                                        },
                                    computed: false
                                    },
                                    arguments: []
                                },
                                right: {
                                    type: 'UnaryExpression',
                                    operator: '!',
                                    prefix: true,
                                    argument: {
                                        type: 'Identifier',
                                        name: `__isjointimeout${jointThreadId}__`
                                    }
                                }
                            } : {
                                type: 'CallExpression',
                                callee: {
                                    type: 'MemberExpression',
                                    object: {
                                        type: 'Identifier',
                                        name: `__jointthread${calleeisthread ? "" : "group"}${jointThreadId}__`
                                    },
                                    property: {
                                        type: 'Identifier',
                                        name: 'isrunning'
                                    },
                                computed: false
                                },
                                arguments: []
                            },
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'YieldExpression',
                                        argument: isFunctionGenerator ? null : { type: 'Identifier', name: '__thefunctionstepscount__' }
                                    }
                                }]
                            }
                        });

                        if (callArgs.length >= 1) {
                            // thread.join(timeoutms) case...
                            newBody.push({
                                type: 'ExpressionStatement',
                                expression: {
                                    type: 'CallExpression',
                                    callee: {
                                        type: 'Identifier',
                                        name: 'clearTimeout'
                                    },
                                    arguments: [
                                        {
                                            type: 'Identifier',
                                            name: `__jointimeout${jointThreadId}__`
                                        }
                                    ]
                                }
                            });
                        }

                        newBody.push({
                            type: 'EmptyStatement',
                            leadingComments: [
                                {
                                    type: 'Line',
                                    value: ` ${ThreadedTools.escodegenerator.generate(stmt).replaceAll(';', '')} call implementation end`
                                }
                            ]
                        });
                    }

                    if ((Thread.innerfunctionsisolation === true || innerfunctionsisolation == true) &&
                        (stmt.type === 'VariableDeclaration' ||
                         stmt.type === 'ExpressionStatement' ||
                         stmt.type === 'FunctionDeclaration' ||
                         stmt.type === 'FunctionExpression' ||
                         stmt.type === 'ArrowFunctionExpression')) {
                        const originalVarName = stmt.type === 'VariableDeclaration' ?
                            stmt.declarations[0].id.name :
                            null;
                        const callExpr = stmt.type === 'VariableDeclaration' ?
                            stmt.declarations[0].init :
                            stmt.expression;

                        let functionCallee = null;
                        let isNativeOrThreadFunction = false;
                        let dontIsolateToThread = false;
                        if (callExpr.type === 'ArrowFunctionExpression') {
                            for (const declarator of stmt.declarations) {
                                if (declarator.type === 'VariableDeclarator' && declarator.id.type === 'Identifier') {
                                    const varName = declarator.id.name;
                                    functionCallee = {
                                        type: 'Identifier',
                                        name: varName
                                    };
                                }
                            }
                            let generatedcode = null;
                            try {
                                generatedcode = '(' + ThreadedTools.escodegenerator.generate(callExpr) + ')';
                                isNativeOrThreadFunction = ThreadExecutor.__isNativeOrLibraryFunction__(eval(generatedcode));     
                            } catch (ex) {
                                try {
                                    isNativeOrThreadFunction = ThreadExecutor.__isNativeOrLibraryFunction__(eval(generatedcode.replace("this", "ThreadExecutor.currentThread")));
                                } catch (ex2) {
                                    isNativeOrThreadFunction = false;
                                }
                            }
                            dontIsolateToThread = true;
                        } else {
                            functionCallee = callExpr.callee;
                            let generatedcode = null;
                            if (functionCallee !== undefined && functionCallee !== null) try {
                                generatedcode = `(${ThreadedTools.escodegenerator.generate(functionCallee)})`;
                                isNativeOrThreadFunction = ThreadExecutor.__isNativeOrLibraryFunction__(eval(generatedcode));
                            } catch (ex) {
                                try {
                                    isNativeOrThreadFunction = ThreadExecutor.__isNativeOrLibraryFunction__(eval(generatedcode.replaceAll("this", "Thread.this")));
                                } catch (ex2) {
                                    isNativeOrThreadFunction = false;
                                }
                            }
                            dontIsolateToThread = callExpr.type !== 'CallExpression';
                        }

                        if (isNativeOrThreadFunction || dontIsolateToThread) {
                            if (!stmtisjoin) newBody.push(stmt);
                            if (!isFunctionGenerator) newBody.push({
                                type: 'ExpressionStatement',
                                expression: {
                                    type: 'YieldExpression',
                                    argument: {
                                        type: 'UpdateExpression',
                                        operator: '++',
                                        argument: {
                                            type: 'Identifier',
                                            name: '__thefunctionstepscount__'
                                        },
                                        prefix: false
                                    }
                                }
                            });

                            return;
                        }

                        if (! dontIsolateToThread) {
                            const threadVar = `__innerfunctionexecutor${++functionId}__`;
                            const tempVarName = `__innerfunctionexecutionresult${functionId}__`;
                            newBody.push(
                               // const __innerfunctionexecutorN__ = Thread.innerThreadFor(ThreadExecutor.currentThread, FUNCTIONAME).setArgs(...args).setId(this.id + ''s inner thread').isolateErrors(true).start();
                               {
                                    type: 'VariableDeclaration',
                                    kind: 'const',
                                    declarations: [{
                                        type: 'VariableDeclarator',
                                        id: { type: 'Identifier', name: threadVar },
                                        init: {
                                            type: 'CallExpression',
                                            callee: {
                                                type: 'MemberExpression',
                                                object: {
                                                    type: 'CallExpression',
                                                    callee: {
                                                        type: 'MemberExpression',
                                                        object: {
                                                            type: 'CallExpression',
                                                            callee: {
                                                                type: 'MemberExpression',
                                                                object: {
                                                                    type: 'CallExpression',
                                                                    callee: {
                                                                        type: 'MemberExpression',
                                                                        object: {
                                                                            type: 'CallExpression',
                                                                            callee: {
                                                                                type: 'MemberExpression',
                                                                                object: { type: 'Identifier', name: 'Thread' },
                                                                                property: { type: 'Identifier', name: 'innerThreadFor' },
                                                                                computed: false,
                                                                                optional: false
                                                                            },
                                                                            arguments: [
                                                                                {
                                                                                    type: "MemberExpression",
                                                                                    object: {
                                                                                        type: "Identifier",
                                                                                        name: "ThreadExecutor"
                                                                                    },
                                                                                    property: {
                                                                                        type: "Identifier",
                                                                                        name: "currentThread"
                                                                                    },
                                                                                    computed: false,
                                                                                    optional: false
                                                                                },
                                                                                functionCallee
                                                                            ]
                                                                        },
                                                                        property: { type: 'Identifier', name: 'setId' },
                                                                        computed: false,
                                                                        optional: false
                                                                    },
                                                                    arguments: [
                                                                        {
                                                                            type: 'BinaryExpression',
                                                                            operator: '+',
                                                                            left: {
                                                                                type: 'MemberExpression',
                                                                                object: {
                                                                                    type: "MemberExpression",
                                                                                    object: {
                                                                                        type: "Identifier",
                                                                                        name: "ThreadExecutor"
                                                                                    },
                                                                                    property: {
                                                                                        type: "Identifier",
                                                                                        name: "currentThread"
                                                                                    },
                                                                                    computed: false,
                                                                                    optional: false
                                                                                },
                                                                                property: { type: 'Identifier', name: 'id' },
                                                                                computed: false,
                                                                                optional: false
                                                                            },
                                                                            right: {
                                                                                type: 'Literal',
                                                                                value: "'s inner thread",
                                                                                raw: "'s inner thread"
                                                                            }
                                                                        }
                                                                    ]
                                                                },
                                                                property: { type: 'Identifier', name: 'setArgs' },
                                                                computed: false,
                                                                optional: false
                                                            },
                                                            arguments: callExpr.arguments
                                                        },
                                                        property: { type: 'Identifier', name: 'isolateErrors' },
                                                        computed: false,
                                                        optional: false
                                                    },
                                                    arguments: [
                                                        {
                                                            type: 'Literal',
                                                            value: true,
                                                            raw: 'true'
                                                        }
                                                    ]
                                                },
                                                property: { type: 'Identifier', name: 'start' },
                                                computed: false,
                                                optional: false
                                            },
                                            arguments: []
                                        }
                                    }]
                                },
                                // while (__innerfunctionexecutorN__.isrunning()) { yield __thefunctionstepscount__; or yield; // if already a generator }
                                {
                                    type: 'WhileStatement',
                                    test: {
                                        type: 'CallExpression',
                                        callee: {
                                            type: 'MemberExpression',
                                            object: {
                                                type: 'Identifier',
                                                name: threadVar
                                            },
                                            property: {
                                                type: 'Identifier',
                                                name: 'isrunning'
                                            },
                                        computed: false
                                        },
                                        arguments: []
                                    },
                                    body: {
                                        type: 'BlockStatement',
                                        body: [{
                                            type: 'ExpressionStatement',
                                            expression: {
                                                type: 'YieldExpression',
                                                argument: isFunctionGenerator ? null : {
                                                    type: 'Identifier',
                                                    name: '__thefunctionstepscount__'
                                                }
                                            }
                                        }]
                                    }
                                },
                                // let ORIGINALVARNAME = __innerfunctionexecutorN__.result();
                                // Or let __innerfunctionexecutionresultN__ = __innerfunctionexecutorN__.result(); for non retuning function
                                {
                                    type: 'VariableDeclaration',
                                    kind: 'let',
                                    declarations: [{
                                        type: 'VariableDeclarator',
                                        id: { type: 'Identifier', name: originalVarName !== null ? originalVarName : tempVarName },
                                        init: {
                                            type: 'CallExpression',
                                            callee: {
                                                type: 'MemberExpression',
                                                object: { type: 'Identifier', name: threadVar },
                                                property: { type: 'Identifier', name: 'result' }
                                            },
                                            arguments: []
                                        }
                                    }]
                                },
                                // yield __thefunctionstepscount__++; or nothing if already a generator function
                                !isFunctionGenerator ? {
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'YieldExpression',
                                        argument: {
                                            type: 'UpdateExpression',
                                            operator: '++',
                                            argument: {
                                                type: 'Identifier',
                                                name: '__thefunctionstepscount__'
                                            },
                                            prefix: false
                                        }
                                    }
                                } : {
                                    type: 'EmptyStatement'
                                },
                                {
                                    type: 'IfStatement',
                                    test: {
                                        type: 'BinaryExpression',
                                        operator: 'instanceof',
                                        left: { type: 'Identifier', name: originalVarName !== null ? originalVarName : tempVarName },
                                        right: { type: 'Identifier', name: 'Error' }
                                    },
                                    consequent: {
                                        type: 'BlockStatement',
                                        body: [
                                            {
                                                type: 'ThrowStatement',
                                                argument: {
                                                    type: 'NewExpression',
                                                    callee: { type: 'Identifier', name: 'ThreadError' },
                                                    arguments: [
                                                        { type: 'Identifier', name: originalVarName !== null ? originalVarName : tempVarName },
                                                        {
                                                            type: 'VariableDeclarator',
                                                            id: { type: 'Identifier', name: threadVar }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    alternate: null
                                }
                            );
                        }
                    } else {
                        if (!stmtisjoin) newBody.push(stmt);
                        if (!isFunctionGenerator && node.isinnerfunction !== true) if (stmt.type !== 'ReturnStatement' &&
                            stmt.type !== 'ContinueStatement' &&
                            stmt.type !== 'BreakStatement' &&
                            stmt.type !== 'ThrowStatement') {
                            newBody.push({
                                type: 'ExpressionStatement',
                                expression: {
                                    type: 'YieldExpression',
                                    argument: {
                                        type: 'UpdateExpression',
                                        operator: '++',
                                        argument: {
                                            type: 'Identifier',
                                            name: '__thefunctionstepscount__'
                                        },
                                        prefix: false
                                    }
                                }
                            });
                        }
                    }
                }

                const newBody = [];
                for (let i = 0; i < node.body.length; i++) {
                    let stmt = node.body[i];

                    handleStatement(stmt, newBody);
                }
                
                node.body = newBody;
            }

            Thread.__stopcontrols__ = false;
            IsolatedThread.__stopcontrols__ = false;
            ThreadGroup.__stopcontrols__ = false;

            return node;
        });

        ThreadedTools.ast_walker.simple(ast, {
            FunctionDeclaration(node) {
                if (Thread.innerfunctionsisolation !== true && innerfunctionsisolation !== true)
                    return;
                if (node.body.processforbidden === true) return;
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node, ! node.generator, true);
                node.generator = true;
            },
            FunctionExpression(node) {
                if (Thread.innerfunctionsisolation !== true && innerfunctionsisolation !== true)
                    return;
                if (node.body.processforbidden === true) return;
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node, ! node.generator, true);
                node.generator = true;
            },
            ArrowFunctionExpression(node) {
                // Wrap if it's not a block body
                if (node.body.type !== 'BlockStatement') {
                    ThreadExecutor.__wrapArrowFunctionInBlockStatement__(node);
                }
                if (Thread.innerfunctionsisolation !== true && innerfunctionsisolation !== true)
                    return;
                if (node.body.processforbidden === true) return;
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node, ! node.generator, true);
                node.type = 'FunctionExpression';
                node.generator = true;
                node.expression = false;
            }
        });

        ThreadedTools.ast_walker.simple(ast, {
            FunctionDeclaration(node) {
                if (node.body.processforbidden === true) return;
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node, ! node.generator, true);
                node.generator = true;
                node.body.body.unshift({
                            type: 'EmptyStatement',
                            leadingComments: [
                                {
                                    type: 'Line',
                                    value: ' AUTO GENERATED THREAD GENERATOR FUNCTION BY threaded.js...'
                                }
                            ]
                        });
            },
            FunctionExpression(node) {
                if (node.body.processforbidden === true) return;
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node, ! node.generator, true);
                node.generator = true;
                node.body.body.unshift({
                            type: 'EmptyStatement',
                            leadingComments: [
                                {
                                    type: 'Line',
                                    value: ' AUTO GENERATED THREAD GENERATOR FUNCTION BY threaded.js...'
                                }
                            ]
                        });
            },
            ArrowFunctionExpression(node) {
                // Wrap if it's not a block body
                if (node.body.type !== 'BlockStatement') {
                    ThreadExecutor.__wrapArrowFunctionInBlockStatement__(node);
                }
                if (node.body.processforbidden === true) return;
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node, ! node.generator, true);
                node.type = 'FunctionExpression';
                node.generator = true;
                node.expression = false;
                node.body.body.unshift({
                            type: 'EmptyStatement',
                            leadingComments: [
                                {
                                    type: 'Line',
                                    value: ' AUTO GENERATED THREAD GENERATOR FUNCTION BY threaded.js...'
                                }
                            ]
                        });
            }
        }, {
        // override default behavior: prevent descending into function bodies
        ...ThreadedTools.ast_walker.base,
        FunctionDeclaration() {}, // override walk behavior: skip body
        FunctionExpression() {},
        ArrowFunctionExpression() {}
        });

        // Generate code
        let newCode = ThreadedTools.escodegenerator.generate(ast, {comment: true});

        // Eval into an actual generator function
        let generatorFunc = eval(newCode);
        return generatorFunc;
    }

    static __isNativeFunction__(fn) {
        if (fn === undefined) return false;
        if (typeof fn !== 'function') return false;
        let isNativeFunction = typeof fn === 'function' &&
                               fn.toString().includes("[native code]") || fn.toString().includes("[wasm code]");
        if (! isNativeFunction) {
            // Deno case...
            isNativeFunction = typeof fn === 'function' && /#\w+/.test(fn.toString());
        }
        return isNativeFunction;
    }

    static __isNativeOrLibraryFunction__(fn) {
        fn.name; // this line forces resolution of name
        if (fn === undefined) return false;
        if (typeof fn !== 'function') return false;
        const name = fn.name;
        if (!name) return false;
        return ThreadExecutor.__isNativeFunction__(fn) || Thread.prototype.hasOwnProperty(name) ||
               ThreadExecutor.prototype.hasOwnProperty(name) || ThreadGroup.prototype.hasOwnProperty(name) ||
               ThreadError.prototype.hasOwnProperty(name);
    }

    static __wrapArrowFunctionInBlockStatement__(node) {
        const originalBody = node.body;

        if (node.expression) {
            node.body = {
                type: "BlockStatement",
                body: [
                    {
                        type: "ReturnStatement",
                        argument: node.body
                    }
                ]
            };
            node.expression = false;
        }
    }

    static __wrapFunctionBodyInTryCatch__(node, addfunctionstepscountvar, addcurrentthreadcheckline) {
        if (node.wrappedintrycatch === true) return;
        node.wrappedintrycatch = true;

        const originalBody = node.body.body;

        node.body.body = [
            {
                type: "TryStatement",
                block: {
                    type: "BlockStatement",
                    body: [
                        addcurrentthreadcheckline === true ? {
                            type: 'IfStatement',
                            test: {
                                type: 'BinaryExpression',
                                operator: '==',
                                left: {
                                    type: 'MemberExpression',
                                    object: {
                                        type: 'Identifier',
                                        name: 'ThreadExecutor'
                                    },
                                    property: {
                                        type: 'Identifier',
                                        name: 'currentThread'
                                    },
                                    computed: false
                                },
                                right: {
                                    type: 'Literal',
                                    value: null,
                                    raw: 'null'
                                }
                            },
                            consequent: {
                                type: 'BlockStatement',
                                body: [
                                    {
                                        type: 'ThrowStatement',
                                        argument: {
                                            type: 'NewExpression',
                                            callee: {
                                                type: 'Identifier',
                                                name: 'ThreadError'
                                            },
                                            arguments: [
                                                {
                                                    type: 'Literal',
                                                    value: 'a thread function called outside thread environment',
                                                    raw: '"a thread function called outside thread environment"'
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        } : {
                            type: 'EmptyStatement'
                        },
                        addfunctionstepscountvar === true ? {
                            type: 'VariableDeclaration',
                            declarations: [
                            {
                                type: 'VariableDeclarator',
                                id: { type: 'Identifier', name: '__thefunctionstepscount__' },
                                init: { type: 'Literal', value: 0 }
                            }
                            ],
                                kind: 'let'
                        } : {
                                type: 'EmptyStatement'
                        },
                        ...originalBody
                    ]
                },
                handler: {
                    type: "CatchClause",
                    param: { type: "Identifier", name: "ex" },
                    body: {
                        type: "BlockStatement",
                        body: [
                            {
                                type: "ExpressionStatement",
                                expression: {
                                    type: "CallExpression",
                                    callee: {
                                        type: "MemberExpression",
                                        object: { type: "Identifier", name: "ThreadExecutor" },
                                        property: { type: "Identifier", name: "__threadExceptionOccurred__" }
                                    },
                                    arguments: [{ type: "Identifier", name: "ex" }]
                                }
                            },
                            {
                                type: "ReturnStatement",
                                argument: { type: "Identifier", name: "ex" }
                            }
                        ]
                    }
                },
                finalizer: null
            }
        ];
    }

    static onfinish(globalFinishFunc) {
        ThreadExecutor.__globalFinishFunc__ = globalFinishFunc;
    }

    static onyield(globalYieldFunc) {
        ThreadExecutor.__globalYieldFunc__ = globalYieldFunc;
    }
}

ThreadExecutor.ADAPTIVE = -1;

class ThreadGroup {
    constructor(...threads) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        
        if (ThreadGroup.__count__ === undefined || ThreadGroup.__count__ === null || Number.isNaN(ThreadGroup.__count__)) {
            ThreadGroup.__count__ = 0;
        }
        ThreadGroup.__count__++;
        this.id = 'anonymous threadgroup n-' + ThreadGroup.__count__;
    
        if (threads === undefined || threads === null) {
            this.threads = [];
        } else {
            this.threads = threads;
        }
        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.__threadgroup__ = this;
            }
        }
        this.__delaytimeout__ = null;
        this.__sleeping__ = false;
        this.__started__ = false;
        this.__running__ = false;
        this.__stopped__ = false;
        this.__paused__ = false;
    }

    setId(id) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.id = (id === undefined || id === null) ? ('anonymous threadgroup n-' + ThreadGroup.__count__) : (id + ' (threadgroup n-' + ThreadGroup.__count__ + ')');
        return this;
    }

    add(thread) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (thread === undefined || thread === null) {
            throw new ThreadError("Given thread in threadgroup add function is undefined or null", this);
        }

        this.threads.push(thread);
        thread.__threadgroup__ = this;
        return this;
    }

    remove(thread) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (thread === undefined || thread === null) {
            return this;
        }

        const previousIndex = this.threads.indexOf(thread);
        if (previousIndex === -1) {
            throw new ThreadError("Cannot remove thread \"" + thread.id + " from threadgroup, the thread is not added to that threadgroup");
        }

        this.threads.splice(previousIndex, 1);
        thread.__threadgroup__ = undefined;
        return this;
    }

    setPriorityLevel(prioritylevel) {
        if (ThreadGroup.__stopcontrols__ === true) return this;// Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        if (typeof prioritylevel !== 'number') {
            throw new ThreadError('thread priority level must be a valid number', this);
        }
        if (! Number.isInteger(prioritylevel)) {
            throw new ThreadError('thread priority level must be an integer number', this);
        }
        if (prioritylevel < 0) {
            throw new ThreadError('thread priority level must be a positive number', this);
        }

        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.setPriorityLevel(prioritylevel);
            }
        }
        return this;
    }

    length() {
        return this.threads.length;
    }

    static count() {
        return ThreadGroup.__count__;
    }

    stepsCount() {
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        let totalStepsCount = 0;
        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                totalStepsCount += thread.stepsCount();
            }
        }

        return totalStepsCount;
    }

    start() {
        if (ThreadGroup.__stopcontrols__ === true) return this;// Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }
        this.__started__ = true;

        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.start();
            }
        }
        return this;
    }

    startAfter(ms) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        if (! this.__paused__) this.pause();
        this.__delaytimeout__ = setTimeout(() => this.start(), ms);
        return this;
    }

    startChained(reverse = false, delayBetween = 0) {
        if (ThreadGroup.__stopcontrols__ === true) return this;// Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }
        this.__started__ = true;

        for (let i = 0; i < this.threads.length; i++) {
            let index = i;
            if (reverse) index = this.threads.length - 1 - i;
            const thread = this.threads[index];
            let nextindex = index + (reverse ? -1 : 1);
            const nextthread = (nextindex >= 0 && nextindex < this.threads.length) ? this.threads[nextindex] : undefined;
            if (thread !== undefined && thread !== null && nextthread !== undefined && nextthread !== null) {
                let previousOnFinish = thread.__finishFunc__;
                thread.onfinish((result) => {
                    thread.onfinish(previousOnFinish);
                    if (delayBetween == 0) {
                        nextthread.start();
                    } else {
                        if (thread.__delaytimeout__ !== null) {
                            try {
                                clearTimeout(thread.__delaytimeout__);
                            } catch(ex) {
                                // Ignored...
                            }
                        }
                        thread.__delaytimeout__ = setTimeout(() => nextthread.start(), delayBetween);
                    }
                    if (typeof previousOnFinish === 'function') previousOnFinish(result)
                });
            }
            if (i === 0 && thread !== undefined && thread !== null) thread.start();
        }
        return this;
    }

    startChainedAfter(ms, reverse, delayBetween) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.startChained(reverse, delayBetween), ms);
        return this;
    }

    interrupt() {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        return this.stop();
    }

    interruptAfter(ms) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.interrupt(), ms);
        return this;
    }

    stop() {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }
        if (! this.__started__) {
           console.error("ThreadGroup not started yet");
           return this;
        }
        if (this.__stopped__) {
           console.error("ThreadGroup already stopped");
           return this;
        }
        this.__stopped__ = true;

        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.stop();
            }
        }
        return this;
    }

    stopAfter(ms) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.stop(), ms);
        return this;
    }

    pause() {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }
        if (this.__paused__) {
           console.error("ThreadGroup already paused");
           return this;
        }
        this.__paused__ = true;
        
        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                if (! thread.__paused__) thread.pause();
            }
        }
        return this;
    }

    pauseAfter(ms) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.pause(), ms);
        return this;
    }

    resume() {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }
        if (!this.__paused__ && !this.__sleeping__) {
           console.error("ThreadGroup is neither paused nor sleeping");
           return this;
        }

        this.__sleeping__ = false;
        this.__paused__ = false;

        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.resume();
            }
        }
        return this;
    }

    resumeAfter(ms) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.resume(), ms);
        return this;
    }

    sleep(ms) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        this.__sleeping__ = true;

        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.sleep(ms);
            }
        }
        return this;
    }

    sleepAfter(delay, ms) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }
        
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.sleep(ms), delay);
        return this;
    }

    join(timeoutms) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        // The design of joining can't be achieved just by looping until all the threads finishes executing
        // That will block the entire event loop
        // Instead...
        // For efficiency...
        // threadgroup.join()
        // Will be replaced with :
        // while (threadgroup.isrunning()) {
        //    yield __thefunctionstepscount__; // or just yield; for custom generator functions
        // }
        // And
        // threadgroup.join(timeoutms)
        // Will be replaced with :
        // let __isjointimeoutN__ = false;
        // let __jointimeoutN__ = setTimeout(function () { __isjointimeoutN__ = true; }, timeoutms)
        // while (threadgroup.isrunning() && !__isjointimeoutN__) {
        //    yield __thefunctionstepscount__; // or just yield; for custom generator functions
        // }
        // clearTimeout(__jointimeoutN__);
        // Using the AST processor...
        // Only inside a thread environment (inside a thread)
        // Using it somewhere else will throw the error below...
        if (true) throw new ThreadError("ThreadGroup.join method can't be called outside thread environment");
    }

    catch(exceptionFunc) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.__exceptionFunc__ = exceptionFunc;
        return this;
    }

    onfinish(finishFunc) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.__finishFunc__ = finishFunc;
        return this;
    }

    onyield(yieldFunc) {
        if (ThreadGroup.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.__yieldFunc__ = yieldFunc;
        return this;
    }

    isdone() {
        let done = true;
        for (const thread of this.threads) {
            if (! thread.isdone()) {
                done = false;
                break;
            }
        }

        return done;
    }

    issleeping() {
        return this.__sleeping__;
    }

    isstarted() {
        return this.__started__;
    }

    isrunning() {
        let running = false;
        for (const thread of this.threads) {
            if (thread.isrunning()) {
                running = true;
                break;
            }
        }

        return running;
    }

    isstopped() {
        return this.__stopped__;
    }

    ispaused() {
        return this.__paused__;
    }
}

ThreadGroup.__stopcontrols__ = false;

class ThreadTask {
    constructor() {
        if (ThreadTask.__count__ === undefined || ThreadTask.__count__ === null || Number.isNaN(ThreadTask.__count__)) {
            ThreadTask.__count__ = 0;
        }
        ThreadTask.__count__++;
        this.id = 'anonymous threadtask n-' + ThreadTask.__count__;
        this.queue = [];
    }

    static run(fn) {
        let threadTask = new ThreadTask();
        threadTask.queue.push(fn);

        return threadTask;
    }

    then(fn) {
        this.queue.push(fn);
        return this;
    }

    setId(id) {
        this.id = (id === undefined || id === null) ? ('anonymous threadtask n-' + ThreadTask.__count__) : (id + ' (threadtask n-' + ThreadTask.__count__ + ')');
        return this;
    }

    chained(prioritylevel) {
        let branchtask = {
            __isolated__: false,
            start: (reverse, delayBetween) => {
                this.group(prioritylevel, branchtask.__branchtaskid__, branchtask.__isolated__).startChained(reverse, delayBetween);
                return branchtask;
            },
            startAfter: (delay, reverse, delayBetween) => {
                this.group(prioritylevel, branchtask.__branchtaskid__, branchtask.__isolated__).startChainedAfter(delay, reverse, delayBetween);
                return branchtask;
            },
            chained: this.chained,
            atonce: this.atonce,
            isolated: (__isolated__ = true) => {
                branchtask.__isolated__ = __isolated__;
                return branchtask;
            },
            setId: (id) => {
                branchtask.__branchtaskid__ = id;
                return branchtask;
            },
            group: this.group,
            queue: this.queue,
            __branchtaskid__: this.id,
            run: ThreadTask.run
        };

        return branchtask;
    }

    atonce(prioritylevel) {
        let branchtask = {
            __isolated__: false,
            start: () => {
                this.group(prioritylevel, branchtask.__branchtaskid__, branchtask.__isolated__).start();
                return branchtask;
            },
            startAfter: (delay) => {
                this.group(prioritylevel, branchtask.__branchtaskid__, branchtask.__isolated__).startAfter(delay);
                return branchtask;
            },
            chained: this.chained,
            atonce: this.atonce,
            isolated: (__isolated__ = true) => {
                branchtask.__isolated__ = __isolated__;
                return branchtask;
            },
            setId: (id) => {
                branchtask.__branchtaskid__ = id;
                return branchtask;
            },
            group: this.group,
            queue: this.queue,
            __branchtaskid__: this.id,
            run: ThreadTask.run
        };

        return branchtask;
    }

    group(prioritylevel = Thread.LOW_PRIORITY_LEVEL, id = this.id, isolated = false) {
        let threadGroup = new ThreadGroup();
        for (const fn of this.queue) threadGroup.add(isolated ? new IsolatedThread(fn, (fn.name?.trim() ? fn.name + '\'s ThreadTask isolated thread' : 'anonymous ThreadTask isolated thread') + ` [${id}]`) : new Thread(fn, prioritylevel, (fn.name?.trim() ? fn.name + '\'s ThreadTask thread' : 'anonymous ThreadTask thread') + ` [${id}]`));

        return threadGroup;
    }
}

class ThreadError extends Error {
    constructor(message, thread) {
        super((thread === undefined ? "" : (thread instanceof Thread ? "error in thread " : "error in threadgroup ") + "\"" + thread.id + "\""));
        this.cause = message instanceof Error ? message : undefined;
    }
}

class IsolatedThread {
    constructor(givenfunc, id) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (IsolatedThread.__count__ === undefined || IsolatedThread.__count__ === null || Number.isNaN(IsolatedThread.__count__)) {
            IsolatedThread.__count__ = 0;
        }
        IsolatedThread.__count__++;
        if (givenfunc !== undefined) {
            this.__func__ = givenfunc;
            this.__generatorFunc__ = ThreadExecutor.__generatorFunc__(givenfunc, false);
            this.__createInternalWebWorker__();
        }
        this.id = id === undefined ? ('anonymous isolated thread n-' + IsolatedThread.__count__) : (id + ' (isolated thread n-' + IsolatedThread.__count__ + ')');
        if (IsolatedThread.threads === undefined || IsolatedThread.threads === null) {
            IsolatedThread.threads = new Map();
        }
        IsolatedThread.threads.set(this.id, this);
        this.__stepscount__ = 0;
        this.__args__ = [];
        this.__result__ = null;
        this.__sleepingtimeout__ = null;
        this.__delaytimeout__ = null;
        this.__done__ = false;
        this.__sleeping__ = false;
        this.__started__ = false;
        this.__running__ = false;
        this.__stopped__ = false;
        this.__paused__ = false;
        this.__terminated__ = false;
    }

    static count() {
        return IsolatedThread.__count__;
    }

    setId(id) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (id === undefined || id === null) {
            console.error("Null or undefined isolated thread id in setId method");
            return this;
        }
        IsolatedThread.threads.delete(this.id);
        this.id = id + ' (isolated thread n-' + IsolatedThread.__count__ + ')';
        IsolatedThread.threads.set(this.id, this);
        return this;
    }

    setArgs(...args) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        this.__args__ = args;
        this.__argschanged__ = true;
        return this;
    }

    setFunction(fn) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (! this.__paused__) this.pause();
        this.__func__ = fn;
        this.__generatorFunc__ = ThreadExecutor.__generatorFunc__(this.__func__, false);
        if (this.__started__) this.start();
        return this;
    }

    toString() {
        return this.id;
    }

    stepsCount() {
        return this.__stepscount__;
    }

    __createInternalWebWorker__() {
        let onmessage = (e) => {
            let data = e.data === undefined ? e : e.data;
            let id = data.id;
            this.__result__ = data.result;
            this.__done__ = data.done;
            let error = data.error;
            if (error !== undefined && error !== null) {
                if (this.__exceptionFunc__ !== undefined && this.__exceptionFunc__ !== null) {
                    this.__exceptionFunc__(error);
                }
            } else {
                if (this.isdone()) {
                    if (this.__finishFunc__ !== undefined && this.__finishFunc__ !== null) {
                        this.__finishFunc__(this.result());
                    }
                    this.terminate();
                } else {
                    this.__stepscount__ = this.__result__;
                    if (this.__yieldFunc__ !== undefined && this.__yieldFunc__ !== null) {
                        this.__yieldFunc__(this.result());
                    }
                }
            }

            if (data.terminate === true) {
                this.terminate();
            }
        }

        ThreadedTools.createWorker(this, this.__generatorFunc__, onmessage);
    }

    __notifyWorker__(restarted) {
        let args = this.__argschanged__ ? this.__args__ : null;

        ThreadedTools.postMessageToWorker(this.__worker__, {
            id: this.id,
            sleeping: this.__sleeping__,
            started: this.__started__,
            paused: this.__paused__,
            stopped: this.__stopped__,
            running: this.__running__,
            args: args,
            restarted: restarted === true,
            argschanged: this.__argschanged__
        });

        this.__argschanged__ = false;
    }

    start() {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (this.__sleepingtimeout__ !== null) try {
            clearTimeout(this.__sleepingtimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__stepscount__ = 0;
        this.__result__ = null;
        this.__done__ = false;
        this.__sleeping__ = false;
        this.__started__ = true;
        this.__paused__ = false;
        this.__stopped__ = false;
        this.__running__ = true;
        this.__notifyWorker__(true);

        return this;
    }

    startAfter(ms) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        if (! this.__paused__) this.pause();
        this.__delaytimeout__ = setTimeout(() => this.start(), ms);
        return this;
    }

    interrupt() {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        return this.stop();
    }

    interruptAfter(ms) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        if (! this.__paused__) this.pause();
        this.__delaytimeout__ = setTimeout(() => this.interrupt(), ms);
        return this;
    }

    stop() {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (! this.__started__) {
           console.error("IsolatedThread not started yet");
           return this;
        }
        if (this.__stopped__) {
           console.error("IsolatedThread already stopped");
           return this;
        }
        this.__stopped__ = true;
        this.__running__ = false;

        this.__notifyWorker__();

        return this;
    }

    stopAfter(ms) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.stop(), ms);
        return this;
    }

    pause() {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (this.__paused__) {
           console.error("IsolatedThread already paused");
           return this;
        }
        this.__paused__ = true;
        
        this.__notifyWorker__();

        return this;
    }

    pauseAfter(ms) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.pause(), ms);
        return this;
    }

    resume() {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (!this.__paused__ && !this.__sleeping__) {
           console.error("IsolatedThread is neither paused nor sleeping");
           return this;
        }
        if (this.__sleepingtimeout__ !== null) try {
            clearTimeout(this.__sleepingtimeout__);
        } catch(ex) {
            // Ignored...
        }

        this.__sleeping__ = false;
        this.__paused__ = false;
        
        this.__notifyWorker__();

        return this;
    }

    resumeAfter(ms) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.resume(), ms);
        return this;
    }

    sleep(ms) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (this.__sleepingtimeout__ !== null) try {
            clearTimeout(this.__sleepingtimeout__);
        } catch(ex) {
            // Ignored...
        }
        if (! this.__started__) {
            throw new ThreadError("Cannot sleep isolated thread \"" + this.id + ", the thread is not started yet");
        }
        if (this.__stopped__) {
            throw new ThreadError("Cannot sleep isolated thread \"" + this.id + ", the thread is stopped");
        }
        if (! this.__running__) {
            throw new ThreadError("Cannot sleep isolated thread \"" + this.id + ", the thread is not running");
        }
        if (this.__paused__) {
            throw new ThreadError("Cannot sleep isolated thread \"" + this.id + ", the thread is paused");
        }
        
        this.__sleeping__ = true;
        this.__notifyWorker__();

        this.__sleepingtimeout__ = setTimeout(() => {
            this.__sleeping__ = false;
            this.__notifyWorker__();
        }, ms);
        return this;
    }

    sleepAfter(delay, ms) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        if (this.__delaytimeout__ !== null) try {
            clearTimeout(this.__delaytimeout__);
        } catch(ex) {
            // Ignored...
        }
        this.__delaytimeout__ = setTimeout(() => this.sleep(ms), delay);
        return this;
    }

    join(timeoutms) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        // The design of joining can't be achieved just by looping until the thread finishes executing
        // That will block the entire event loop
        // Instead...
        // For efficiency...
        // thread.join()
        // Will be replaced with :
        // while (thread.isrunning()) {
        //    yield __thefunctionstepscount__; // or just yield; for custom generator functions
        // }
        // And
        // thread.join(timeoutms)
        // Will be replaced with :
        // let __isjointimeoutN__ = false;
        // let __jointimeoutN__ = setTimeout(function () { __isjointimeoutN__ = true; }, timeoutms)
        // while (thread.isrunning() && !__isjointimeoutN__) {
        //    yield __thefunctionstepscount__; // or just yield; for custom generator functions
        // }
        // clearTimeout(__jointimeoutN__);
        // Using the AST processor...
        // Only inside a thread environment (inside a thread)
        // Using it somewhere else will throw the error below...
        if (true) throw new ThreadError("IsolatedThread.join method can't be called outside thread environment");
    }

    catch(exceptionFunc) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        this.__exceptionFunc__ = exceptionFunc;
        return this;
    }

    onfinish(finishFunc) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        this.__finishFunc__ = finishFunc;
        return this;
    }

    onyield(yieldFunc) {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" terminated`);
        this.__yieldFunc__ = yieldFunc;
        return this;
    }

    isdone() {
        return this.__done__;
    }

    issleeping() {
        return this.__sleeping__;
    }

    isstarted() {
        return this.__started__;
    }

    isrunning() {
        return this.__running__;
    }

    isstopped() {
        return this.__stopped__;
    }

    ispaused() {
        return this.__paused__;
    }

    result() {
        return this.__result__;
    }

    terminate() {
        if (IsolatedThread.__stopcontrols__ === true) return this; // Used in AST processing to prevent premature execution
        if (this.__terminated__) throw new ThreadError(`Isolated thread \"${this.__terminated__.id}\" already terminated`);
        URL.revokeObjectURL(this.__workerURL__);
        this.__worker__.terminate();
        this.__workerURL__ = null;
        this.__worker__ = null;
        this.__running__ = false;
        this.__terminated__ = true;
        return this;
    }
}

// For node.js compatibility
try {
    module.exports = { Thread, ThreadGroup, ThreadTask, IsolatedThread, ThreadExecutor, ThreadError, ThreadedTools };
} catch (ex) {
    // Ignored...
}