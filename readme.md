# Synchronize

`npm i @jaenster/synchronize` or `yarn add @jaenster/synchronize`

## Problem
Ever had an async method that should not run twice at the same time?

## Solution
synchronize with a decorator!

## Example

```typescript
import {Synchronized} from "@jaenster/synchronized";

// generate a promise which delays
const delay = ms => new Promise<void>(resolve => setTimeout(resolve, ms)); 

class Worker {
    
    @Synchronized()
    async runTask(id: number) {
        // Do something
        
        // simulate some work
        console.log(`task #${id} started`);
        await delay(500);
        console.log(`task #${id} done`);
    }
    
}

(async () => {
    const worker = new Worker();

    await Promise.all([
        worker.runTask(0),
        worker.runTask(1),
        worker.runTask(2),
        worker.runTask(3),
    ]);
})();
```

## What happens

If `Worker.runTask` has the decorator `Synchronized`,it takes 2 seconds to run and logs:
- task #0 started
- task #0 done
- task #1 started
- task #1 done
- task #2 started
- task #2 done
- task #3 started
- task #3 done

if `Synchronized` is omitted from the example code, it takes a half second to run and logs:
- task #0 started
- task #1 started
- task #2 started
- task #3 started
- task #0 done
- task #1 done
- task #2 done
- task #3 done
