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

/* Version 1.0 */
class Thread {
    constructor(func, prioritylevel, id) {
        if (Thread.count === undefined) {
            Thread.count = 0;
        }
        Thread.count++;
        this.__generatorFunc__ = ThreadExecutor.__generatorFunc__(func);
        this.id = id === undefined ? ('anonymous thread n-' + Thread.count) : (id + ' (thread n-' + Thread.count + ')');
        if (ThreadExecutor.queue === undefined) {
            ThreadExecutor.queue = [];
        }

        this.__sleepingpriority__ = false;
        this.__resumingpriority__ = false;
        this.__stepscount__ = 0;
        if (prioritylevel !== undefined) {
            if (typeof prioritylevel !== 'number') {
                throw new ThreadError(this, 'thread priority level must be a valid number');
            }
            if (! Number.isInteger(prioritylevel)) {
                throw new ThreadError(this, 'thread priority level must be an integer number');
            }
            if (prioritylevel < 0) {
                throw new ThreadError(this, 'thread priority level must be a positive number');
            }

            this.prioritylevel = prioritylevel;
        } else {
            this.prioritylevel = (prioritylevel ?? 1) | 1;
        }
        this.started = false;
        this.running = false;
        this.stopped = false;
        this.paused = false;
    }

    setId(id) {
        this.id = (id === undefined || id === null) ? ('anonymous thread n-' + Thread.count) : (id + ' (thread n-' + Thread.count + ')');
        return this;
    }

    toString() {
        return this.id;
    }

    stepsCount() {
        return this.__stepscount__;
    }

    setPriorityLevel(prioritylevel) {
        if (typeof prioritylevel !== 'number') {
            throw new ThreadError(this, 'thread priority level must be a valid number');
        }
        if (! Number.isInteger(prioritylevel)) {
            throw new ThreadError(this, 'thread priority level must be an integer number');
        }
        if (prioritylevel < 0) {
            throw new ThreadError(this, 'thread priority level must be a positive number');
        }

        this.prioritylevel = prioritylevel;
        ThreadExecutor.notifyForPriority();
        return this;
    }

    start() {
        this.__generator__ = undefined;
        this.__stepscount__ = 0;
        this.__sleepingpriority__ = false;
        this.__resumingpriority__ = false;
        this.started = true;
        this.paused = false;
        this.stopped = false;
        this.running = true;
        ThreadExecutor.queue.push(this);
        if (! ThreadExecutor.isHandling()) {
            ThreadExecutor.handleThreadQueue();
        }
        return this;
    }

    startAfter(ms) {
        if (! this.paused) this.pause();
        setTimeout(() => this.start(), ms);
        return this;
    }

    interrupt() {
        return this.stop();
    }

    interruptAfter(ms) {
        if (! this.paused) this.pause();
        setTimeout(() => this.interrupt(), ms);
        return this;
    }

    stop() {
        if (! this.started) {
           console.error("Thread not started yet");
           return this;
        }
        if (this.stopped) {
           console.error("Thread already stopped");
           return this;
        }
        this.stopped = true;
        this.running = false;
        const previousIndex = ThreadExecutor.queue.indexOf(this);
        if (previousIndex === -1) {
            throw Error("Cannot stop thread \"" + sleptThread.id + ", the thread is not in the execution queue");
        }
        ThreadExecutor.queue.splice(previousIndex, 1);
        return this;
    }

    stopAfter(ms) {
        setTimeout(() => this.stop(), ms);
        return this;
    }

    pause() {
        if (this.paused) {
           console.error("Thread already paused");
           return;
        }
        this.paused = true;
        return this;
    }

    pauseAfter(ms) {
        setTimeout(() => this.pause(), ms);
        return this;
    }

