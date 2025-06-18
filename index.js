ThreadTask.run(() => console.log("step 1")) // indicates new task creation
    .then(() => console.log("step 2"))
    .then(() => console.log("step 3"))
    .then(() => console.log("step 4"))
    .then(() => console.log("step 5"))
    .then(() => console.log("step 6"))
    .atonce() // a task fork
    .setId("my task")
    .startAfter(3000, false, 1000)
    .chained() // a task fork
    .setId("my task 2")
    .start(false, 1000)
    .run(() => console.log("step 7")) // indicates new task creation
    .then(() => console.log("step 8"))
    .then(() => console.log("step 9"))
    .atonce() // a task fork
    .isolated() // isolated threads
    .start(false, 1000);

setInterval(() => console.log("from event loop"), 1000)