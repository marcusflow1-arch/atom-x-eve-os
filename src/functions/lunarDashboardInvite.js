export async function lunarDashboardInvite({ action, friend_id }) {
  try {
    // Replace with your actual API endpoint
    const response = await fetch('/api/lunar-dashboard/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        friend_id,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('lunarDashboardInvite error:', error);
    throw error;
  }
}