    resume() {
        if (! this.paused) {
           console.error("Thread is not paused");
           return;
        }
        const previousIndex = ThreadExecutor.queue.indexOf(this);
        if (previousIndex === -1) {
            throw Error("Cannot resume thread \"" + sleptThread.id + ", the thread is not in the execution queue");
        }

        this.paused = false;
        this.__resumingpriority__ = true;

        ThreadExecutor.notifyForResuming(this, previousIndex);
        return this;
    }

    resumeAfter(ms) {
        setTimeout(() => this.resume(), ms);
        return this;
    }

    sleep(ms) {
        Thread.__sleepImpl__(this, ms);
        return this;
    }

    sleepAfter(ms) {
        setTimeout(() => this.sleep(), ms);
        return this;
    }

    catch(exceptionFunc) {
        this.__exceptionFunc__ = exceptionFunc;
        return this;
    }

    static sleep(ms) {
        const sleptThread = ThreadExecutor.currentThread;
        if (sleptThread === undefined || sleptThread === null) {
            throw Error("Thread.sleep called outside a thread environment");
        }
        Thread.__sleepImpl__(sleptThread, ms);
    }

    static __sleepImpl__(sleptThread, ms) {
        if (! sleptThread.started) {
            throw Error("Cannot sleep thread \"" + sleptThread.id + ", the thread is not started yet");
        }
        if (sleptThread.stopped) {
            throw Error("Cannot sleep thread \"" + sleptThread.id + ", the thread is stopped");
        }
        if (! sleptThread.running) {
            throw Error("Cannot sleep thread \"" + sleptThread.id + ", the thread is not running");
        }
        if (sleptThread.paused) {
            throw Error("Cannot sleep thread \"" + sleptThread.id + ", the thread is paused");
        }
        const previousIndex = ThreadExecutor.queue.indexOf(sleptThread);
        if (previousIndex === -1) {
            throw Error("Cannot sleep thread \"" + sleptThread.id + ", the thread is not in the execution queue");
        }
        sleptThread.sleeping = true;
        sleptThread.__sleepingpriority__ = true;
        setTimeout(() => ThreadExecutor.notifyForSleeping(sleptThread, previousIndex), ms);
    }
}

