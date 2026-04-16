export const activateTrial = async (
  _supabase: any,
  promoCode?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const raw = localStorage.getItem('sb-bkwieknlxvkrzluongif-auth-token');
    if (!raw) return { success: false, message: 'Please sign in first' };

    const token = JSON.parse(raw)?.access_token;
    if (!token) return { success: false, message: 'Session expired' };

    const response = await fetch(
      'https://bkwieknlxvkrzluongif.supabase.co/functions/v1/activate-trial',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ promoCode: promoCode?.toUpperCase() }),
      }
    );

    const result = await response.json();

    if (result.success) {
      setTimeout(() => window.location.reload(), 1500);
      return { success: true, message: '🎉 1 month Pro activated!' };
    }

    if (result.error === 'Trial already used')
      return { success: false, message: 'You already used your free trial' };
    if (result.error === 'Invalid promo code')
      return { success: false, message: 'Invalid promo code' };

    return { success: false, message: result.error || 'Something went wrong' };
  } catch {
    return { success: false, message: 'Connection error. Try again.' };
  }
};
