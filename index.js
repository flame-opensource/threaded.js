Thread.innerfunctionsisolation = true;

function myfunc(a) {
    while (true) {
        console.log(a)
    }
}

const thread = new Thread(
        async () => {
            let result = await myfunc(this.id);
        },
    )
    .setId("main thread")
    ;

    
        const preciseThread = new Thread(function* () {
      console.log("Step 1");
  yield; // Explicit yield point
  
  for (let i = 0; i < 3; i++) {
    console.log(`Iteration ${i}`);
    yield; // Yield after each iteration
  }
  
  const result = yield myfunc(); // Can yield promises
  console.log("Async result:", result);
    }).start();

    console.log(thread.__generatorFunc__.toString())

setInterval(() => /*console.log("outside")*/5, 100)