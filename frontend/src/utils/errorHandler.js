export function extractErrorMessage(err) {
  // Handle Axios errors
  if (err?.response?.data) {
    const data = err.response.data

    // Check for validation errors object
    if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0]
      const errorValue = data.errors[firstKey]

      if (Array.isArray(errorValue)) {
        return errorValue[0] || 'Validation error'
      }
      if (typeof errorValue === 'string') {
        return errorValue
      }
    }

    // Check for direct message
    if (data.message && typeof data.message === 'string') {
      return data.message
    }
  }

  // Check error message
  if (err?.message) {
    return err.message
  }

  return 'Something went wrong'
}
