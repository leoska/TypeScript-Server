import { app } from "./App";
import { timeout } from "./time";

const EXIT_MAX_WAIT = 10000;

process.on("SIGINT", async () => {
    try {
        console.log("Application terminating...");
        await Promise.race([app.stop(), timeout(EXIT_MAX_WAIT)]);
    } catch (e) {
        console.error(`Application can\'t stop correct: ${e}`);
        process.exit(1);
    }

    process.exit(0);
});

try {
    app.run();
} catch (e) {
    console.error(e.message);
}
