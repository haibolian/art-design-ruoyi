export const toFormUrlEncoded = (params: Record<string, any>) => {
  const data = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (key === 'params' && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([paramKey, paramValue]) => {
        if (paramValue === undefined || paramValue === null || paramValue === '') return
        data.append(`params[${paramKey}]`, String(paramValue))
      })
      return
    }

    data.append(key, String(value))
  })

  return data
}
