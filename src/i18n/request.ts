import { getRequestConfig } from'next-intl/server'
import { headers } from'next/headers'

export default getRequestConfig(async () => {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') ??''
  const lang = acceptLanguage.toLowerCase()
  const locale = (['es','fr','de','it'] as const).find(l => lang.startsWith(l)) ??'en'

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
