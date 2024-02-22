/* global module */
module.exports = async () => {
  return {
    verbose: true,
    testMatch: ['**/specs/**/*.spec.[jt]s?(x)'],
    testTimeout: 120000,
    setupFiles: ['dotenv/config']
  }
}
