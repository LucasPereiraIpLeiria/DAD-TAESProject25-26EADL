export function extractErrorMessage(err) {
  const errors = err?.response?.data?.errors
  if (errors && Object.keys(errors).length > 0) {
    const firstKey = Object.keys(errors)[0]
    const message = errors[firstKey][0] || 'Validation error'
    return message
  }

  const fallback = err?.response?.data?.message || err?.message || 'Something went wrong'
  return fallback
}
