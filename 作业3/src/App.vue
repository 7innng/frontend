<script setup>
import { nextTick, reactive, ref } from 'vue'
import { Button, Input, Tag, Toast } from '@kousum/semi-ui-vue'
import {
  demoAccount,
  digestPassword,
  loadRegisteredUser,
  loadRememberedAccount,
  saveRegisteredUser,
  saveRememberedAccount,
} from './demoAccount'

const rememberedAccount = loadRememberedAccount()
const activePanel = ref(rememberedAccount ? 'login' : 'register')
const activeUser = ref(null)
const registeredUser = ref(loadRegisteredUser())
const isSubmitting = ref(false)
const showRegisterPassword = ref(false)
const showConfirmPassword = ref(false)
const showLoginPassword = ref(false)

const registration = reactive({
  nickname: '',
  contact: '',
  password: '',
  confirmPassword: '',
  direction: '',
  agreed: false,
})
const login = reactive({
  account: rememberedAccount,
  password: '',
  remember: Boolean(rememberedAccount),
})
const registrationErrors = reactive({})
const loginErrors = reactive({})
const directions = ['前端开发', '人工智能', '数据分析']
const contactPattern = '(?:[^\\s@]+@[^\\s@]+\\.[^\\s@]+|1[3-9][0-9]{9})'

function normalizeAccount(value) {
  return value.trim().toLowerCase()
}

function updateNickname(value) {
  registration.nickname = value
  revalidateVisibleError(registrationErrors, registrationErrorFor, 'nickname')
}

function updateLoginAccount(value) {
  login.account = value.trim()
  revalidateVisibleError(loginErrors, loginErrorFor, 'account')
}

function contactInputIsValid(inputId) {
  return document.getElementById(inputId)?.checkValidity() ?? false
}

function switchPanel(panel) {
  activePanel.value = panel
  for (const field of Object.keys(registrationErrors)) {
    delete registrationErrors[field]
  }
  for (const field of Object.keys(loginErrors)) {
    delete loginErrors[field]
  }
}

function registrationErrorFor(field) {
  switch (field) {
    case 'nickname':
      if (!registration.nickname.trim()) {
        return '请输入你的昵称。'
      }
      if (registration.nickname.trim().length < 2) {
        return '昵称至少需要 2 个字符。'
      }
      return ''
    case 'contact':
      if (!registration.contact.trim()) {
        return '请输入邮箱或手机号。'
      }
      if (!contactInputIsValid('register-contact')) {
        return '请输入有效的邮箱或中国大陆手机号。'
      }
      return ''
    case 'password':
      if (!registration.password) {
        return '请设置密码。'
      }
      if (registration.password.length < 8 || !/[A-Za-z]/.test(registration.password) || !/\d/.test(registration.password)) {
        return '密码至少 8 位，且同时包含字母和数字。'
      }
      return ''
    case 'confirmPassword':
      if (!registration.confirmPassword) {
        return '请再次输入密码。'
      }
      if (registration.confirmPassword !== registration.password) {
        return '两次输入的密码不一致。'
      }
      return ''
    case 'direction':
      return registration.direction ? '' : '请选择一个学习方向。'
    case 'agreed':
      return registration.agreed ? '' : '请先阅读并同意用户协议。'
    default:
      return ''
  }
}

function loginErrorFor(field) {
  if (field === 'account') {
    if (!login.account.trim()) {
      return '请输入注册时使用的邮箱或手机号。'
    }
    if (!contactInputIsValid('login-account')) {
      return '请输入有效的邮箱或中国大陆手机号。'
    }
  }
  if (field === 'password' && !login.password) {
    return '请输入密码。'
  }
  return ''
}

function validateField(errors, getError, field) {
  const message = getError(field)
  if (message) {
    errors[field] = message
  } else {
    delete errors[field]
  }
  return !message
}

function revalidateVisibleError(errors, getError, field) {
  if (errors[field]) {
    validateField(errors, getError, field)
  }
}

