export function getDateRangeFilter(
  from?: string,
  to?: string,
  field: string = "createdAt"
) {
  if (!from || !to) return {};

  const start = new Date(from);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  return {
    [field]: {
      gte: start,
      lte: end,
    },
  };
}