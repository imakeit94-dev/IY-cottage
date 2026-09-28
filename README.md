# 我们的小屋

一个纯 HTML / CSS / JavaScript 的静态生日网站。无需安装依赖、无需构建，也不需要环境变量。

状态切换的视觉节奏集中在 `motion.js` 顶部的 `TRANSITION` 参数中；四季 × 三时段的背景与小屋环境光晕集中在 `living-transitions.css`，便于继续微调而不影响页面结构。

季节机位固定为：Spring → `Hero_View`、Summer → `Right_3Q`、Autumn → `Left_3Q`、Winter → `Center_Front`。Day / Sunset / Night 只更换同机位下的光照素材，不改变视角；序章继续使用 `Hero_View`。

## 本地预览

直接打开 `index.html` 可以预览。为了模拟线上部署，建议在本目录启动任意静态文件服务器，然后访问根路径。

## GitHub

将本目录中的全部内容作为仓库根目录提交：

- `index.html`
- `*.css`
- `*.js`
- `assets/`
- `favicon.svg`
- `vercel.json`
- `.gitignore`
- `README.md`

不要上传工作区中的测试脚本、历史截图、Blender 文件或其他 `outputs` 内容。

## Vercel

- Framework Preset：`Other`
- Root Directory：仓库根目录
- Build Command：留空
- Output Directory：`.`
- Install Command：留空
- Environment Variables：不需要

## 音频替换

最终音频使用相同文件名覆盖 `assets/audio/` 中的文件即可：

- `background-music.mp3`
- `guitar_spring.mp3`
- `guitar_summer.mp3`
- `guitar_autumn.mp3`
- `guitar_winter.mp3`

## 上线检查

- 根路径能够显示序章。
- “回家”进入 Spring / Night / Weather Off。
- 四季、三个时段和 Weather 可组合切换。
- Music 默认不自动播放，点击后可以播放和暂停。
- 四季吉他音频映射正确，换季时旧音频停止。
- 门廊灯、窗户、吉他、书架和桌上书可点击。
- 375px、390px、430px 手机竖屏无需缩放。
- 刷新根路径后图片、音频、CSS、JS 均无 404。