Thread.LOW_PRIORITY_LEVEL = 1;
Thread.MID_PRIORITY_LEVEL = 2;
Thread.HIGH_PRIORITY_LEVEL = 3;

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

        ThreadExecutor.queueIndex = 0;

        ThreadExecutor.handlerLoop(false);
    }

    static handlerLoop(calledFromNotification) {
        if (ThreadExecutor.__timeSpentOutsideThreads__ !== undefined) {
            let now = new Date();
            ThreadExecutor.__timeSpentOutsideThreads__ = now - ThreadExecutor.__timeSpentOutsideThreads__ + 5;
        } else {
            ThreadExecutor.__timeSpentOutsideThreads__ = 20;
        }

        if (! calledFromNotification) if (ThreadExecutor.__isHandling__) {
            return;
        }

        const thread = ThreadExecutor.queue[ThreadExecutor.queueIndex];

        if (thread !== undefined && thread !== null) if ((! thread.sleeping) &&
                (thread.started && !thread.stopped && thread.running && !thread.paused)) {
            ThreadExecutor.__isHandling__ = true;

            ThreadExecutor.currentThread = thread;

            thread.__sleepingpriority__ = false;
            thread.__resumingpriority__ = false;

            if (thread.__generator__ === undefined) {
                thread.__generator__ = thread.__generatorFunc__();
            }
            const result = thread.__generator__.next();
            thread.__stepscount__ = typeof result.value === 'number' ? result.value : thread.__stepscount__;

            if (!(result instanceof Error) && result.done === true) {
                thread.__stepscount__++; // for return step
                ThreadExecutor.queue.splice(ThreadExecutor.queueIndex, 1);
                thread.stopped = true;
                thread.running = false;
                thread.__sleepingpriority__ = false;
                thread.__resumingpriority__ = false;
                if (ThreadExecutor.queueIndex >= ThreadExecutor.queue.length) {
                    ThreadExecutor.queueIndex = 0;
                }
            } else {
                ThreadExecutor.queueIndex++;
                ThreadExecutor.queueIndex = ThreadExecutor.queueIndex % ThreadExecutor.queue.length;
            }

            ThreadExecutor.__isHandling__ = false;
        } else {
            ThreadExecutor.queueIndex++;
            ThreadExecutor.queueIndex = ThreadExecutor.queueIndex % ThreadExecutor.queue.length;
        }

        if (ThreadExecutor.queue.length !== 0) {
            setTimeout(() => ThreadExecutor.handlerLoop(false), (ThreadExecutor.__loopingbeattime__ === undefined || ThreadExecutor.__loopingbeattime__ === -1) ? ThreadExecutor.__timeSpentOutsideThreads__ : ThreadExecutor.__loopingbeattime__);
            ThreadExecutor.__timeSpentOutsideThreads__ = new Date();
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

        sleptThread.sleeping = false;

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

        if (! ThreadExecutor.isLooping()) {
            ThreadExecutor.handleThreadQueue();
        } else {
            ThreadExecutor.handlerLoop(true);
        }
    }

    static notifyForPriority() {
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
    
        if (! ThreadExecutor.isLooping()) {
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

        ex = new ThreadError(ThreadExecutor.currentThread, ex);

        let noExceptionFuncIsSet = false;
        if (ThreadExecutor.__globalExceptionFunc__ !== undefined && ThreadExecutor.__globalExceptionFunc__ !== null) {
            ThreadExecutor.__globalExceptionFunc__(ex, ThreadExecutor.currentThread);
        } else {
            noExceptionFuncIsSet = true;
        }

        if (ThreadExecutor.currentThread !== undefined && ThreadExecutor.currentThread !== null) {
            if (ThreadExecutor.currentThread.__threadgroup__ !== undefined &&
                ThreadExecutor.currentThread.__threadgroup__ !== null) {
                    if (ThreadExecutor.currentThread.__threadgroup__.__exceptionFunc__ !== undefined &&
                        ThreadExecutor.currentThread.__threadgroup__.__exceptionFunc__ !== null) {
                        noExceptionFuncIsSet = false;
                        ThreadExecutor.currentThread.__threadgroup__.__exceptionFunc__(ex, ThreadExecutor.currentThread);
                    }
            }

            if (ThreadExecutor.currentThread.__exceptionFunc__ !== undefined &&
                ThreadExecutor.currentThread.__exceptionFunc__ !== null) {
                noExceptionFuncIsSet = false;
                ThreadExecutor.currentThread.__exceptionFunc__(ex);
            }
            
            if (noExceptionFuncIsSet) {
                console.error(ex);
            }
        }
    }

    static __generatorFunc__(func) {
        let functionSource = `(${func.toString()})`;
        if (functionSource === null) throw Error("Failed to retrieve the function source code");
        if (functionSource.includes("[native code]")) throw Error("Can't execute native function \"" + functionSource + "\", the thread function has to be a normal function, try to wrap the function into a normal function instead...");
        
        // Parse the source into an AST
        const ast = acorn.parse(functionSource, { ecmaVersion: 2020 });

        acorn.walk.full(ast, (node) => {
            // Inject `yield` after each statement in function body or block
            if (
                node.type === 'BlockStatement'
            ) {
                const newBody = [];
                for (let i = 0; i < node.body.length; i++) {
                    const stmt = node.body[i];
                    newBody.push(stmt);
                    if (i < node.body.length - 1 &&
                        stmt.type !== 'ReturnStatement' &&
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
                node.body = newBody;
                return node;
            }
        });

        acorn.walk.simple(ast, {
            FunctionDeclaration(node) {
                node.generator = true;
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node);
            },
            FunctionExpression(node) {
                node.generator = true;
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node);
            },
            ArrowFunctionExpression(node) {
                // Wrap if it's not a block body
                if (node.body.type !== 'BlockStatement') {
                    ThreadExecutor.__wrapArrowFunctionInBlockStatement__(node);
                }

                node.type = 'FunctionExpression';
                node.generator = true;
                node.expression = false;
                
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node);
            }
        });

        // Generate code
        let newCode = escodegen.generate(ast);

        // Eval into an actual generator function
        let generatorFunc = eval(newCode);
        return generatorFunc;
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

    static __wrapFunctionBodyInTryCatch__(node) {
        const originalBody = node.body.body;

        node.body.body = [
            {
                type: "TryStatement",
                block: {
                    type: "BlockStatement",
                    body: [
                        {
                            type: 'VariableDeclaration',
                            declarations: [
                            {
                                type: 'VariableDeclarator',
                                id: { type: 'Identifier', name: '__thefunctionstepscount__' },
                                init: { type: 'Literal', value: 0 }
                            }
                            ],
                                kind: 'let'
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
}

ThreadExecutor.ADAPTIVE = -1;

class ThreadGroup {
    constructor(...threads) {
        if (ThreadGroup.count === undefined) {
            ThreadGroup.count = 0;
        }
        ThreadGroup.count++;
        this.id = 'anonymous threadgroup n-' + ThreadGroup.count;
    
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
    }

    setId(id) {
        this.id = (id === undefined || id === null) ? ('anonymous threadgroup n-' + ThreadGroup.count) : (id + ' (threadgroup n-' + ThreadGroup.count + ')');
        return this;
    }

    add(thread) {
        if (thread === undefined || thread === null) {
            throw new ThreadError(this, "Given thread in threadgroup add function is undefined or null");
        }

        this.threads.push(thread);
        thread.__threadgroup__ = this;
        return this;
    }

    remove(thread) {
        if (thread === undefined || thread === null) {
            return;
        }

        const previousIndex = this.threads.indexOf(thread);
        if (previousIndex === -1) {
            throw new ThreadError("Cannot remove thread \"" + thread.id + " from threadgroup, the thread is not added to that threadgroup");
        }

        this.threads.splice(previousIndex, 1);
        thread.__threadgroup__ = undefined;
        return this;
    }

    stepsCount() {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
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
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.start();
            }
        }
        return this;
    }

    startAfter(ms) {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        this.pause();
        setTimeout(() => this.start(), ms);
        return this;
    }

    interrupt() {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        return this.stop();
    }

    interruptAfter(ms) {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        setTimeout(() => this.interrupt(), ms);
        return this;
    }

    stop() {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.stop();
            }
        }
        return this;
    }

    stopAfter(ms) {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        setTimeout(() => this.stop(), ms);
        return this;
    }

    pause() {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }
        
        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                if (! thread.paused) thread.pause();
            }
        }
        return this;
    }

    pauseAfter(ms) {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        setTimeout(() => this.pause(), ms);
        return this;
    }

    resume() {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.resume();
            }
        }
        return this;
    }

    resumeAfter(ms) {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        setTimeout(() => this.resume(), ms);
        return this;
    }

    sleep(ms) {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }

        for (const thread of this.threads) {
            if (thread !== undefined && thread !== null) {
                thread.sleep(ms);
            }
        }
        return this;
    }

    sleepAfter(ms) {
        if (this.threads.length == 0) {
            throw new ThreadError(this, "threadgroup has no threads");
        }
        
        setTimeout(() => this.sleep(), ms);
        return this;
    }

    catch(exceptionFunc) {
        this.__exceptionFunc__ = exceptionFunc;
        return this;
    }
}

class ThreadError extends Error {
    constructor(thread, message) {
        super((thread instanceof Thread ? "error in thread " : "error in threadgroup ") + "\"" + thread.id + "\"" + ", details : " + message, message);
    }
}
