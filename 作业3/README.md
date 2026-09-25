# 知序 AI · 注册与登录演示

Vue 3 + Vite 页面，使用基于 Semi Design 设计体系的 `@kousum/semi-ui-vue` 组件。官方 `@douyinfe/semi-ui` 是 React 组件库，因此本项目采用 Vue 3 社区实现，并结合原生 HTML 表单元素。

## 运行

需要 Node.js 20.19+ 或 22.12+。

```bash
cd 作业3
npm install
npm run dev
```

浏览器打开终端提示的本地地址，通常是 `http://localhost:5173/`。执行 `npm run build` 可生成静态预览文件。

## 演示流程

- 注册：填写昵称、邮箱或中国大陆手机号、密码、学习方向，并勾选协议。成功后进入模拟学习空间。
- 登录：可使用刚注册的账号，或演示账号 `student@zhixu.ai` / `Study2026`。
- 退出后可继续测试登录；“记住我”只保存账号，不保存登录状态。
- “忘记密码”、协议和隐私政策入口会说明演示范围，不会发送邮件或访问后端。

注册数据保存在当前浏览器的 `localStorage` 中，密码仅存储用于本地比对的 SHA-256 摘要。**这不是安全的真实鉴权方案**，请勿用真实密码测试。浏览器清理站点数据后，演示注册账号会消失。密码摘要依赖 Web Crypto，因此请通过 `localhost` 或 HTTPS 访问。
