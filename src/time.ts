export function timeout(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(reject, ms);
    });
}