import { Thread, ThreadExecutor, ThreadGroup, ThreadError, ThreadedTools } from 'https://cdn.jsdelivr.net/npm/threaded.js@latest/dist/threaded.module.min.js';
import { ThreadedDenoCompat } from 'https://cdn.jsdelivr.net/npm/threaded.js@latest/dist/deno_compat/threaded.deno.compat.min.js';
ThreadedDenoCompat.supportDeno(ThreadedTools);

Thread.innerfunctionsisolation = true;

globalThis.myfunc = (a) => {
    while (true) {
        console.log(a)
    }
}

const thread = new Thread(
        () => {
            globalThis.myfunc(this.id);
        },
    )
    .setId("main thread")
    .start();

    const preciseThread = new Thread(function* () {
  console.log("Step 1");
  yield; // Explicit yield point
  
  for (let i = 0; i < 3; i++) {
    console.log(`Iteration ${i}`);
    yield; // Yield after each iteration
  }
  
  const result = yield globalThis.myfunc(); // Can yield promises
  console.log("Async result:", result);
});


setInterval(() => console.log("outside"), 100)