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

/* Version 1.0.1 */

export class ThreadedTools {
}
ThreadedTools.acorn = {parse: () => {}}
ThreadedTools.walk = {full: () => {}, simple: () => {}}
ThreadedTools.escodegen = {generate: () => {}}

export class Thread {
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
        this.__errorSilently__ = false;
        this.done = false;
        this.started = false;
        this.running = false;
        this.stopped = false;
        this.paused = false;
    }

    static innerThreadFor(outerThread, func, prioritylevel, id) {
        if (Thread.__sharedinnerthreads__ === undefined) {
            Thread.__sharedinnerthreads__ = new Map();
        }

        if (! Thread.__sharedinnerthreads__.has(outerThread)) {
            Thread.__sharedinnerthreads__.set(outerThread, new Map());
        }
        if (! Thread.__sharedinnerthreads__.get(outerThread).has(func)) {
            Thread.__sharedinnerthreads__.get(outerThread).set(func, new Thread(func, prioritylevel, id));
        }

        let thread = Thread.__sharedinnerthreads__.get(outerThread).get(func);

        if (prioritylevel !== undefined) {
            thread.setPriorityLevel(prioritylevel);
        }
        if (id !== undefined) {
            thread.setId(id);
        }

        return thread;
    }

    setId(id) {
        this.id = (id === undefined || id === null) ? ('anonymous thread n-' + Thread.count) : (id + ' (thread n-' + Thread.count + ')');
        return this;
    }

    setArgs(...args) {
        this.__args__ = args;
        return this;
    }

    errorSilently(flag) {
        if (flag === undefined || flag === null) {
            this.__errorSilently__ = false;
        }

        this.__errorSilently__ = flag;
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
        this.__generator__ = undefined;
        this.__stepscount__ = 0;
        this.__sleepingpriority__ = false;
        this.__resumingpriority__ = false;
        this.__result__ = null;
        this.done = false;
        this.started = true;
        this.paused = false;
        this.stopped = false;
        this.running = true;
        ThreadExecutor.__timeSpentOutsideThreads__ = undefined;
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

    static interrupt() {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.interrupt called outside a thread environment");
        }

        currentThread.interrupt();
    }

    interruptAfter(ms) {
        if (! this.paused) this.pause();
        setTimeout(() => this.interrupt(), ms);
        return this;
    }

    static interruptAfter(ms) {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.interruptAfter called outside a thread environment");
        }

        currentThread.interruptAfter(ms);
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
            throw new ThreadError("Cannot stop thread \"" + sleptThread.id + ", the thread is not in the execution queue");
        }
        ThreadExecutor.queue.splice(previousIndex, 1);
        return this;
    }

    static stop() {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.stop called outside a thread environment");
        }

        currentThread.stop();
    }

    stopAfter(ms) {
        setTimeout(() => this.stop(), ms);
        return this;
    }

    static stopAfter(ms) {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.stopAfter called outside a thread environment");
        }

        currentThread.stopAfter(ms);
    }

    pause() {
        if (this.paused) {
           console.error("Thread already paused");
           return;
        }
        this.paused = true;
        return this;
    }

    static pause() {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.pause called outside a thread environment");
        }

        currentThread.pause();
    }

    pauseAfter(ms) {
        setTimeout(() => this.pause(), ms);
        return this;
    }

    static pauseAfter(ms) {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.pauseAfter called outside a thread environment");
        }

        currentThread.pauseAfter(ms);
    }

    resume() {
        if (! this.paused) {
           console.error("Thread is not paused");
           return;
        }
        const previousIndex = ThreadExecutor.queue.indexOf(this);
        if (previousIndex === -1) {
            throw new ThreadError("Cannot resume thread \"" + sleptThread.id + ", the thread is not in the execution queue");
        }

        this.paused = false;
        this.__resumingpriority__ = true;

        ThreadExecutor.notifyForResuming(this, previousIndex);
        return this;
    }

    static resume() {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.resume called outside a thread environment");
        }

        currentThread.resume();
    }

    resumeAfter(ms) {
        setTimeout(() => this.resume(), ms);
        return this;
    }

    static resumeAfter(ms) {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.resumeAfter called outside a thread environment");
        }

        currentThread.resumeAfter(ms);
    }

    sleep(ms) {
        if (! this.started) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is not started yet");
        }
        if (this.stopped) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is stopped");
        }
        if (! this.running) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is not running");
        }
        if (this.paused) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is paused");
        }
        const previousIndex = ThreadExecutor.queue.indexOf(this);
        if (previousIndex === -1) {
            throw new ThreadError("Cannot sleep thread \"" + this.id + ", the thread is not in the execution queue");
        }
        this.sleeping = true;
        this.__sleepingpriority__ = true;
        setTimeout(() => ThreadExecutor.notifyForSleeping(this, previousIndex), ms);
        return this;
    }

    static sleep(ms) {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.sleep called outside a thread environment");
        }

        currentThread.sleep(ms);
    }

    sleepAfter(ms) {
        setTimeout(() => this.sleep(), ms);
        return this;
    }

    static sleepAfter(ms) {
        const currentThread = ThreadExecutor.currentThread;
        if (currentThread === undefined || currentThread === null) {
            throw new ThreadError("Thread.sleepAfter called outside a thread environment");
        }

        currentThread.sleepAfter(ms);
    }

    catch(exceptionFunc) {
        this.__exceptionFunc__ = exceptionFunc;
        return this;
    }

    result() {
        return this.__result__;
    }
}

