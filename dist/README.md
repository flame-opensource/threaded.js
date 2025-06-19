# threaded.js

**JavaScript with Threads !**


## Official Repository
[threaded.js Repository](https://github.com/flame-opensource/threaded.js)

## Official Website
[threaded.js Website](https://flame-opensource.github.io/threaded.js)

## Official NPM packages
- [threaded.js main NPM package](https://www.npmjs.com/package/threaded.js)
- [threaded.js minified NPM package](https://www.npmjs.com/package/threaded.min.js)
- [threaded.node.compat.js main NPM package](https://www.npmjs.com/package/threaded.node.compat.js)
- [threaded.node.compat.js minified NPM package](https://www.npmjs.com/package/threaded.node.compat.min.js)
- [threaded.esm.compat.js main NPM package](https://www.npmjs.com/package/threaded.esm.compat.js)
- [threaded.esm.compat.js minified NPM package](https://www.npmjs.com/package/threaded.node.compat.min.js)

---

## Table of Content
- [Official Repository](#official-repository)
- [Official Website](#official-website)
- [Official NPM packages](#official-npm-packages)
- [Introduction](#introduction)
- [Core Concept](#core-concept)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
  - [Thread](#thread)
  - [ThreadGroup](#threadgroup)
  - [ThreadTask](#threadtask)
  - [IsolatedThread](#isolatedthread)
  - [ThreadExecutor](#threadexecutor)
  - [Thread Priorities](#thread-priorities)
- [Architecture](#architecture)
- [Thread joining](#thread-joining)
- [Inner Function Isolation](#inner-function-isolation)
- [Thread level errors isolation](#thread-level-errors-isolation)
- [Custom Generator Functions](#custom-generator-functions)
- [Support this project](#support-this-project)
- [Contributing](#contributing)
- [License](#license)

---

## Introduction
threaded.js is a cooperative threading framework for JavaScript that simulates concurrency using generator functions. It allows developers to pause, resume, sleep, and prioritize functions as if they were true threads — all while staying in JavaScript’s single-threaded event loop.

## Core Concept
JS's Single-threaded environment with cooperative execution.
### How ?
Cooperative Multitasking using generator functions : Threads yield control voluntarily after each executed step, creating the illusion of multitasking.

## Features
* Cooperative execution model (yield-based)
* AST Transformation: Normal functions are transformed into generator functions at runtime using acorn, acorn-walk, and escodegen.
* Full control over threads: `start`, `stop`, `pause`, `resume`, `sleep`
* Delayed operations: `startAfter`, `pauseAfter`, etc.
* Adaptive or fixed beat loop (`ThreadExecutor.setBeatTime(ms)`)
* Thread prioritization: LOW, MID, HIGH, or custom
* Thread recycling: restart any thread at any time even if its running, and change its function at any time using `setFunction(func)` method
* Function argument passing (`setArgs(...)`)
* Nesting threads within other threads
* Thread and group identifiers for easier debugging
* Fine-grained error handling at thread, group, or global level
* Execution progress tracking via `stepsCount()` (not for custom generator functions)
* Thread & ThreadGroup joining via `Thread.join([timeout])` & `ThreadGroup.join([timeout])` methods
* Simple tasks chaining & branching via `ThreadTask` class
* True threads & true parallelism via `IsolatedThread` class
* Inner-function isolation toggle (`Thread.innerfunctionsisolation` global flag or `thread.isolateInnerFunctions(flag)` if you want that setting to be thread specific)
* Thread error isolation via `isolateErrors(flag)`
* Thread Groups: Manage multiple threads together for batch operations.
* Thread Executor: Global scheduler with beat-time-based loop and adaptive execution.

## Installation
### Browser :
Add the following scripts to your html :
```html
<script src="https://cdn.jsdelivr.net/npm/acorn@latest/dist/acorn.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/acorn-walk@latest/dist/walk.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/escodegen-browser@latest/escodegen.browser.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/threaded.js@latest/dist/std/threaded.std.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/threaded.js@latest/dist/browser_compat/threaded.browser.compat.min.js"></script>
```
### Node.js
Install the following npm packages into your project :
```
npm install acorn acorn-walk escodegen threaded.min.js threaded.node.compat.min.js
```
Then import threaded.js library into your project :
```js
const { 
  Thread,
  ThreadGroup,
  ThreadTask,
  ThreadExecutor,
  IsolatedThread,
  ThreadError,
  ThreadedTools
} = require('threaded.min.js');
const {
  ThreadedNodeCompat
} = require('threaded.node.compat.min.js');
ThreadedNodeCompat.defaultSettings(ThreadedTools);
...
```
### ESM / Deno
Import threaded.js library into your project :
```js
import {
  Thread,
  ThreadExecutor,
  ThreadGroup,
  IsolatedThread,
  ThreadTask,
  ThreadError,
  ThreadedTools
} from 'https://cdn.jsdelivr.net/npm/threaded.js@latest/dist/threaded.module.min.js';
import {
  ThreadedEsmCompat
} from 'https://cdn.jsdelivr.net/npm/threaded.js@latest/dist/esm_compat/threaded.esm.compat.min.js';
ThreadedEsmCompat.defaultSettings(ThreadedTools);
...
```

## Quick Start
```js
const t = new Thread(function (name) {
  console.log(`Hello ${name}, step 1`);
  Thread.sleep(1000);
  console.log("Step 2 complete");
}).setArgs("Hamza").start();
```

## Usage Examples
### 1. Simple Thread with an argument and execution result
```js
const thread = new Thread(function(name) {
  console.log(`Starting work for ${name}`);
  Thread.sleep(1000); // Pause for 1 second
  console.log("Middle step");
  Thread.sleep(500);
  return `Done processing ${name}`;
}).setArgs("Hamza").start();

// Later check the result
setTimeout(() => {
  if (thread.isdone()) console.log(thread.result()); // "Done processing Hamza"
}, 2000);
```
### 2. Thread with custom priority
```js
const thread = new Thread(function() {
  while (true) {
      Thread.sleep(1000); // Pause for 1 second
      console.log("Beat");
  }
}, Thread.MID_PRIORITY_LEVEL)
/*.setPriorityLevel(Thread.HIGH_PRIORITY_LEVEL)*/ // If you want to change it later...
/*.setPriorityLevel(10)*/ // Or a custom one...
.start();
```
### 3. Thread Group Management
```js
const t1 = new Thread(() => {
  for (let i = 0; i < 3; i++) {
    console.log("Thread 1 step", i);
    Thread.sleep(300);
  }
}, Thread.HIGH_PRIORITY_LEVEL);

const t2 = new Thread(() => {
  for (let i = 0; i < 3; i++) {
    console.log("Thread 2 step", i);
    Thread.sleep(500);
  }
});

const group = new ThreadGroup(t1, t2)
  .catch((err, thread) => {
    console.error(`Error in ${thread.id}:`, err);
  })
  .start();

// Pause entire group after 1 second
group.pauseAfter(1000);
```
### 4. Error Handling
```js
const riskyThread = new Thread(function() {
  if (Math.random() > 0.5) throw new Error("Random failure!");
  return "Success";
})
.catch(err => {
  console.log("Thread failed:", err.message);
})
/*.isolateErrors(true)*/ // If you don't want the thread errors to bubble up to group or global level
.start();

// Global error handler
ThreadExecutor.catch((err, thread) => {
  console.log(`Global handler caught error from ${thread.id}`);
});
```
## 5. Inner blocking functions isolation
```js
const nonBlockingThread = new Thread(function() {
  heavyBlockingTask();
  return "Done";
})
.isolateInnerFunctions(true) // Will run inner functions (heavyBlockingTask) into their own inner threads to avoid blocking...
.start();
```
## 6. Threads joining
```js
const t1 = new Thread(() => {
  for (let i = 0; i < 3; i++) {
    console.log("Thread 1 step", i);
    Thread.sleep(300);
  }
});

const t2 = new Thread(() => {
  t1.join(); // Waits until t1 finishes execution...
  for (let i = 0; i < 3; i++) {
    console.log("Thread 2 step", i);
    Thread.sleep(500);
  }
});

const t3 = new Thread(() => {
  t2.join(3000); // Waits until t2 finishes execution with timeout...
  // If 3000 ms passes and t2 still executing continue...
  ...
});

const t4 = new Thread(() => {
  new ThreadGroup(t1, t2, t3).join(10000); // Waits until the threadgroup finishes execution with timeout...
  // If 10000 ms passes and the threadgroup still executing continue...
  ...
});

t1.start();
t2.start();
t3.start();
t4.startAfter(5000);
...
```

## Custom Priority Examples
### 1. Default priorities
```js
const prioritizedthread = new Thread(function() {
  Thread.sleep(1000); // Pause for 1 second
  console.log("Beat");
}/*, Thread.LOW_PRIORITY_LEVEL*/) // low priority set by default...
.start();

prioritizedthread.setPriorityLevel(Thread.MID_PRIORITY_LEVEL) // A better responsiveness rate...
// Later...
prioritizedthread.setPriorityLevel(Thread.HIGH_PRIORITY_LEVEL) // The default high priority level = 3, but it can be higher...
```
### 2. Custom Priority Tier System
```js
// Define custom priority levels
const PRIORITY = {
  BACKGROUND: 1,    // Lowest (default)
  NORMAL: 3,        // Between MID and HIGH 
  INTERACTIVE: 5,   // Higher than HIGH
  CRITICAL: 10      // Emergency level
};

// Create threads with custom priorities
const bgTask = new Thread(() => {
  console.log("Background analytics");
  Thread.sleep(2000);
}, PRIORITY.BACKGROUND);

const uiTask = new Thread(() => {
  console.log("UI animation frame");
}, PRIORITY.INTERACTIVE);

const paymentTask = new Thread(() => {
  console.log("Processing payment");
}, PRIORITY.CRITICAL);

// Start all
new ThreadGroup(bgTask, uiTask, paymentTask).start();
```
### 3. Dynamic Priority Adjustment
```js
const adaptiveThread = new Thread(function () {
  this.setPriorityLevel(1);
  
  while (true) {
    // Boost priority when important work arrives
    if (hasUrgentWork()) {
      this.setPriorityLevel(5); // Dynamic change
      processUrgentWork();
      this.setPriorityLevel(1); // Reset
    }
    
    doBackgroundWork();
  }
}).start();
```
### 4. Priority-Based Throttling
```js
ThreadExecutor.catch((err, thread) => {
  // Downgrade crashing threads
  if (err instanceof CriticalError) {
    thread.setPriorityLevel(Math.max(1, thread.priority - 2));
    thread.start(); // Restart with lower priority
  }
});

const sensitiveTask = new Thread(handleFinancials, 9)
  .start();
```
## Advanced Generator Function Usage
### 1. Manual Yield Control
```js
const preciseThread = new Thread(function* () {
  console.log("Step 1");
  yield; // Explicit yield point
  
  for (let i = 0; i < 3; i++) {
    console.log(`Iteration ${i}`);
    yield; // Yield after each iteration
  }

  // Making the outer function generator won't nesseccary makes the inner ones
  // generator too...
  function someGeneratorOperation() {
    ...
  }
  
  const result = someGeneratorOperation();
  console.log("result:", result);
})
/*.isolateInnerFunctions(true)*/ // To make someGeneratorOperation steppable
// Or you can make it generator too... [function* someGeneratorOperation()...]
// If you want to have control over yielding...
.start();
```
### 2. Custom Generator Function with Thread Recycling
```js
function* worker() {
  while (true) {
    const job = getNextJob();
    processJob(job);
    validateJob(job);
    yield; // Yield only after the 3 above tasks are all done
  }
}

const recyclable = new Thread(worker)
  .catch((ex) => {
    console.log("Worker crashed - restarting");
    this.start(); // Re-start on error
  })
  /*.isolateInnerFunctions(true)*/
  .start();
```
## More & more usage examples
### 1. Thread Recycling
```js
// Will crash indefinitely...
function worker() {
  throw Error("an error");
}

const recyclable = new Thread(worker)
  .catch(() => {
    console.log("Thread crashed - restarting");
    this.start(); // Re-start on error
  })
  .start();
```
### 2. Custom ThreadExecutor Beat Time
```js
ThreadExecutor.setBeatTime(16);

new Thread(function() {
  // With Thread.innerfunctionsisolation = true or thread.isolateInnerFunctions(true), this won't block
  function heavyCalculation() {
    let total = 0;
    for (let i = 0; i < 1000000; i++) {
      total += Math.sqrt(i);
    }
    return total;
  }
  
  const result = heavyCalculation();
  console.log("Result:", result);
})
/*.isolateInnerFunctions(true)*/
.start();
```
### 3. Custom Yield Patterns
```js
function* customYieldPattern() {
  console.log("Start");
  
  // Yield every 3 steps
  for (let i = 0; i < 9; i++) {
    if (i % 3 === 0) yield;
    console.log("Processing item", i);
  }
  
  console.log("Done");
}

new Thread(customYieldPattern).start();
```
### 4. Thread controls outside thread context
```js
function anOutsiderFunction() {
  // Since this function is executed inside the thread
  // Thread controls can be called here safely
  // Using static methods
  Thread.sleep(1000); // You can sleep...
  Thread.sleepAfter(1000, 1000); // You can sleep after a delay...
  Thread.resumeAfter(1000); // You can resume after a delay...
  Thread.pause(); // You can pause...
  // and so on...
}

new Thread(anOutsiderFunction).start();
new Thread(anOutsiderFunction).start();
...
```
### 5. Thread.this
```js
function anOutsiderFunction() {
  // Since this function is executed inside the thread
  // Thread can be accessed here safely
  // Using the Thread.this keyword...
  Thread.this.sleep(1000); // You can sleep...
  console.log(Thread.this.id);
}

new Thread(anOutsiderFunction).start();
...
```
## 6. ThreadTask
You have multiple tasks and you don't want to create multiple Thread objects everytime ?
Using `ThreadTask` you can run your tasks chained or atonce fast just by typing run(...).then(...)...
```js
ThreadTask.run(() => console.log("step 1")) // indicates new task creation, first task
    .then(() => console.log("step 2")) // Next task
    .then(() => console.log("step 3")) // Next task
    .then(() => console.log("step 4")) // Next task
    .then(() => console.log("step 5")) // Next task
    .then(() => console.log("step 6")) // Next task
    .setId("the tasks") // General id
    .atonce() // a task fork, run them at once
    .setId("my tasks") // Branch id
    .startAfter(3000, reverse = false, delayBetween = 1000) // Delayed startup & delay between each task
    .chained() // another task fork, same previous tasks..., run them one after the other
    .setId("my tasks 2") // Branch id
    .start(reverse = true, delayBetween = 1500) // Starts immediately from the last task to the first one (reversed) & delay between each task
    .run(() => console.log("step 7")) // indicates new task creation, first task
    .then(() => console.log("step 8")) // Next task
    .then(() => console.log("step 9")) // Next task
    .atonce() // a task fork, run them at once
    .isolated() // isolated threads, using IsolatedThread class...
    .start(false, 1000); // Delay between each task
```
## 7. IsolatedThread
Leveraging WebWorkers across multiple JS environments & dynamic creation, IsolatedThread can run tasks on their own REAL threads, achieving true parallelism and execution efficiency...
```js
// Just like a normal thread...
// And threaded.js takes care of everything...
const it = new IsolatedThread((arg) => {
  console.log("True parallelism in " + arg)
}).setArgs('JavaScript').start();

new Thread(() => {
  it.join(); // Normal threads can join IsolatedThreads...
  ...
}).start();
```
#### NOTE: IsolatedThread runs in a seperate WebWorker means a seperate environment, that's why it's called "isolated".
##### That means :
```js
const it = new IsolatedThread(() => {
  // it.pause(); // Nope, it is an event loop variable can't be accessed here
  IsolatedThread.this.pause(); // This is permissible
}).start();
```

## API Reference

### Thread

#### Constructor
```js
new Thread(function[, priority, id])
```
- Accepts either a normal function (converted to generator) or a generator function.
- `priority`: Optional. Numerical or predefined constant.
- `id`: Optional. String for debugging purposes.

#### Control Methods
- `start()` — Begins thread execution.
- `stop()` — Terminates execution and resets thread state.
- `pause()` — Temporarily halts execution.
- `resume()` — Resumes from paused state.
- `sleep(ms)` — Puts the thread into sleep state for temporarily amount of time.
- `join([ms])` — Blocks the calling thread until the called thread finishes executing (with timeout).

#### Delayed Methods
- `startAfter(delay)` — Starts the thread after a delay.
- `pauseAfter(delay)` — Pauses the thread after a delay.
- `resumeAfter(delay)` — Resumes the thread after a delay.
- `stopAfter(delay)` — Stops the thread after a delay.
- `sleepAfter(delay, ms)` — Puts the thread into sleep state for temporarily amount of time after a delay.

#### Configuration
- `Thread.innerfuntionsisolation` — Isolates the functions that are running inside the threads (that can be blocking) into sub-threads or inner threads for a non-blocking execution.
- `setArgs(...args)` — Supplies arguments to be passed into the thread function.
- `result()` — Returns the final value returned by the thread function (once the thread has completed). This is especially useful for retrieving computation outcomes, intermediate results, or passing data back from inner threads. If the thread function throws an error, `result()` will return an instance of `Error`.
- `setId(id)` — Assigns a custom ID to the thread.
- `isolateErrors(flag)` — Prevents thread-specific errors from propagation to group/global if true.
- `isolateInnerFunctions(flag)` — Same as `Thread.innerfuntionsisolation` but thread specific, automatically restarts the thread if started.
- `setFunction(func)` — Change the thread's function at any given time, automatically restarts the thread if started.

#### Observability
- `stepsCount()` — Number of yield steps executed so far.
- `isstarted()` — Whether the thread was started.
- `ispaused()` — Whether it is currently paused.
- `isstopped()` — Whether the thread was stopped.
- `isrunning()` — Whether it is currently active.
- `issleeping()` — Whether it is currently sleeping.
- `isdone()` — Whether the thread done executing.
- `onfinish(finishFunc)` — Assign a finish event handler to the thread.
- `onyield(yieldFunc)` — Assign a yield event handler to the thread.
- `Thread.count()` — Returns total count of all threads created so far.

#### Error Handling
- `catch(fn)` — Assign a thread-local error handler.

---

### ThreadGroup

#### Constructor
```js
new ThreadGroup(...threads)
```
- Accepts multiple `Thread` instances.

#### Control Methods
- `start()` / `pause()` / `resume()` / `stop()` — Controls all threads in the group simultaneously.
- `join([ms])` — Blocks the calling thread until the called threadgroup finishes executing (with timeout).

#### Modifiers
- `add(thread)` — Adds a thread to the group.
- `remove(thread)` — Removes a thread from the group.

#### Error Handling
- `catch((ex, thread) => {})` — Group-level error handler for any member thread.

#### Debugging
- `setId(id)` — Optional identifier for tracking.

#### Observability
- `length()` — Returns the size of the group (how much threads it owns).
- `isstarted()` — Whether the thread was started.
- `ispaused()` — Whether it is currently paused.
- `isstopped()` — Whether the thread was stopped.
- `isrunning()` — Whether it is currently active.
- `issleeping()` — Whether it is currently sleeping.
- `isdone()` — Whether the thread done executing.
- `onfinish(finishFunc)` — Assign a finish event handler to the threadgroup.
- `onyield(yieldFunc)` — Assign a yield event handler to the threadgroup.
- `ThreadGroup.count()` — Returns total count of all groups created so far.

---

### IsolatedThread

#### Constructor
```js
new IsolatedThread(function[, id])
```
- Accepts either a normal function (converted to generator) or a generator function.
- `id`: Optional. String for debugging purposes.

#### Control Methods
- `start()` — Begins thread execution.
- `stop()` — Terminates execution and resets thread state.
- `pause()` — Temporarily halts execution.
- `resume()` — Resumes from paused state.
- `sleep(ms)` — Puts the thread into sleep state for temporarily amount of time.
- `join([ms])` — Blocks the calling thread until the called thread finishes executing (with timeout).

#### Delayed Methods
- `startAfter(delay)` — Starts the thread after a delay.
- `pauseAfter(delay)` — Pauses the thread after a delay.
- `resumeAfter(delay)` — Resumes the thread after a delay.
- `stopAfter(delay)` — Stops the thread after a delay.
- `sleepAfter(delay, ms)` — Puts the thread into sleep state for temporarily amount of time after a delay.

#### Configuration
- `setArgs(...args)` — Supplies arguments to be passed into the thread function.
- `result()` — Returns the final value returned by the thread function (once the thread has completed). This is especially useful for retrieving computation outcomes, intermediate results, or passing data back from inner threads. If the thread function throws an error, `result()` will return an instance of `Error`.
- `setId(id)` — Assigns a custom ID to the thread.
- `setFunction(func)` — Change the thread's function at any given time, automatically restarts the thread if started.

#### Observability
- `stepsCount()` — Number of yield steps executed so far.
- `isstarted()` — Whether the thread was started.
- `ispaused()` — Whether it is currently paused.
- `isstopped()` — Whether the thread was stopped.
- `isrunning()` — Whether it is currently active.
- `issleeping()` — Whether it is currently sleeping.
- `isdone()` — Whether the thread done executing.
- `onfinish(finishFunc)` — Assign a finish event handler to the isolated thread.
- `onyield(yieldFunc)` — Assign a yield event handler to the isolated thread.
- `IsolatedThread.count()` — Returns total count of all isolated threads created so far.
- `terminate()` — Terminates the called thread, will no longer be usable.
##### NOTE : terminating process is done automatically when the isolated thread finishes executing, so its not recycable unlike a normal thread.

#### Error Handling
- `catch(fn)` — Assign a thread-local error handler.

---

### ThreadTask
#### Configuration
- `ThreadTask.run(fn: function)` — Creates a new ThreadTask instance and pushes the first function to the queue.
- `then(fn: function)` — Adds a function to the internal task queue.
- `setId(id: string)` — Sets a custom general identifier for the task queue.
- `chained(priorityLevel?: number): BranchedTask` — Creates a branched task execution group that runs tasks in order.
- `atonce(priorityLevel?: number): BranchedTask` — Creates a branched task execution group that runs all tasks simultaneously.
- `group(priorityLevel?: number, id?: string, isolated?: boolean)` — Generates a ThreadGroup from the queued functions, with optional priority, id & threads isolation control.
- `queue` — Returns the task queue as functions array.
### BranchedTask Object
Returned from chained() or atonce(). Supports the following:
- `start(reverse?: boolean, delayBetween?: number)` — Start the branched task execution, with optional reverse and delay between tasks control.
- `startAfter(delay: number, reverse?: boolean, delayBetween?: number)` — Start the branched task execution after a delay, with optional reverse and delay between tasks control.
- `setId(id: string)` — Set branch specific id.
- `isolated(flag: boolean)` — Makes the task branch threads isolated or not (using `Thread` class or `IsolatedThread` class).
- `chained(...)`, `atonce(...)`, `group(...)`, `queue` and `run(...)` — inherited from the original task.
#### NOTE: BranchedTask Object methods returns the object itself, so you can safely branch another BranchedTask object from the original task within the branched task, that means branching can go indefinitely as much as you like...
##### for example :
```js
ThreadTask
    .run(...)
    .then(...)
    .then(...)
    ... // more thens
    .chained() // branch task n-1, chained
    .setId(...) // still branch task n-1
    ... // still branch task n-1
    .atonce() // another branch task n-2 from our task
    ... // branch task n-2
    .run(...) // indicates a new task creation...
```


### ThreadExecutor

#### Beat Loop Control
- `setBeatTime(ms | ThreadExecutor.ADAPTIVE)` — Sets beat interval. Default: adaptive.

#### Global Error Handler
- `catch((ex, thread) => {})` — Catches all uncaught thread errors.

#### Status
- `handling()` — Returns true if executor is actively dispatching steps.
- `looping()` — Returns true if beat loop is running.

---

### Thread Priorities
- `Thread.LOW_PRIORITY_LEVEL = 1` — Lowest priority. These threads will be scheduled last after all higher-priority and resumed/slept threads have been handled.
- `Thread.MID_PRIORITY_LEVEL = 2` — Intermediate level. Useful when balancing multiple threads with varying urgency. Balanced execution between low and high priority threads.
- `Thread.HIGH_PRIORITY_LEVEL = 3` — Highest user-defined priority. These threads are scheduled before lower-priority ones (excluding resumed/slept threads which always take precedence).

During each executor beat, threads are selected for execution based on their priority. Threads with higher values are favored and scheduled earlier. The default priority is `Thread.LOW_PRIORITY_LEVEL = 1`.

However, two special thread states override this system:
- **Slept threads** (those recovering from `Thread.sleep`) are always prioritized first to ensure accurate wake-up timing.
- **Paused threads** (that were explicitly paused and resumed) come next, ensuring responsiveness and timely recovery.

## Architecture

`threaded.js` operates in two main phases:

### Phase 1: Function Transformation
All thread functions (non-generator) are parsed into Abstract Syntax Trees (AST) using Acorn, then traversed and modified to inject `yield` statements between logical steps. These are regenerated into generator functions via Escodegen.

This means that you can pass regular-looking code, and `threaded.js` will automatically insert necessary `yield` points for cooperative scheduling. The transformation is skipped for functions already defined as generators.

You can also reference external or inline functions, and `threaded.js` will transform them automatically unless they are native functions.

### Phase 2: Execution Scheduling
The `ThreadExecutor` loop runs at a configurable beat interval (either fixed or adaptive). It scans all active threads and executes one step per eligible thread in each cycle.

Execution order follows this hierarchy:
1. Slept threads ready to resume (for time accuracy)
2. Resumed threads (for responsiveness)
3. All other threads, ordered by descending priority

This model enables deterministic, cooperative multitasking without blocking the JavaScript event loop.

---

## Thread joining
The design of joining can't be achieved just by looping until the thread finishes executing, that will block the entire event loop.
Instead..., for efficiency `thread.join()` will be replaced with :
```js
    while (thread.isrunning()) {
        yield __thefunctionstepscount__; // or just yield; for custom generator functions
    }
```
And `thread.join(timeoutms)` will be replaced with :
```js
    let __isjointimeoutN__ = false;
    let __jointimeoutN__ = setTimeout(function () { __isjointimeoutN__ = true; }, timeoutms)
    while (thread.isrunning() && !__isjointimeoutN__) {
        yield __thefunctionstepscount__; // or just yield; for custom generator functions
    }
    clearTimeout(__jointimeoutN__);
```
Using the AST processor only inside a thread environment (inside a thread).
Using it somewhere else will throw the error : `ThreadError: Thread.join or ThreadGroup.join or IsolatedThread.join method can't be called outside thread environment`

---

## Inner Function Isolation

When `Thread.innerfunctionsisolation` is enabled or `thread.isolateInnerFunctions(true)` is called, any custom inner function that *can be* blocking (such as infinite loops or CPU-intensive routines) will be isolated and wrapped into a separate inner thread. This ensures the main scheduler loop remains unblocked, allowing all other threads to continue executing smoothly.

The following examples demonstrate how this transformation works:

### Before:
```js
() => {
  while (true) {
    myfunc(this.id);
  }
}
```

### After:
```js
function* () {
  try {
    let __thefunctionstepscount__ = 0;
    while (true) {
      const inner = Thread.innerThreadFor(this, myfunc).setArgs(this.id).isolateErrors(true).start();
      while (inner.running) yield __thefunctionstepscount__;
      let result = inner.result();
      if (result instanceof Error) throw new ThreadError(result, inner);
      yield __thefunctionstepscount__++;
    }
  } catch (ex) {
    ThreadExecutor.__threadExceptionOccurred__(ex);
    return ex;
  }
}
```

---

## Thread level errors isolation

When `.isolateErrors(true)` is called on a thread:
- Errors thrown in the thread are not propagated to the global or group-level catchers.
- They are still returned by `.result()`.
- You may still handle them locally with `.catch()` on the thread.

This is useful when errors are expected or should be handled privately without polluting global error flow.

---

## Custom Generator Functions

You may pass your own generator functions directly into the `Thread` constructor. In this case:
- No AST transformation occurs
- You are responsible for using `yield` properly

Example:
```js
new Thread(function* () {
  console.log("step 1");
  yield;
  console.log("step 2");
}).start();
```

### Warning
#### Remember to `yield` control when calling thread controls in your own generator functions to avoid race problems...

Example:
```js
new Thread(function* () {
  console.log("step 1");
  yield;
  Thread.sleep(1000);
  yield; // Yielding here is necessary
  // and must be called directly after the thread control...
  console.log("step 2");
}).start();
```

#### And using delayed controls inside a custom thread generator function is highly not recommended...

Example:
```js
new Thread(function* () {
  console.log("step 1");
  yield;
  Thread.sleepAfter(1000, 1000);
  // Sleeping here is not garenteed...
  // Even when you yield control
  // Unless you yield control at every step :)
  console.log("step 2");
}).start();
```

---

## Support this project

![liberapay stats](https://img.shields.io/liberapay/patrons/flame.opensource.svg?logo=liberapay)

If you find this library helpful, consider sponsoring it to support continued development:

![Donate using Liberapay](https://liberapay.com/assets/widgets/donate.svg)

---

## Contributing

We welcome contributions of all kinds — whether it's reporting bugs, suggesting features, submitting code, or improving documentation.

### Ways to Contribute
- **Report Bugs**: Found a bug or unexpected behavior? [Open an issue](https://github.com/flame-opensource/threaded.js/issues).
- **Feature Requests**: Have a use case in mind? Suggest improvements or additions.
- **Code Contributions**: Fork the repository, make your changes, and open a pull request. Please ensure changes are well-documented and tested.
- **Documentation Improvements**: Help improve clarity, add examples, or expand technical explanations.
- **Discussions**: Share feedback, best practices, or ask questions in the discussions tab.



Thank you for helping make `threaded.js` better! We follow conventional commit messages and encourage consistency across code style. Please include a clear description of your change when submitting a pull request.

---

## License

```
MIT License

Copyright (c) 2025 Flame

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

