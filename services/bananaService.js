/**
 * ====================================================================
 * THEME: INTEROPERABILITY
 * File: services/bananaService.js
 * Description:
 *   Handles interoperability with Marc Conrad's external Banana REST API.
 *   Consumes the remote web service over HTTPS and parses the JSON response
 *   containing the puzzle image URL and numerical solution (0-9).
 *   Documentation: https://marcconrad.com/uob/banana/doc.php
 * ====================================================================
 */

const BANANA_API_URL = 'https://marcconrad.com/uob/banana/api.php?out=json';

/**
 * Fetch a new puzzle from the external Banana API
 * @returns {Promise<{ question: string, solution: number }>}
 */
async function fetchBananaQuestion() {
  try {
    // Interoperability via HTTP GET to external REST endpoint
    const response = await fetch(BANANA_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(6000) // 6 second timeout
    });

    if (!response.ok) {
      throw new Error(`Banana API responded with HTTP status ${response.status}`);
    }

    const data = await response.json();

    // Verify response structure
    if (!data.question || data.solution === undefined) {
      throw new Error('Invalid response structure received from Banana API');
    }

    return {
      question: data.question,
      solution: parseInt(data.solution, 10)
    };
  } catch (error) {
    console.warn(`[Banana Service Warning] Remote API failed or offline: ${error.message}`);
    // Fallback puzzle in case internet is down or remote service is unreachable
    // Ensures software resilience in distributed environments
    const fallbackNumber = Math.floor(Math.random() * 10);
    return {
      question: `https://marcconrad.com/uob/banana/banana.php?rnd=${Date.now()}`,
      solution: fallbackNumber,
      isFallback: true
    };
  }
}

module.exports = {
  fetchBananaQuestion
};
