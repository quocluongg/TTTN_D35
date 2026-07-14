// can not use object destructuring for env var
// since dynamic lookup will not be inline when reading env var for browser
// ref: https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
export const NODE_ENV = process.env.NODE_ENV
export const WEB_URL = process.env.WEB_URL
export const SENTRY_DSN_URL = process.env.SENTRY_DSN_URL

export const DEV = NODE_ENV === 'development'
export const PROD = NODE_ENV === 'production'
export const TEST = NODE_ENV === 'test'

// check current render is server side or not
export const IS_SERVER = typeof window === 'undefined'

// affiliate config
export const AFFILIATE_CODE_LENGTH = 10
export const AFFILIATE_CODE_QUERY_NAME = 'ref'
export const AFFILIATE_COOKIE_NAME = 'ref'

// default value used to update next priority
export const BASE_PRIORITY = 16384

// header
export const HEADER_DESKTOP_HEIGHT = 80

// stripe payment
export const ARTWORK_MIGRATION_REQUEST_PRICE = 50 // 50$

// contact
export const CALENDLY_URL = 'https://calendly.com/sarah-cohart/30min'
export const SHYEVIN_ZCAL_URL = 'https://zcal.co/shyevin/30min'
export const KENDALL_CALENDLY_URL = 'https://calendly.com/meetingwithkendall/30min'
export const BOOK_DEMO_URL = 'https://web.cohart.com/book-a-demo'
