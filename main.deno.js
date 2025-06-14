import { Thread, ThreadExecutor, ThreadGroup, ThreadError, ThreadedTools } from './threaded/threaded.module.js';
import { ThreadedDenoCompat } from 'https://cdn.jsdelivr.net/npm/threaded.js@latest/dist/deno_compat/threaded.deno.compat.min.js';
ThreadedDenoCompat.supportDeno(ThreadedTools);

Thread.innerfunctionsisolation = true;

new Thread(function (name) {
  (function* (a) {
      console.log(a)
      console.log(a)
      console.log(a)
  })("hello")
  console.log(`Hello ${name}, step 1`);
  Thread.sleep(5000);
  console.log("Step 2 complete");
}).setArgs("Hamza")
.catch((ex) => {
  console.log(ex)
}).isolateInnerFunctions().start();