const ugxFormatter = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  maximumFractionDigits: 0,
})

export function formatUGX(amount) {
  return ugxFormatter.format(amount)
}
