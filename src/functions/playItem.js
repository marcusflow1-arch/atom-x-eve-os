/**
 * Initiates playback/launch of a game item
 * @param {Object} params - The play parameters
 * @param {string} params.type - Type of item (game, stream, etc.)
 * @param {string} params.title - Title/name of the item
 * @param {string|number} params.id - ID of the item to play
 * @returns {Promise<Object>} Response containing launch_url or error
 */
export async function playItem({ type, title, id }) {
  try {
    // Call the backend API to get launch URL
    const response = await fetch('/api/play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        title,
        id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to initiate play: ${response.statusText}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('playItem error:', error);
    return { error: error.message };
  }
}
