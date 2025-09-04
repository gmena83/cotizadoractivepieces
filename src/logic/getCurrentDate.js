/**
 * Gets the current date and formats it as a string.
 * Extracted from step_17 of the original workflow.
 * @returns {string} The formatted date string (e.g., "August 23, 2025").
 */
function getCurrentDate() {
  const today = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return today.toLocaleDateString('en-US', options);
}

module.exports = { getCurrentDate };
