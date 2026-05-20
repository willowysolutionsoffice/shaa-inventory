// src/lib/actions/getMonthlyData.ts
// Mock implementation of getMonthlyData for frontend-only build

export async function getMonthlyData() {
  const data = [];
  const today = new Date();

  // Generate data for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    // Create realistic variation
    const baseSales = 800 + Math.sin(i / 2) * 400 + Math.random() * 300;
    const basePurchases = 500 + Math.cos(i / 2) * 300 + Math.random() * 200;

    data.push({
      date: dateKey,
      sales: Math.round(baseSales * 100) / 100,
      purchases: Math.round(basePurchases * 100) / 100,
    });
  }

  return data;
}
