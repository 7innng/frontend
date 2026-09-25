const USER_STORAGE_KEY = 'zhixu-demo-user'
const REMEMBERED_ACCOUNT_KEY = 'zhixu-remembered-account'

export const demoAccount = {
  nickname: '小知同学',
  contact: 'student@zhixu.ai',
  password: 'Study2026',
  direction: '前端开发',
}

export function loadRegisteredUser() {
  try {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY)
    if (!rawUser) {
      return null
    }

    const user = JSON.parse(rawUser)
    if (typeof user.contact !== 'string' || typeof user.passwordDigest !== 'string') {
      return null
    }

    return user
  } catch {
    return null
  }
}

export function saveRegisteredUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function loadRememberedAccount() {
  try {
    return localStorage.getItem(REMEMBERED_ACCOUNT_KEY) || ''
  } catch {
    return ''
  }
}

export function saveRememberedAccount(account) {
  if (account) {
    localStorage.setItem(REMEMBERED_ACCOUNT_KEY, account)
  } else {
    localStorage.removeItem(REMEMBERED_ACCOUNT_KEY)
  }
}

// 仅用于本地演示的密码比对；浏览器存储不是可靠的真实鉴权边界。
export async function digestPassword(password) {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
