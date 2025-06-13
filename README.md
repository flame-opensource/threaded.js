# threaded.js
JavaScript with threads !
## Table of Contents
- [What is threaded.js](#what-is-threadedjs)
- [Supported Features](#supported-features-for-now)
- [Installation](#installation)
- [Usage Examples](#usage-examples)
- [How Does It Work](#how-does-it-work)
- [ThreadGroup](#threadgroup-and-threads-grouping)
- [Contributing](#contributing)
- [License](#licence)
### What is threaded.js
threaded.js is a cooperative multitasking framework for JavaScript that enables simulated thread-like behavior using generator functions and a cooperative thread scheduler. It provides robust control over asynchronous flows using familiar threading concepts like sleep, pause, resume, stop, and thread grouping.
### Supported features (for now)
* Cooperative execution & concurrency
* Basic thread controls (start, stop, pause, resume, sleep), and delayed ones (startAfter, stopAfter, pauseAfter, resumeAfter, sleepAfter)
* Thread status tracking (started, paused, stopped, paused, running flags)
* Thread execution priority levels support (Thread.LOW_PRIORITY_LEVEL, Thread.MID_PRIORITY_LEVEL, Thread.HIGH_PRIORITY_LEVEL, or custom value)
* Thread function arguments (using setArgs(...args) method)
* Custom thread generator function (just pass a custom generator function to the thread constructor instead of a normal thread and you good to go !), note : yielding is done by you :)
* Thread grouping (using ThreadGroup class)
* ThreadExecutor handler loop beat time control (using ThreadExecutor.setBeatTime(time in ms))
* Adaptive ThreadExecutor handler loop beat time control (using ThreadExecutor.setBeatTime(ThreadExecutor.ADAPTIVE), set by default)
* Custom thread error handling (using thread.catch(ex), threadgroup.catch(ex, thread) or ThreadExecutor.catch(ex, thread) for global error handling)
* Custom Thread & ThreadGroup ids for easier debugging (using Thread constructor (func, prioritylevel, id) or using setId function in Thread & ThreadGroup) (ids are set automatically by default)
* Thread inner functions isolation for better concurrency (set by flag Thread.innerfunctionsisolation, set to true by default)
* Thread errors isolation, so it only thrown in the thread's catch event and not in a global scope (using thread.errorSilently(flag) method, disabled by default)
* Execution progress track (using thread.stepsCount() method, returns how much steps got executed)
* Thread recycling (a thread can be used and started multiple times)
* Nested threads recycling (using Thread.innerThreadFor(outerThread, func, prioritylevel, id), useful when creating nested threads (thread inside a thread))
* ThreadExecutor handling and looping status (using ThreadExecutor.handling() & ThreadExecutor.looping() methods, handling if its handling a thread & looping it the handler loop is running)
### Installation
#### Browser
Add the following scripts to your html :
```html
<script src="https://cdn.jsdelivr.net/npm/acorn@latest/dist/acorn.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/acorn-walk@latest/dist/walk.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/escodegen-browser@latest/escodegen.browser.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/threaded.min.js@latest/threaded.min.js"></script>
```
#### Node.js
Install the following npm packages :
```
npm install acorn acorn-walk escodegen threaded.min.js
```
Then import threaded.js library into your project :
```js
const { Thread, ThreadExecutor, ThreadGroup, ThreadError } = require('threaded.min.js');
...
```
### Usage examples
```js
// Thread 1: normal thread (threads functions accept arguments !)
const thread1 = new Thread(function (msg) {
  console.log("Thread 1: step 1");
  Thread.sleep(500);
  console.log(msg)
  console.log("Thread 1: step 2");
}).setArgs("hello world").start();


// Thread 2: thread with high priority
const thread2 = new Thread(function () {
  console.log("Thread 2: high priority start");
  throw new Error("Oops!");
}, Thread.HIGH_PRIORITY_LEVEL).start();


// Thread 3: thread with custom id and custom priority
const thread3 = new Thread(function () {
  console.log("Thread 3: very high priority start");
}, 10, "high priority thread")/*.setId("high priority thread")*/.start();


// Thread 4: Start after delay
const thread4 = new Thread(function () {
  console.log("Thread 4: started late");
}).startAfter(1000);


// Thread 5: Pause and resume
const thread5 = new Thread(function () {
  console.log("Thread 5: running");
  Thread.sleep(1000);
  console.log("Thread 5: resumed");
}).setId("PausableThread").start();

setTimeout(() => {
  thread5.pause();
  console.log("Thread 5 paused");
}, 200);

setTimeout(() => {
  thread5.resume();
  console.log("Thread 5 resumed");
}, 1200);


// ThreadGroup: managing multiple threads
const group = new ThreadGroup(
  new Thread(() => {
    console.log("Group thread 1 start");
    Thread.sleep(200);
    console.log("Group thread 1 end");
  }),
  new Thread(() => {
    console.log("Group thread 2 start");
    Thread.sleep(300);
    console.log("Group thread 2 end");
  }),
  new Thread(() => {
    Thread.sleep(1000);
    throw Error("error in a threadgroup thread");
  }).setId("error thread")
).setId("MyThreadGroup").catch((ex, thread) => {
  console.warn(`Error in ${thread.id}:`, ex.message);
}).start();


// Global exception handler
ThreadExecutor.catch((ex, thread) => {
  console.warn(`Global catch: Error in thread "${thread?.id}":`, ex.message);
});


// Adaptive beat time
ThreadExecutor.setBeatTime(16); // 60 Beat every second
```
### How does it work
#### Step 1 : converting functions into stepped functions (generator functions)
##### Why ?
In order to achieve the cooperative design of threads execution (and executes the threads concurrently) we need to execute the given functions step by step (instead of executing them at once) and give each thread priority to execute & run, thats concurrency...
The only official way to do that is by [yielding](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield) control in every step the function runs..., and the function must be a generator function, something like this :
```js
function* func() {
    let a = 0; // first operation...
    yield; // yield control...
    a += 5; // second operation...
    yield; // yield control...
    // and so on...
}
```
##### Used third-party libraries
threaded.js relies on [acorn](https://github.com/acornjs/acorn), [acorn-walker](https://github.com/acornjs/acorn/tree/master/acorn-walk) and [escodegen](https://github.com/estools/escodegen) to convert the given normal functions in threads into generator functions...
##### Why using acorn, acorn-walker and escodegen ?
You see adding yield operators to every single step in the function is so annoying and time consuming..., thats why our library uses those third-party libraries to do that automatically, so you don't have to care about that process, just pass a normal non-native function to the Thread object and the constructor will take care of that task...

So lets say we pass the following function to the Thread constructor :
```js
function () {
  console.log("Thread 1: step 1");
  Thread.sleep(500);
  console.log("Thread 1: step 2");
}
```
The Thread constructor under the hood will convert the given function into a generator one automatically and save it for later use, it turns something like this :
```js
function* () {
    try {
        let __thefunctionstepscount__ = 0;
        console.log('Thread 1: step 1');
        yield __thefunctionstepscount__++;
        Thread.sleep(500);
        yield __thefunctionstepscount__++;
        console.log('Thread 1: step 2');
    } catch (ex) {
        ThreadExecutor.__threadExceptionOccurred__(ex);
        return ex;
    }
}
```
It yields in every step (except for the return statement or function end) and returns the executing step progress or count for better analysis, and it wraps the function into a try catch block for thread error isolation, exactly what we need for cooperative execution...
#### Step 2 : Threads scheduling and execution
Since we have converted the given functions into a stepped ones, all we have to do is to iterate through each created running Thread and execute each one of them step at a time cooperatively, we ignore the slept and paused threads for a while and once they resume we give the slept threads the highest priority for sleep time accuracy, then the paused threads for resuming asap, and then we handle the rest of the threads according to their priority level (1 or Thread.LOW_PRIORITY_LEVEL being the lowest)
And thats exactly what the ThreadExecutor class do automatically.
##### Handler loop beat time
Well it has to be some delay in the handler loop in each loop (because of single-threaded JavaScript nature) to let the outside main events run properly and to not block the main js thread..., and that delay is called the beat time (from heartbeat).
By default the beat time is set to adaptive (ThreadExecutor.ADAPTIVE) that means that the ThreadExecutor calculates how much time it lasted during executing an event outside the threads environment and use that as the new beat time, so its variable and adaptive, that means if it doesn't take so much time outside it loops immediately and vice versa...
Even though its set by default, but it is recommended to set a custom beat time according to your need (16ms for 60 frame per second rendering for example...), and it is the most recommended to set it to 0 for the highest response rate and wrap everything into threads...
##### To set a custom beat time call :
```js
ThreadExecutor.setBeatTime(ms);
```
#### Note : Unlike threading in other programming languages, threads here are recyclable, that means you can start a thread multiple times...
### ThreadGroup and threads grouping
If you want to wrap a bunch of threads into a group and do batch handling, and that what the ThreadGroup class do...
#### How to use it ?
You simply create a ThreadGroup object and pass the wrapped threads into its constructor :
```js
ThreadGroup threadgroup = new ThreadGroup(thread1, thread2, thread3, ...)
...
```
Or you can add or remove the threads later by using the add and remove methods :
```js
...
threadgroup.add(thread4);
threadgroup.remove(thread1);
...
```
and anything you can do to a Thread you can do it to a Threadgroup (start, pause, resume, ...) and it will handle batch handling for you.
You can set a custom id for it (set automatically) for better debugging :
```js
...
threadgroup.setId('my threadgroup');
...
```
### Contributing
The project is open source so you can request a change, an update, report bugs or request a new feature...
## Licence
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
