# 我们的小屋

一个纯 HTML / CSS / JavaScript 的静态生日网站。无需安装依赖、无需构建，也不需要环境变量。

状态切换的视觉节奏集中在 `motion.js` 顶部的 `TRANSITION` 参数中；四季 × 三时段的背景与小屋环境光晕集中在 `living-transitions.css`，便于继续微调而不影响页面结构。

季节机位固定为：Spring → `Hero_View`、Summer → `Right_3Q`、Autumn → `Left_3Q`、Winter → `Winter_Right_View`。Winter 使用绕小屋中心约 +24° 的真正右前方机位；Day / Sunset / Night 只更换同机位下的光照，不改变视角。序章继续使用 `Hero_View`。

## 本地预览

直接打开 `index.html` 可以预览。为了模拟线上部署，建议在本目录启动任意静态文件服务器，然后访问根路径。

## 实时 3D 技术验证

实时 3D 是默认体验。正常访问根路径即可加载同一个 GLB，并保留静态图片作为 WebGL 或模型加载失败时的自动 fallback。

`?preview3d=1&season=summer&time=day`

即可跳过序章直接进入实时 3D 调试预览。Spring / Summer / Autumn / Winter 与 Day / Sunset / Night 均由同一个 GLB 实例组合生成，不会替换或重新加载房屋模型。时间完整过渡为 2100ms，季节完整过渡为 1650ms。需要单独检查旧静态版本时可使用 `?realtime3d=0`。

预览使用本地随项目发布的 Three.js 和 `assets/models/summer_day_cottage.glb`，不依赖 CDN；模型或 WebGL 加载失败时会自动恢复原来的静态图片。

实时参数集中在 `realtime3d.js` 顶部：

- `TIME_TRANSITION_MS`：时间过渡时长
- `TIME_OF_DAY.day / sunset / night.sunlightIntensity`：太阳强度
- `sunlightColor` 与 `sunPosition`：太阳颜色和方向
- `environmentIntensity / environmentColor / groundColor`：环境光
- `windowEmission`：窗户发光
- `porchEmission`：门廊灯发光
- `background / halo / haloOpacity`：网页背景与模型环境光晕
- `SEASON_TRANSITION_MS`：季节过渡时长
- `SEASON_STATE.spring / summer / autumn / winter`：树冠、地面、环境色和季节点缀参数

季节附加元素由运行时低成本几何生成：春花和秋叶分别使用一个 `InstancedMesh`，冬季使用一个雪地层和一个从现有屋顶向上表面提取的雪层。Weather 仍是独立 HTML 粒子层，可与任意季节和时段组合。

实时模式会先显示“小屋正在醒来。”，模型准备完成后再淡入序章；若模型或 WebGL 不可用，会静默回到原静态版本。冬季树冠由同一棵树的叶团 Morph 逐步减少，`Tree_Trunk` 与整棵树的缩放始终保持不变。

## 统一过渡时间轴

`transition-controller.js` 是季节与时段切换的唯一时钟。每次切换产生一条共享的 `0 → 1` progress，页面与 Three.js 同时读取它：

- `motion.js`：文案错峰、左右布局 FLIP、天气粒子交叉淡化。
- `realtime3d.js`：相机 position / lookAt 弧线、模型旋转、树冠与地面材质、季节 Morph、太阳与环境光、窗灯与门灯、背景、halo 与 fog。

Season 完整时间为 2100ms，Time of Day 为 1900ms。Summer 使用“小屋左 / 文案右”，Spring、Autumn、Winter 使用“文案左 / 小屋右”；手机端继续保持小屋在上、文字在下。

## 生活感细节

`realtime3d.js` 的 `createLifeDetails()` 集中创建轻量生活细节，`animateLife()` 让它们跟随同一条季节 / 时段时间轴：

- Summer 独立缩小约 10% 并左移，文案向右上方让位；其他季节保持各自的稳定构图。
- Winter 使用固定的右侧 3/4 机位，Day / Sunset / Night 不换机位。
- 窗灯与门廊灯按时段柔和增强并轻微呼吸；桌面保留书，并增加一个低模杯子。
- 烟囱轻烟强度按 `Winter > Autumn > Spring > Summer` 排列，Summer 近乎关闭。
- Spring 是树边蝴蝶，Summer Night 是院子萤火虫，Autumn 是树下松鼠，Winter 是门廊小猫；每季只保留一个主角类型。

这些对象全部是运行时低成本几何或 Sprite，不增加第二个 GLB，也不会触发模型重复加载。

## 实时对象互动

`realtime3d.js` 中的 `createObjectPicker()` 使用 Three.js `Raycaster`，同时为小物件提供扩大的隐藏拾取区域：

- `Guitar`：hover 暖色高亮，点击播放当前季节对应音频，1400ms 冷却。
- `Porch_Light`：点击后平滑改变材质发光和局部点光源。
- `Windows`：点击增强暖光，显示“灯一直为你亮着。”，随后缓慢恢复。
- `Piano` / `Bookshelf`：已保留 hover 高亮与 `cottage3d:objectclick` 点击事件。

桌面视差约 ±2.7°，手机端约 ±0.9°；点击物件会有一次轻微推近并自动回到主构图。一个访问周期只加载一次 GLB，季节和时段切换不会替换模型。

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
