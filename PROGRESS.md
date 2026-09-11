# CV Generator — 進度記錄

> 最後更新：2026-06-04  
> 使用者已大量 **Reject／回退** 先前改版（含 40 骨架、skeleton 系統、References 預設等）。以下以**目前工作區實際狀態**為準。

---

## 目前架構（回退後）

| 項目 | 狀態 |
|------|------|
| 版型 | `src/templates/` — 約 40 個 **preset**（`data-preset` + `data-layout-family`） |
| 預覽渲染 | `src/main.jsx` 內嵌 CV DOM（非獨立 `CvSkeletonLayout`） |
| 預設資料 | `reference/default_resume.json` → `npm run sync:defaults` → `public/default_template.json` |
| 樣式 | `index.css` + `presets-v21-v40.css` + `src/templates/templates-layer.css` |

---

## 已完成（仍保留的改動方向）

- 解決螢幕預覽與 PDF 匯出排版不一致問題（2026-07-06）：移除 `@media print` 與 `body.cv-print-mode` 中強制改為 system-ui 字型、40px 邊距、固定橘色語言條等覆蓋，使 PDF 與螢幕預覽字型與邊距完全一致。
- Template 註冊／`templateId`、官方主題色與使用者 Fine-Tuning 分離（若回退後仍存在）
- 移除個人 JSON 預設，改引導式 `default_resume.json`
- 主欄區塊標題錨點（灰底 + 左色條）— 見 `index.css` MAIN COLUMN SECTION ANCHORS

---

## 已回退／未合併（對話中做過但使用者 Reject）

- 40 個 **skeleton** + `CvSkeletonLayout` + `skeletons.css`
- 全骨架 **References** 區、`referenceStyle`（sidebar-card / grid-two-col）
- 照片 placeholder、溢出 `overflow-x: clip` 等 skeleton 專用修復
- 預設 `sections.references: true` 與雙推薦人範例（若 `default_resume.json` 亦被還原則需重做）

---

## 已知問題（待修）

### P0 — 所有側欄左緣「直線穿字」（使用者回報 2026-06-04）

**現象：** 左欄（或窄欄）左側出現多段不連續直線，與 Certifications、Notes、技能標籤等文字重疊。  
**根因（兩段）：**  
1. 主欄 **float** 時：側欄較矮，主欄下方內容佔滿整頁寬，`border-left` 類元素貼左緣（穿線）。  
2. 主欄 **Grid 同列等高** 時：側欄背景被拉滿主欄高度，第 2、3 頁右側出現空白色帶。  

**修復（現行）：** `display: flow-root` + **側欄先於主欄 DOM** + **側欄 float**；主欄在側欄高度以下**自動擴展全寬**（不再用固定 `margin-right` 鎖死欄寬）。ATS `layout-direction-block` 仍用 flex。學歷區塊加 `break-inside: avoid` 減少標題與校名分頁。

### 其他（先前對話，優先級較低）

- 40 款 preset 視覺仍偏相似（同一主欄標題灰底條）
- References 結構未普及（Canva 範本：側欄底部推薦人）
- 部分 preset 出界／顯示不完整
- 無照片時側欄空白

---

## 凍結約定

| Template | 說明 |
|----------|------|
| **`modern-tech`（Preset 12）** | `legacyPreview: true` — **永遠走 `main.jsx` 現有預覽 DOM**，不套用 `layouts/` 結構引擎。見 `src/layouts/legacy.js`。 |

## Canva 級差異（已接上）

- `src/layouts/`：12 種結構 layout + `CvLayoutRenderer` + `layouts.css`
- `main.jsx`：`usesLegacyPreview` → `LegacyCvPreview`；其餘 → `CvLayoutRenderer`
- `.cv-page[data-layout-id]` 關閉舊版主欄灰底標題條，改用 `SectionHead` 樣式

## 下一步建議

1. ✅ 修 Grid 側欄（本輪）
2. 實作 `CvLayoutRenderer` 時：`template.usesLegacyPreview ? 現有 JSX : <CvLayoutRenderer />`
3. 驗證：長 Employment + Key Project Deliveries + 側欄 Certifications

---

## 驗證指令

```bash
npm run dev
```

切換 **Corporate Navy**、**Navy Flip Side (左欄)**，使用含大量專案條目的履歷，捲到第一頁 A4 斷點以下檢查左緣是否仍有直線。