Thread.LOW_PRIORITY_LEVEL = 1;
Thread.MID_PRIORITY_LEVEL = 2;
Thread.HIGH_PRIORITY_LEVEL = 3;

Thread.innerfunctionsisolation = false;

export class ThreadExecutor {
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

        const thread = ThreadExecutor.queue[ThreadExecutor.queueIndex];

        if (thread !== undefined && thread !== null) if ((! thread.sleeping) &&
                (thread.started && !thread.stopped && thread.running && !thread.paused)) {
            ThreadExecutor.__isHandling__ = true;

            ThreadExecutor.currentThread = thread;

            thread.__sleepingpriority__ = false;
            thread.__resumingpriority__ = false;

            if (thread.__generator__ === undefined) {
                thread.__generator__ = thread.__generatorFunc__(...thread.__args__);
            }
            const result = thread.__generator__.next();
            thread.__stepscount__ = typeof result.value === 'number' ? result.value : thread.__stepscount__;

            if (!(result instanceof Error) && result.done === true) {
                ThreadExecutor.queue.splice(ThreadExecutor.queueIndex, 1);
                thread.__result__ = result.value;
                thread.done = true;
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
            setTimeout(() => ThreadExecutor.handlerLoop(false), (ThreadExecutor.__loopingbeattime__ === undefined || ThreadExecutor.__loopingbeattime__ === ThreadExecutor.ADAPTIVE) ? ThreadExecutor.__timeSpentOutsideThreads__ : ThreadExecutor.__loopingbeattime__);
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

        sleptThread.sleeping = false;

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
    
        ThreadExecutor.__timeSpentOutsideThreads__ = undefined;

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

        ex = new ThreadError(ex, ThreadExecutor.currentThread);

        let noExceptionFuncIsSet = false;
        if (ThreadExecutor.__globalExceptionFunc__ !== undefined && ThreadExecutor.__globalExceptionFunc__ !== null) {
            if (! ThreadExecutor.currentThread.__errorSilently__) {
                ThreadExecutor.__globalExceptionFunc__(ex, ThreadExecutor.currentThread);
            }
        } else {
            noExceptionFuncIsSet = true;
        }

        if (ThreadExecutor.currentThread !== undefined && ThreadExecutor.currentThread !== null) {
            if (ThreadExecutor.currentThread.__threadgroup__ !== undefined &&
                ThreadExecutor.currentThread.__threadgroup__ !== null) {
                    if (ThreadExecutor.currentThread.__threadgroup__.__exceptionFunc__ !== undefined &&
                        ThreadExecutor.currentThread.__threadgroup__.__exceptionFunc__ !== null) {
                        noExceptionFuncIsSet = false;
                        if (! ThreadExecutor.currentThread.__errorSilently__) {
                            ThreadExecutor.currentThread.__threadgroup__.__exceptionFunc__(ex, ThreadExecutor.currentThread);
                        }
                    }
            }

            if (ThreadExecutor.currentThread.__exceptionFunc__ !== undefined &&
                ThreadExecutor.currentThread.__exceptionFunc__ !== null) {
                noExceptionFuncIsSet = false;
                ThreadExecutor.currentThread.__exceptionFunc__(ex);
            }
            
            if (noExceptionFuncIsSet) {
                if (! ThreadExecutor.currentThread.__errorSilently__) {
                    console.error(ex);
                }
            }
        }
    }

    static __generatorFunc__(func) {
        let functionSource = `(${func.toString()})`;
        if (functionSource === null) throw new ThreadError("Failed to retrieve the function source code");
        if (ThreadExecutor.__isNativeFunction__(func)) throw new ThreadError("Can't execute native function \"" + functionSource + "\", the thread function has to be a normal function, try to wrap the function into a normal function instead...");
        
        // Parse the source into an AST
        const ast = ThreadedTools.acorn.parse(functionSource, { ecmaVersion: 2024 });

        let alreadyAGeneratorFunction = typeof func === 'function' &&
                                        func.constructor &&
                                        func.constructor.name === 'GeneratorFunction';

        if (! alreadyAGeneratorFunction) ThreadedTools.walk.full(ast, (node) => {
            // Inject `yield` after each statement in function body or block
            let functionId = 0;
            if (
                node.type === 'BlockStatement'
            ) {
                const newBody = [];
                for (let i = 0; i < node.body.length; i++) {
                    const stmt = node.body[i];

                    if (Thread.innerfunctionsisolation === true &&
                        (stmt.type === 'VariableDeclaration' ||
                        stmt.type === 'ExpressionStatement')) {
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
                            isNativeOrThreadFunction = ThreadExecutor.__isNativeOrThreadFunction__(eval('(' + escodegen.generate(callExpr) + ')'.replaceAll('this', 'Thread')));     
                            dontIsolateToThread = true;
                        } else {
                            functionCallee = callExpr.callee;
                            if (functionCallee !== undefined && functionCallee !== null) try {
                                isNativeOrThreadFunction = ThreadExecutor.__isNativeOrThreadFunction__(eval(escodegen.generate(functionCallee).replaceAll('this', 'Thread')));
                            } catch(ex) {
                                if (!(ex instanceof ReferenceError)) {
                                    throw ex;
                                }
                            }
                            dontIsolateToThread = callExpr.type !== 'CallExpression';
                        }

                        if (isNativeOrThreadFunction || dontIsolateToThread) {
                            newBody.push(stmt);
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

                            continue;
                        }

                        if (! dontIsolateToThread) {
                            const threadVar = `__innerfunctionexecutor${++functionId}__`;
                            const tempVarName = `__innerfunctionexecutionresult${functionId}__`;
                            newBody.push(
                               // const __innerfunctionexecutorN__ = new Thread(FUNCTIONAME).setArgs(...args).setId(this.id + ''s inner thread').errorSilently(true).start();
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
                                                                                { type: 'ThisExpression' },
                                                                                functionCallee]
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
                                                                                object: { type: 'ThisExpression' },
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
                                                        property: { type: 'Identifier', name: 'errorSilently' },
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
                                // while (__innerfunctionexecutorN__.running) { yield __thefunctionstepscount__; }
                                {
                                    type: 'WhileStatement',
                                    test: {
                                        type: 'MemberExpression',
                                        object: { type: 'Identifier', name: threadVar },
                                        property: { type: 'Identifier', name: 'running' }
                                    },
                                    body: {
                                        type: 'BlockStatement',
                                        body: [{
                                            type: 'ExpressionStatement',
                                            expression: {
                                                type: 'YieldExpression',
                                                argument: {
                                                    type: 'Identifier',
                                                    name: '__thefunctionstepscount__'
                                                }
                                            }
                                        }]
                                    }
                                },
                                // let ORIGINALVARNAME = __innerfunctionexecutorN__.result();
                                // Or ; for non retuning function
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
                                // yield __thefunctionstepscount__++;
                                {
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
                        newBody.push(stmt);
                        if (stmt.type !== 'ReturnStatement' &&
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
                node.body = newBody;
                return node;
            }
        });

        ThreadedTools.walk.simple(ast, {
            FunctionDeclaration(node) {
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node, ! node.generator);
                node.generator = true;
            },
            FunctionExpression(node) {
                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node, ! node.generator);
                node.generator = true;
            },
            ArrowFunctionExpression(node) {
                // Wrap if it's not a block body
                if (node.body.type !== 'BlockStatement') {
                    ThreadExecutor.__wrapArrowFunctionInBlockStatement__(node);
                }

                ThreadExecutor.__wrapFunctionBodyInTryCatch__(node, ! node.generator);
                node.type = 'FunctionExpression';
                node.generator = true;
                node.expression = false;
            }
        });

        // Generate code
        let newCode = ThreadedTools.escodegen.generate(ast);

        // Eval into an actual generator function
        let generatorFunc = eval(newCode);
        return generatorFunc;
    }

    static __isNativeFunction__(fn) {
        if (fn === undefined) return false;
        return typeof fn === 'function' && /\{\s*\[native code\]\s*\}/.test(fn.toString());
    }

    static __isNativeOrThreadFunction__(fn) {
        if (fn === undefined) return false;
        return ThreadExecutor.__isNativeFunction__(fn) || Thread.prototype.hasOwnProperty(fn.name);
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

    static __wrapFunctionBodyInTryCatch__(node, addfunctionstepscountvar) {
        const originalBody = node.body.body;

        node.body.body = [
            {
                type: "TryStatement",
                block: {
                    type: "BlockStatement",
                    body: [
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
}

ThreadExecutor.ADAPTIVE = -1;

export class ThreadGroup {
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
            throw new ThreadError("Given thread in threadgroup add function is undefined or null", this);
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
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
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
            throw new ThreadError("threadgroup has no threads", this);
        }

        this.pause();
        setTimeout(() => this.start(), ms);
        return this;
    }

    interrupt() {
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        return this.stop();
    }

    interruptAfter(ms) {
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
        }

        setTimeout(() => this.interrupt(), ms);
        return this;
    }

    stop() {
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
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
            throw new ThreadError("threadgroup has no threads", this);
        }

        setTimeout(() => this.stop(), ms);
        return this;
    }

    pause() {
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
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
            throw new ThreadError("threadgroup has no threads", this);
        }

        setTimeout(() => this.pause(), ms);
        return this;
    }

    resume() {
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
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
            throw new ThreadError("threadgroup has no threads", this);
        }

        setTimeout(() => this.resume(), ms);
        return this;
    }

    sleep(ms) {
        if (this.threads.length == 0) {
            throw new ThreadError("threadgroup has no threads", this);
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
            throw new ThreadError("threadgroup has no threads", this);
        }
        
        setTimeout(() => this.sleep(), ms);
        return this;
    }

    catch(exceptionFunc) {
        this.__exceptionFunc__ = exceptionFunc;
        return this;
    }
}

export class ThreadError extends Error {
    constructor(message, thread) {
        super((thread instanceof Thread ? "error in thread " : "error in threadgroup ") + "\"" + thread.id + "\"" + ", details : " + message, message instanceof Error ? message : undefined);
    }
}

// For node.js compatibility
try {
    module.exports = { Thread, ThreadGroup, ThreadExecutor, ThreadError };
} catch (ex) {
    // Ignored...
}