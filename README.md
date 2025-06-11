# threaded.js
JavaScript with threads !
# Version 1.0 of threaded.js
## Supported features
* Cooperative execution & concurrency
* Basic thread controls (start, stop, pause, resume, sleep, ...)
* Thread execution priority levels support (Thread.LOW_PRIORITY_LEVEL, Thread.MID_PRIORITY_LEVEL, Thread.HIGH_PRIORITY_LEVEL, or custom value)
* Thread grouping (using ThreadGroup class)
* ThreadExecutor handler loop beat time control (using ThreadExecutor.setBeatTime(time in ms))
* Adaptive ThreadExecutor handler loop beat time control (using ThreadExecutor.setBeatTime(ThreadExecutor.ADAPTIVE), set by default)
* Custom thread error handling (using thread.catch(ex), threadgroup.catch(ex, thread) or ThreadExecutor.catch(ex, thread) for global error handling)
* Custom Thread & ThreadGroup ids for easier debugging (using Thread constructor (func, prioritylevel, id) or using setId function in Thread & ThreadGroup) (ids are set automatically by default)