async function validateForm(fieldNames, errors, getError, idPrefix) {
  let firstInvalidField = ''
  for (const field of fieldNames) {
    if (!validateField(errors, getError, field) && !firstInvalidField) {
      firstInvalidField = field
    }
  }
  if (!firstInvalidField) {
    return true
  }

  await nextTick()
  document.getElementById(`${idPrefix}-${firstInvalidField}`)?.focus()
  return false
}

async function submitRegistration() {
  const valid = await validateForm(
    ['nickname', 'contact', 'password', 'confirmPassword', 'direction', 'agreed'],
    registrationErrors,
    registrationErrorFor,
    'register',
  )
  if (!valid || isSubmitting.value) {
    return
  }

  const contact = normalizeAccount(registration.contact)
  if (contact === demoAccount.contact || contact === registeredUser.value?.contact) {
    registrationErrors.contact = '这个账号已注册，请直接登录。'
    document.getElementById('register-contact')?.focus()
    return
  }

  isSubmitting.value = true
  try {
    const user = {
      nickname: registration.nickname.trim(),
      contact,
      direction: registration.direction,
      passwordDigest: await digestPassword(registration.password),
    }
    saveRegisteredUser(user)
    registeredUser.value = user
    activeUser.value = user
    registration.password = ''
    registration.confirmPassword = ''
    Toast.success('注册成功，欢迎来到知序 AI！')
  } catch {
    Toast.error('演示数据保存失败，请通过 localhost 或 HTTPS 打开页面，并允许浏览器存储。')
  } finally {
    isSubmitting.value = false
  }
}

