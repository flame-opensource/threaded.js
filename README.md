# threaded.js

**JavaScript with Threads — Simulated, Structured, Safe.**

---

## Table of Contents
- [Introduction](#introduction)
- [Core Concepts](#core-concepts)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Extended Examples](#extended-examples)
- [Advanced Use Cases](#advanced-use-cases)
- [API Reference](#api-reference)
  - [Thread](#thread)
  - [ThreadGroup](#threadgroup)
  - [ThreadExecutor](#threadexecutor)
  - [Static Thread Utilities](#static-thread-utilities)
- [Architecture](#architecture)
- [Inner Function Isolation](#inner-function-isolation)
- [Silent Mode](#silent-mode)
- [Custom Generator Functions](#custom-generator-functions)
- [Contributing](#contributing)
- [License](#license)

---

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

#### Delayed Methods
- `startAfter(ms)` — Starts the thread after a delay.
- `pauseAfter(ms)` — Pauses the thread after a delay.
- `resumeAfter(ms)` — Resumes the thread after a delay.
- `stopAfter(ms)` — Stops the thread after a delay.

#### Configuration
- `setArgs(...args)` — Supplies arguments to be passed into the thread function.
- `result()` — Returns the final value returned by the thread function (once the thread has completed). This is especially useful for retrieving computation outcomes, intermediate results, or passing data back from inner threads. If the thread function throws an error, `result()` will return an instance of `Error`.
- `setId(id)` — Assigns a custom ID to the thread.
- `errorSilently(flag)` — Prevents propagation to group/global if true.

#### Observability
- `stepsCount()` — Number of yield steps executed so far.
- `started` (Boolean) — Whether the thread was started.
- `paused` (Boolean) — Whether it is currently paused.
- `stopped` (Boolean) — Whether the thread was stopped.
- `running` (Boolean) — Whether it is currently active.

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

#### Modifiers
- `add(thread)` — Adds a thread to the group.
- `remove(thread)` — Removes a thread from the group.

#### Error Handling
- `catch((ex, thread) => {})` — Group-level error handler for any member thread.

#### Debugging
- `setId(id)` — Optional identifier for tracking.

---

### ThreadExecutor

#### Beat Loop Control
- `setBeatTime(ms | ThreadExecutor.ADAPTIVE)` — Sets beat interval. Default: adaptive.

#### Global Error Handler
- `catch((ex, thread) => {})` — Catches all uncaught thread errors.

#### Status
- `handling()` — Returns true if executor is actively dispatching steps.
- `looping()` — Returns true if beat loop is running.

---

### Thread Configuration & Utility Constants

#### Thread Priority Levels
- `Thread.LOW_PRIORITY_LEVEL = 1` — Lowest priority. These threads will be scheduled last after all higher-priority and resumed/slept threads have been handled.
- `Thread.MID_PRIORITY_LEVEL = 2` — Intermediate level. Useful when balancing multiple threads with varying urgency. Balanced execution between low and high priority threads.
- `Thread.HIGH_PRIORITY_LEVEL = 3` — Highest user-defined priority. These threads are scheduled before lower-priority ones (excluding resumed/slept threads which always take precedence).

During each executor beat, threads are selected for execution based on their priority. Threads with higher values are favored and scheduled earlier. The default priority is `Thread.LOW_PRIORITY_LEVEL = 1`.

However, two special thread states override this system:
- **Slept threads** (those recovering from `Thread.sleep`) are always prioritized first to ensure accurate wake-up timing.
- **Paused threads** (that were explicitly paused and resumed) come next, ensuring responsiveness and timely recovery.

Following these, remaining threads are scheduled by priority value. Custom numeric levels can be used for more granular control if needed. in which threads are stepped during each executor beat. Threads with higher values are favored earlier in the scheduling cycle. You may also pass a custom numerical value beyond these three if finer control is needed.

#### `Thread.innerfunctionsisolation`
- Global flag to enable or disable isolation of inner functions into child threads.
- **Set to `false` by default**.
- When enabled (`true`), heavy blocking functions inside a thread (such as infinite loops or long-running computations) are automatically wrapped into separate inner threads.
- This ensures such operations do not block the main thread scheduler, preserving responsiveness and allowing other threads to continue executing smoothly.
- When disabled (`false`), all function calls run directly within the main thread’s context, which may cause performance issues if those functions block execution for extended periods. (`false`), all nested function calls are executed in the main thread context, which can lead to blocking if such functions are synchronous or long-running.

#### `Thread.innerThreadFor(parentThread, func[, priority, id])`
- Wraps `func` into a thread associated with `parentThread`.
- Useful for thread recycling and safely invoking inner long-running or blocking functions.
- Ensures isolated execution and result retrieval without blocking the main thread.
- Enables better control over nested thread flows and error propagation.
- Example:`func` into a thread associated with `parentThread`.
- Ensures isolated execution and result retrieval.
- Example:
```js
const child = Thread.innerThreadFor(this, func).start();
```

## Architecture

`threaded.js` operates in two main phases:

### Phase 1: Function Transformation
All thread functions (non-generator) are parsed into Abstract Syntax Trees (AST) using Acorn, then traversed and modified to inject `yield` statements between logical steps. These are regenerated into generator functions via Escodegen.

This means that you can pass regular-looking code, and `threaded.js` will automatically insert necessary `yield` points for cooperative scheduling. The transformation is skipped for functions already defined as generators.

### Phase 2: Execution Scheduling
The `ThreadExecutor` loop runs at a configurable beat interval (either fixed or adaptive). It scans all active threads and executes one step per eligible thread in each cycle.

Execution order follows this hierarchy:
1. Slept threads ready to resume (for time accuracy)
2. Resumed threads (for responsiveness)
3. All other threads, ordered by descending priority

This model enables deterministic, cooperative multitasking without blocking the JavaScript event loop.

---

## Inner Function Isolation

When `Thread.innerfunctionsisolation` is enabled, any custom inner function that *can be* blocking (such as infinite loops or CPU-intensive routines) will be isolated and wrapped into a separate inner thread. This ensures the main scheduler loop remains unblocked, allowing all other threads to continue executing smoothly.

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
      const inner = Thread.innerThreadFor(this, myfunc).setArgs(this.id).errorSilently(true).start();
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

## Silent Mode

When `.errorSilently(true)` is called on a thread:
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
  yield;
  console.log("step 1");
  yield;
  console.log("step 2");
}).start();
```

You can also reference external or inline functions, and `threaded.js` will transform them automatically unless they are native functions.

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

