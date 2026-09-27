# 我们的小屋 · 一起慢慢过四季

一份纯静态的生日网页：一间下雪也会亮着灯的小屋。四季 × 白天 / 黄昏 / 夜晚 共 12 种画面，
可切换天气粒子，进站先播一段序章，点「回家」推进到屋前；屋里能开灯、拨吉他、看看窗，
右上角有背景音乐开关。

**技术栈：原生 HTML + CSS + JavaScript，零依赖、零构建。** 没有框架、没有打包器、
没有 `package.json`，双击 `index.html` 就能跑。

---

## 目录结构

```
.
├── index.html              # 入口（唯一页面，含 12 组文案）
├── motion.css              # 全部样式：动效、天气粒子、序章版式、移动端媒体查询
├── motion.js               # 全部逻辑：预载/切换、天气、序章、音乐与三处互动
├── assets/
│   ├── <season>_<time>.webp   # 12 张 1500×1280 渲染图（spring/summer/autumn/winter × day/sunset/night）
│   └── audio/
│       ├── bgm.wav            # 背景音乐（16 秒无缝循环垫音，首选）
│       ├── bgm.mp3            # 背景音乐后备（体积小，放了正式音乐就用它）
│       ├── guitar.mp3         # 吉他拨弦音效
│       └── README.txt         # 换音乐 / 调音量的说明
├── 首页原型说明.md            # 设计说明：动效、天气、序章、互动的实现细节与实测数值
└── README.md                  # 本文件
```

## 本地预览

- 直接双击 `index.html` 即可。
- 想更接近线上环境（`http://` 而非 `file://`）：
  ```bash
  python -m http.server 8000
  # 然后打开 http://127.0.0.1:8000
  ```

URL 支持调试参数：`?season=winter&time=night&weather=on&prologue=off`。

---

## 部署到 Vercel

### 方式 A：网页导入（推荐，最省事）

1. 把本目录的全部内容推到 GitHub 仓库的**根目录**。
2. 打开 [vercel.com/new](https://vercel.com/new)，选 **Import Git Repository**，授权并选中该仓库。
3. 框架预设选 **Other**（会自动识别为静态站点）。
4. **Build Command 留空**，**Output Directory 留空**（或用默认值）。
5. 点 **Deploy**。约 10 秒后拿到 `https://<项目名>.vercel.app`。

### 方式 B：命令行

```bash
npm i -g vercel
cd 本目录
vercel          # 预览部署
vercel --prod   # 正式部署
```

---

## 上线参数速查

| 项目 | 值 |
| --- | --- |
| 项目类型 | **纯静态站点**（原生 HTML/CSS/JS，无框架、无构建步骤） |
| Build Command | **留空**（没有构建过程；若表单强制要求，填 `echo no build`） |
| Output Directory | **留空**（源码目录即产物目录；若表单强制要求，填 `.`） |
| Install Command | 留空 / 关闭 |
| Framework Preset | `Other` |
| Node 版本 | 不需要（Vercel 只做静态文件托管） |
| 环境变量 | **不需要**，一个都不用填 |
| Root Directory | 若仓库根就是本目录，保持默认；若把本目录放在子目录里，填该子目录名 |

---

## 常见改动

**换背景音乐**：把文件放进 `assets/audio/` 并命名 `bgm.mp3`，然后把 `motion.js` 里的
`bgm: ['assets/audio/bgm.wav', 'assets/audio/bgm.mp3']` 改为 `bgm: ['assets/audio/bgm.mp3']`。
（默认优先 wav 是因为实测 mp3 每 16 秒循环会多出约 33ms 断口；正式音乐首尾自然衔接，
不受此影响。详见 `assets/audio/README.txt`。）

**换吉他音效**：覆盖 `assets/audio/guitar.mp3` 即可，不用改代码。

**调音量**：`motion.js` 顶部 `AUDIO_LEVEL`（`bgm: .20`、`guitar: .40`）。

**想让搜索引擎收录**：删掉 `index.html` 里这一行即可——
`<meta name="robots" content="noindex,nofollow">`。默认关闭收录，是给私人礼物留的隐私设置。

---

## 上线检查清单

- [ ] 仓库根目录就是 `index.html` 所在目录（上传的是本目录的**内容**，不是它的外层文件夹）
- [ ] `assets/` 完整上传，12 张 `.webp` 一个不少
- [ ] `assets/audio/` 完整上传
- [ ] 文件名大小写与代码里一致（Linux 服务器区分大小写；本项目的引用全为小写）
- [ ] 没有绝对路径（本项目全部为 `assets/...` 相对路径，已核验）
- [ ] Vercel 部署后打开首页，12 种组合都切换一遍
- [ ] 序章正常播出，「回家」推进后落在 Spring · Night
- [ ] 晴天/雨天/落叶/飘雪四组天气粒子都出现
- [ ] 点 MUSIC 能出声，再点能暂停
- [ ] 灯 / 吉他 / 窗三处点击都有反应
- [ ] **刷新页面**后图片、音乐、样式仍正常（重点验证：不是靠缓存假象）
- [ ] 手机真机打开：不用缩放，小屋完整，底部控件点得到
- [ ] Chrome / Safari / 微信内置浏览器各试一次

---

## 资源体积

| 资源 | 优化前 | 优化后 | 说明 |
| --- | --- | --- | --- |
| 12 张 WebP | 993 KB | 612 KB | 质量 88 重编码，PSNR ≥ 46 dB（视觉无损） |
| 吉他音效 | 190 KB | 18 KB | WAV → MP3 |
| 背景音乐 | 1000 KB | 1000 KB | 保留无缝 WAV（理由见上） |
| CSS + JS | 50 KB | 50 KB | 未压缩，未混淆（保持可读、便于你自己改） |

**首屏实际下载量约 230 KB**：`index.html` + `motion.css` + `motion.js` + 2 张图
（当前状态图 + 序章用图）。音频是 `preload="none"`，只在点 MUSIC / 拨吉他时才下载，
不占用首屏；其余 10 张图在切换时才按需预载。
