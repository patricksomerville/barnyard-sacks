// Little Sack ($5) — Code Utility: Debounce with Max Wait
// Actually useful, actually commented, ready to drop in

/**
 * Creates a debounced function that delays invoking func until after
 * wait milliseconds have elapsed since the last time the debounced
 * function was invoked. Also ensures func is called at least every
 * maxWait milliseconds (useful for "live" search that must update).
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {number} maxWait - The maximum time func is allowed to be delayed
 * @returns {Function} - The debounced function
 */
function debounce(func, wait, maxWait) {
  let timeoutId;
  let lastCallTime = 0;

  return function debounced(...args) {
    const now = Date.now();
    const context = this;

    const shouldCallNow = maxWait && (now - lastCallTime >= maxWait);

    clearTimeout(timeoutId);

    if (shouldCallNow) {
      lastCallTime = now;
      func.apply(context, args);
    } else {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func.apply(context, args);
      }, wait);
    }

    return function cancel() {
      clearTimeout(timeoutId);
    };
  };
}

// Usage:
// const search = debounce((query) => {
//   api.search(query);
// }, 300, 1000); // Debounce 300ms, but force call every 1s max

export { debounce };