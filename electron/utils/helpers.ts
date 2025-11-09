/**
 * Utility helper functions
 */

/**
 * Sleep for specified milliseconds
 * @param ms Milliseconds to sleep
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
