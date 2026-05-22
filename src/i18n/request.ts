import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'

export default getRequestConfig(async () => {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') ?? ''
  const locale = acceptLanguage.toLowerCase().startsWith('es') ? 'es' : 'en'

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