async function submitLogin() {
  const valid = await validateForm(
    ['account', 'password'],
    loginErrors,
    loginErrorFor,
    'login',
  )
  if (!valid || isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  try {
    const account = normalizeAccount(login.account)
    const user = account === demoAccount.contact ? demoAccount : registeredUser.value
    const matchesAccount = user?.contact === account
    const matchesPassword = user === demoAccount
      ? login.password === demoAccount.password
      : matchesAccount && await digestPassword(login.password) === user.passwordDigest

    if (!matchesAccount || !matchesPassword) {
      loginErrors.password = '账号或密码不正确，请检查后重试。'
      Toast.error('登录失败，请检查账号和密码。')
      return
    }

    saveRememberedAccount(login.remember ? account : '')
    activeUser.value = user
    login.password = ''
    Toast.success(`欢迎回来，${user.nickname}！`)
  } catch {
    Toast.error('暂时无法完成登录，请通过 localhost 或 HTTPS 打开页面。')
  } finally {
    isSubmitting.value = false
  }
}

function logout() {
  activeUser.value = null
  activePanel.value = 'login'
  login.password = ''
  Toast.info('已退出演示学习空间。')
}

function showForgotPassword() {
  Toast.info('这是前端演示：暂不发送找回邮件，请使用演示账号或刚注册的账号登录。')
}
</script>

<template>
  <main class="auth-page">
    <div class="page-shell">
      <section class="story-panel" aria-label="知序 AI 产品介绍">
        <div class="story-glow story-glow-one"></div>
        <div class="story-glow story-glow-two"></div>

        <div class="brand brand-light">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 3.5 19.4 12.6 28.5 16l-9.1 3.4L16 28.5l-3.4-9.1L3.5 16l9.1-3.4L16 3.5Z" fill="currentColor" />
              <circle cx="16" cy="16" r="3.2" fill="#252467" />
            </svg>
          </span>
          <span>知序<span class="brand-ai">AI</span></span>
        </div>

        <div class="story-content">
          <div class="eyebrow"><span class="eyebrow-dot"></span> YOUR PERSONAL LEARNING COPILOT</div>
          <h1>每一次提问，<br /><em>都离答案更近。</em></h1>
          <p class="story-description">一个懂你学习节奏的 AI 助教。把难题拆成小步，让好奇心一路向前。</p>

          <div class="artwork" aria-hidden="true">
            <div class="orbit orbit-one"></div>
            <div class="orbit orbit-two"></div>
            <div class="art-spark art-spark-one">✦</div>
            <div class="art-spark art-spark-two">✳</div>

            <div class="question-card">
              <div class="card-avatar">问</div>
              <div>
                <span class="card-caption">正在探索</span>
                <strong>这个知识点，能讲得更简单吗？</strong>
              </div>
            </div>

            <div class="answer-card">
              <div class="answer-heading"><span class="answer-icon">✦</span> 知序 AI 助教 <span class="answer-status">在线</span></div>
              <div class="answer-lines"><i></i><i></i><i></i></div>
              <div class="answer-footer"><span>把复杂，讲明白</span><span>↗</span></div>
            </div>

            <div class="float-chip float-chip-one">✧ 随时答疑</div>
            <div class="float-chip float-chip-two">◈ 个性路径</div>
          </div>

          <div class="story-bottom">
            <span class="online-avatars" aria-hidden="true"><b>林</b><b>周</b><b>陈</b></span>
            <span>和更多学习者一起，把问题变成进步</span>
          </div>
        </div>
        <p class="story-footnote">LEARN WITH CURIOSITY · GROW WITH CLARITY</p>
      </section>

      <section class="form-panel" aria-label="账号注册和登录">
        <div class="mobile-brand brand">
          <span class="brand-mark" aria-hidden="true">✦</span><span>知序<span class="brand-ai">AI</span></span>
        </div>

        <div v-if="activeUser" class="success-view" role="status">
          <div class="success-symbol" aria-hidden="true">✦</div>
          <Tag color="green" size="large">已进入学习空间</Tag>
          <h2>你好，{{ activeUser.nickname }}！</h2>
          <p>新的探索，从一个好问题开始。</p>
          <div class="profile-card">
            <span class="profile-avatar">{{ activeUser.nickname.slice(0, 1) }}</span>
            <div><strong>{{ activeUser.nickname }}</strong><small>{{ activeUser.direction }} · 个性化学习方向</small></div>
          </div>
          <div class="first-step">
            <span class="first-step-icon">↗</span>
            <div><strong>你的第一步</strong><p>试着提出一个正在困扰你的问题，AI 助教会陪你拆解思路。</p></div>
          </div>
          <Button type="primary" theme="solid" size="large" block @click="logout">退出演示空间</Button>
          <span class="demo-footnote">这是前端模拟首页，不会连接真实 AI 服务。</span>
        </div>

        <div v-else class="form-content">
          <div class="form-topline"><span class="topline-icon">✦</span> 为好奇心留个位置</div>
          <div class="heading-group">
            <h2>{{ activePanel === 'register' ? '开启你的学习新旅程' : '欢迎回来，继续探索' }}</h2>
            <p>{{ activePanel === 'register' ? '创建账号，遇见更懂你的 AI 助教。' : '登录知序 AI，让灵感接着上次继续。' }}</p>
          </div>

          <div class="auth-tabs" role="tablist" aria-label="选择注册或登录">
            <button id="tab-register" type="button" role="tab" :aria-selected="activePanel === 'register'" aria-controls="panel-register" :tabindex="activePanel === 'register' ? 0 : -1" :class="{ active: activePanel === 'register' }" @click="switchPanel('register')">注册账号</button>
            <button id="tab-login" type="button" role="tab" :aria-selected="activePanel === 'login'" aria-controls="panel-login" :tabindex="activePanel === 'login' ? 0 : -1" :class="{ active: activePanel === 'login' }" @click="switchPanel('login')">已有账号登录</button>
          </div>

          <form v-if="activePanel === 'register'" id="panel-register" class="auth-form" role="tabpanel" aria-labelledby="tab-register" novalidate @submit.prevent="submitRegistration">
            <div class="form-row">
              <div class="field">
                <label for="register-nickname">你的昵称 <span aria-hidden="true">*</span></label>
                <Input id="register-nickname" :value="registration.nickname" name="nickname" size="large" placeholder="怎么称呼你？" :maxlength="20" required aria-label="你的昵称" :validate-status="registrationErrors.nickname ? 'error' : 'default'" aria-required="true" :aria-invalid="Boolean(registrationErrors.nickname)" aria-describedby="register-nickname-help" @blur="validateField(registrationErrors, registrationErrorFor, 'nickname')" @change="updateNickname" />
                <small id="register-nickname-help" class="field-help" :class="{ 'is-error': registrationErrors.nickname }">{{ registrationErrors.nickname || '给助教一个熟悉的称呼' }}</small>
              </div>
              <div class="field">
                <label for="register-contact">邮箱或手机号 <span aria-hidden="true">*</span></label>
                <input id="register-contact" v-model.trim="registration.contact" name="contact" type="text" autocomplete="username" required :pattern="contactPattern" placeholder="example@email.com" :aria-invalid="Boolean(registrationErrors.contact)" aria-describedby="register-contact-help" @blur="validateField(registrationErrors, registrationErrorFor, 'contact')" @input="revalidateVisibleError(registrationErrors, registrationErrorFor, 'contact')" />
                <small id="register-contact-help" class="field-help" :class="{ 'is-error': registrationErrors.contact }">{{ registrationErrors.contact || '用于登录你的学习账号' }}</small>
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label for="register-password">设置密码 <span aria-hidden="true">*</span></label>
                <div class="password-wrap">
                  <input id="register-password" v-model="registration.password" name="password" :type="showRegisterPassword ? 'text' : 'password'" autocomplete="new-password" required minlength="8" maxlength="64" placeholder="至少 8 位，含字母和数字" :aria-invalid="Boolean(registrationErrors.password)" aria-describedby="register-password-help" @blur="validateField(registrationErrors, registrationErrorFor, 'password')" @input="revalidateVisibleError(registrationErrors, registrationErrorFor, 'password')" />
                  <button type="button" class="visibility-button" :aria-label="showRegisterPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showRegisterPassword" @click="showRegisterPassword = !showRegisterPassword">{{ showRegisterPassword ? '隐藏' : '显示' }}</button>
                </div>
                <small id="register-password-help" class="field-help" :class="{ 'is-error': registrationErrors.password }">{{ registrationErrors.password || '字母与数字组合，更安心' }}</small>
              </div>
              <div class="field">
                <label for="register-confirmPassword">确认密码 <span aria-hidden="true">*</span></label>
                <div class="password-wrap">
                  <input id="register-confirmPassword" v-model="registration.confirmPassword" name="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" autocomplete="new-password" required minlength="8" placeholder="再输入一次密码" :aria-invalid="Boolean(registrationErrors.confirmPassword)" aria-describedby="register-confirmPassword-help" @blur="validateField(registrationErrors, registrationErrorFor, 'confirmPassword')" @input="revalidateVisibleError(registrationErrors, registrationErrorFor, 'confirmPassword')" />
                  <button type="button" class="visibility-button" :aria-label="showConfirmPassword ? '隐藏确认密码' : '显示确认密码'" :aria-pressed="showConfirmPassword" @click="showConfirmPassword = !showConfirmPassword">{{ showConfirmPassword ? '隐藏' : '显示' }}</button>
                </div>
                <small id="register-confirmPassword-help" class="field-help" :class="{ 'is-error': registrationErrors.confirmPassword }">{{ registrationErrors.confirmPassword || '确认你的输入没有笔误' }}</small>
              </div>
            </div>

            <fieldset class="direction-fieldset" :aria-describedby="registrationErrors.direction ? 'register-direction-error' : undefined">
              <legend>你想先探索哪个方向？ <span aria-hidden="true">*</span></legend>
              <p>我们会据此准备更贴近你的学习建议</p>
              <div class="direction-options">
                <label v-for="(direction, index) in directions" :key="direction" class="direction-option" :class="{ selected: registration.direction === direction }">
                  <input :id="index === 0 ? 'register-direction' : undefined" v-model="registration.direction" type="radio" name="direction" :value="direction" required @change="validateField(registrationErrors, registrationErrorFor, 'direction')" />
                  <span class="direction-glyph" aria-hidden="true">{{ ['⌘', '✧', '◈'][index] }}</span>
                  <span>{{ direction }}</span>
                </label>
              </div>
              <small v-if="registrationErrors.direction" id="register-direction-error" class="field-help is-error">{{ registrationErrors.direction }}</small>
            </fieldset>

            <div class="agreement-row">
              <input id="register-agreed" v-model="registration.agreed" type="checkbox" name="agreed" required :aria-invalid="Boolean(registrationErrors.agreed)" aria-describedby="register-agreed-help" @change="validateField(registrationErrors, registrationErrorFor, 'agreed')" />
              <span><label for="register-agreed">我已阅读并同意</label> <button type="button" class="text-link" @click="Toast.info('演示页面：用户协议与隐私政策仅作界面展示。')">《用户协议》</button> 和 <button type="button" class="text-link" @click="Toast.info('演示页面：不会向服务器传输个人信息。')">《隐私政策》</button></span>
            </div>
            <small v-if="registrationErrors.agreed" id="register-agreed-help" class="field-help is-error agreement-error">{{ registrationErrors.agreed }}</small>

            <Button class="submit-button" html-type="submit" type="primary" theme="solid" size="large" block :loading="isSubmitting">创建免费账号 <span aria-hidden="true">↗</span></Button>
            <p class="switch-hint">已经有账号？ <button type="button" class="text-link" @click="switchPanel('login')">立即登录</button></p>
          </form>

          <form v-else id="panel-login" class="auth-form login-form" role="tabpanel" aria-labelledby="tab-login" novalidate @submit.prevent="submitLogin">
            <div class="field">
              <label for="login-account">邮箱或手机号 <span aria-hidden="true">*</span></label>
              <Input id="login-account" :value="login.account" name="account" size="large" placeholder="输入你的账号" required :pattern="contactPattern" aria-label="邮箱或手机号" :validate-status="loginErrors.account ? 'error' : 'default'" aria-required="true" :aria-invalid="Boolean(loginErrors.account)" aria-describedby="login-account-help" @blur="validateField(loginErrors, loginErrorFor, 'account')" @change="updateLoginAccount" />
              <small v-if="loginErrors.account" id="login-account-help" class="field-help is-error">{{ loginErrors.account }}</small>
            </div>
            <div class="field">
              <div class="label-line"><label for="login-password">密码 <span aria-hidden="true">*</span></label><button type="button" class="text-link" @click="showForgotPassword">忘记密码？</button></div>
              <div class="password-wrap">
                <input id="login-password" v-model="login.password" name="password" :type="showLoginPassword ? 'text' : 'password'" autocomplete="current-password" required placeholder="输入你的密码" :aria-invalid="Boolean(loginErrors.password)" aria-describedby="login-password-help" @blur="validateField(loginErrors, loginErrorFor, 'password')" @input="revalidateVisibleError(loginErrors, loginErrorFor, 'password')" />
                <button type="button" class="visibility-button" :aria-label="showLoginPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showLoginPassword" @click="showLoginPassword = !showLoginPassword">{{ showLoginPassword ? '隐藏' : '显示' }}</button>
              </div>
              <small v-if="loginErrors.password" id="login-password-help" class="field-help is-error">{{ loginErrors.password }}</small>
            </div>
            <label class="remember-row"><input v-model="login.remember" type="checkbox" name="remember" /> <span>记住我的账号</span></label>
            <Button class="submit-button" html-type="submit" type="primary" theme="solid" size="large" block :loading="isSubmitting">登录学习空间 <span aria-hidden="true">↗</span></Button>
            <p class="switch-hint">还没有账号？ <button type="button" class="text-link" @click="switchPanel('register')">立即注册</button></p>
            <div class="demo-account"><span class="demo-account-icon">✦</span><div><strong>想先体验？使用演示账号</strong><span>{{ demoAccount.contact }} <span class="demo-dot">·</span> {{ demoAccount.password }}</span></div></div>
          </form>

          <p class="form-footer">© 2026 知序 AI · 让学习更有方向</p>
        </div>
      </section>
    </div>
  </main>
</template>
