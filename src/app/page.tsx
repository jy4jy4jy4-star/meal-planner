'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Recipe, MealPlan } from '@/lib/types'

const CMAP: Record<string, string> = {
  '鶏もも肉': '肉・魚', '鶏むね肉': '肉・魚', '豚ロース': '肉・魚', '豚肉': '肉・魚', '牛肉': '肉・魚',
  'サバ': '肉・魚', '鮭': '肉・魚', 'たら': '肉・魚', 'ぶり': '肉・魚', 'えび': '肉・魚',
  '卵': '乳製品・卵', 'バター': '乳製品・卵', '牛乳': '乳製品・卵', 'チーズ': '乳製品・卵', '生クリーム': '乳製品・卵',
  '玉ねぎ': '野菜', 'にんじん': '野菜', 'じゃがいも': '野菜', '生姜': '野菜', 'ニンニク': '野菜',
  'キャベツ': '野菜', 'ほうれん草': '野菜', 'トマト': '野菜', 'なす': '野菜', 'ブロッコリー': '野菜',
  '長ねぎ': '野菜', 'もやし': '野菜', '小松菜': '野菜', 'れんこん': '野菜', '大根': '野菜',
  '醤油': '調味料', '味噌': '調味料', 'みりん': '調味料', '砂糖': '調味料', '塩': '調味料',
  'こしょう': '調味料', '酒': '調味料', 'コンソメ': '調味料', 'ごま油': '調味料',
  'オリーブ油': '調味料', 'サラダ油': '調味料', 'だし': '調味料', '酢': '調味料', 'ローズマリー': '調味料',
}

const DEFAULT_RECIPES: Recipe[] = [
  { id: 1, name: 'ヘルシオ蒸し鶏', type: 'healsio', servings: 2, time: '25分', mode: 'まかせて調理 > 蒸す', ingredients: ['鶏もも肉 300g', '塩 小さじ1/2', 'こしょう 少々', '生姜 1かけ', '酒 大さじ1'], steps: ['鶏もも肉を一口大に切り、塩・こしょうで下味をつける。', '生姜を薄切りにし、鶏肉と一緒に耐熱皿に並べる。', '酒をふりかけ、ヘルシオの角皿にのせる。', '「まかせて調理 > 蒸す」で加熱する。', 'お好みでポン酢やごまだれを添えて完成。'] },
  { id: 2, name: 'ローストポーク', type: 'healsio', servings: 2, time: '60分', mode: 'まかせて調理 > 焼く', ingredients: ['豚ロース 500g', 'ニンニク 2かけ', 'ローズマリー 2枝', '塩 小さじ1', 'こしょう 少々', 'オリーブ油 大さじ1'], steps: ['豚ロースに塩・こしょうをすり込み、30分ほどおく。', 'ニンニクをスライスし、豚肉に刺し込む。', 'オリーブ油を全体に塗り、ローズマリーをのせる。', 'ヘルシオの角皿にのせ「まかせて調理 > 焼く」で加熱する。', '竹串を刺して透明な汁が出ればOK。10分休ませてからスライスする。'] },
  { id: 3, name: '野菜たっぷりスープ', type: 'healsio', servings: 2, time: '30分', mode: 'まかせて調理 > 煮る', ingredients: ['玉ねぎ 1個', 'にんじん 1本', 'じゃがいも 2個', 'コンソメ 2個', '水 600ml', '塩こしょう 少々'], steps: ['玉ねぎ・にんじん・じゃがいもを一口大に切る。', '耐熱容器に野菜と水・コンソメを入れる。', 'ヘルシオの庫内に入れ「まかせて調理 > 煮る」で加熱する。', '塩こしょうで味を調えて完成。'] },
  { id: 4, name: 'サバの味噌煮', type: 'normal', servings: 2, time: '25分', mode: '', ingredients: ['サバ 2切れ', '味噌 大さじ2', 'みりん 大さじ2', '砂糖 大さじ1', '生姜 1かけ', '醤油 小さじ1', '水 100ml'], steps: ['サバに熱湯をかけて臭みを取り、水気を拭く。', '鍋に水・みりん・砂糖・醤油を入れて中火で煮立てる。', 'サバと薄切り生姜を加え、落とし蓋をして10分煮る。', '味噌を溶き入れ、さらに5分煮詰めて完成。'] },
  { id: 5, name: '肉じゃが', type: 'normal', servings: 2, time: '35分', mode: '', ingredients: ['牛肉 200g', 'じゃがいも 3個', '玉ねぎ 1個', '醤油 大さじ3', 'みりん 大さじ3', '砂糖 大さじ2', 'だし 300ml', 'サラダ油 大さじ1'], steps: ['じゃがいもを一口大、玉ねぎをくし切りに切る。', '油を熱し牛肉を炒め、色が変わったら野菜を加える。', 'だし・醤油・みりん・砂糖を加えて中火で煮る。', '落とし蓋をして弱火で15分、じゃがいもに火が通れば完成。'] },
  { id: 6, name: 'ほうれん草のおひたし', type: 'normal', servings: 2, time: '10分', mode: '', ingredients: ['ほうれん草 1束', '醤油 大さじ1', 'だし 大さじ2', 'かつお節 適量'], steps: ['ほうれん草を塩茹でし、水にさらして水気を絞る。', '食べやすい長さに切り、醤油とだしを混ぜたたれで和える。', '器に盛り、かつお節をのせて完成。'] },
]

function toDateKey(date: Date): string {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function fromInputValue(str: string): Date {
  const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d)
}
function getDayLabel(date: Date): string {
  const dow = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return dow + ' ' + (date.getMonth() + 1) + '/' + date.getDate()
}
function parseAmount(str: string): { value: number; unit: string } | null {
  const m = str.match(/^([\d./]+)\s*([^\d\s].*)$/)
  if (m) {
    let val: number
    if (m[1].includes('/')) { const p = m[1].split('/'); val = parseFloat(p[0]) / parseFloat(p[1]) }
    else val = parseFloat(m[1])
    return { value: val, unit: m[2].trim() }
  }
  return null
}
function scaleIngredient(ingStr: string, baseServings: number, persons: number): string {
  const ratio = persons / baseServings
  if (ratio === 1) return ingStr
  const spaceIdx = ingStr.indexOf(' ')
  if (spaceIdx === -1) return ingStr
  const name = ingStr.slice(0, spaceIdx)
  const amountStr = ingStr.slice(spaceIdx + 1).trim()
  const parsed = parseAmount(amountStr)
  if (!parsed) return ingStr
  const scaled = parsed.value * ratio
  const scaledStr = Number.isInteger(scaled) ? String(scaled) : (Math.round(scaled * 10) / 10).toString()
  return `${name} ${scaledStr}${parsed.unit}`
}
function categorize(name: string): string {
  for (const [k, v] of Object.entries(CMAP)) { if (name.includes(k)) return v }
  return 'その他'
}
function guessTagsTS(recipe: any) {
  const allText = (recipe.name || '') + ' ' + (recipe.mode || '') + ' ' + (recipe.ingredients || []).join(' ')
  let course = '主菜'
  if (/汁|スープ|みそ汁|味噌汁|ポタージュ|豚汁|けんちん/.test(allText)) course = '汁物'
  else if (/サラダ|おひたし|和え|漬け|きんぴら|酢の物|ナムル|小鉢/.test(allText)) course = '副菜'
  let cuisine = '和'
  if (/オリーブ|バター|チーズ|ワイン|クリーム|トマト|パスタ|ロースト|グラタン/.test(allText)) cuisine = '洋'
  if (/豆板醤|オイスター|ごま油|中華|チンジャオ|餃子|八宝菜|麻婆/.test(allText)) cuisine = '中'
  if (/醤油|みりん|だし|味噌|おひたし|煮物|照り焼き|唐揚/.test(allText)) cuisine = '和'
  let method = '他'
  if (/焼く|焼き|ロースト|グリル|ソテー|炒め/.test(allText) || /焼/.test(recipe.mode || '')) method = '焼'
  if (/煮る|煮物|煮込み|シチュー|スープ|汁/.test(allText) || /煮/.test(recipe.mode || '')) method = '煮'
  if (/蒸す|蒸し/.test(allText) || /蒸/.test(recipe.mode || '')) method = '蒸'
  if (/揚げ|フライ|天ぷら|から揚げ|唐揚/.test(allText)) method = '揚'
  let protein = '他'
  if (/豚|ポーク|ばら|ロース/.test(allText)) protein = '豚'
  if (/鶏|チキン|ささみ|から揚げ|唐揚/.test(allText)) protein = '鶏'
  if (/牛|ビーフ/.test(allText)) protein = '牛'
  if (/合いびき|ひき肉|ミンチ|ハンバーグ/.test(allText)) protein = '挽'
  if (/サバ|鮭|たら|ぶり|あじ|まぐろ|えび|いか|魚|ツナ/.test(allText)) protein = '魚'
  return { course, cuisine, method, protein }
}

export default function Home() {
  const initialized = useRef(false)
  const nextIdRef = useRef(7)

  const saveData = useCallback(async (recipes: Recipe[], mealPlan: MealPlan) => {
    try {
      await Promise.all([
        fetch('/api/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipes) }),
        fetch('/api/mealplan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mealPlan) }),
      ])
      const el = document.getElementById('save-indicator')
      if (el) { el.textContent = '保存しました'; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2000) }
    } catch { console.error('save failed') }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    async function init() {
      const [recipesRes, mealPlanRes] = await Promise.all([
        fetch('/api/recipes').then(r => r.json()).catch(() => []),
        fetch('/api/mealplan').then(r => r.json()).catch(() => ({})),
      ])
      const loadedRecipes: Recipe[] = recipesRes.length > 0 ? recipesRes : DEFAULT_RECIPES

      let needsSave = false
      const migratedRecipes = loadedRecipes.map((r: any) => {
        if (!r.tags || !r.tags.course) { r.tags = guessTagsTS(r); needsSave = true }
        return r
      })
      if (needsSave) {
        fetch('/api/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(migratedRecipes) }).catch(() => {})
      }
      if (migratedRecipes.length > 0) nextIdRef.current = Math.max(...migratedRecipes.map((r: Recipe) => r.id)) + 1
      ;(window as any).saveDataFn = saveData
      ;(window as any).nextIdRef = nextIdRef
      injectApp(migratedRecipes, mealPlanRes, CMAP)
    }
    init()
  }, [saveData])

  return (
    <>
      <div id="app-root" />
      <div id="save-indicator" className="save-indicator">保存しました</div>
    </>
  )
}function injectApp(initialRecipes: Recipe[], initialMealPlan: MealPlan, cmap: Record<string, string>) {
  const root = document.getElementById('app-root')
  if (!root) return
  root.innerHTML = `
<div class="container">
  <header><h1>週間献立プランナー</h1><p>ヘルシオ AX-LSX3C 対応</p></header>
  <div class="nav">
    <button class="nav-btn active" onclick="showScreen('planner',this)">献立計画</button>
    <button class="nav-btn" onclick="showScreen('shopping',this)">買い物リスト</button>
    <button class="nav-btn" onclick="showScreen('cooking',this)">調理モード</button>
    <button class="nav-btn" onclick="showScreen('recipes',this)">レシピ管理</button>
  </div>
  <div id="screen-planner" class="screen active">
    <div class="week-nav">
      <span class="week-nav-label">起点日：</span>
      <input class="week-date-input" type="date" id="week-start-input" onchange="onWeekStartChange(this.value)">
      <button class="week-nav-btn" onclick="shiftWeek(-7)">← 前の週</button>
      <button class="week-nav-btn" onclick="shiftWeek(7)">次の週 →</button>
      <button class="week-nav-btn" onclick="goToToday()">今日を含む週</button>
      <span class="week-range" id="week-range-label"></span>
    </div>
    <div class="week-header">
      <div></div>
      <div class="day-label" id="d0"></div><div class="day-label" id="d1"></div>
      <div class="day-label" id="d2"></div><div class="day-label" id="d3"></div>
      <div class="day-label" id="d4"></div><div class="day-label" id="d5"></div>
      <div class="day-label" id="d6"></div>
    </div>
    <div class="week-grid" id="week-grid"></div>
    <div class="week-actions">
      <button class="btn-primary" onclick="generateShoppingList()">買い物リストを生成</button>
    </div>
  </div>
  <div id="screen-shopping" class="screen">
    <div id="shop-empty" class="empty-state-box">
      献立からまだ買い物リストが生成されていません。<br>
      「献立計画」でレシピを選んでから「買い物リストを生成」を押してください。<br><br>
      <button class="btn-primary" onclick="showScreen('planner',document.querySelectorAll('.nav-btn')[0])">献立計画へ</button>
    </div>
    <div id="shop-content" style="display:none;">
      <div class="shop-header">
        <div><div class="shop-title">今週の買い物リスト</div><div class="shop-meta" id="shop-meta"></div></div>
        <div class="shop-actions">
          <button class="btn-secondary btn-sm" onclick="resetChecks()">チェックをリセット</button>
          <button class="btn-secondary btn-sm" onclick="clearAllShop()">リストを削除</button>
        </div>
      </div>
      <div class="progress-bar"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>
      <div id="shop-categories"></div>
      <hr class="divider">
      <div class="form-hint">食材を手動で追加</div>
      <div class="add-item-row">
        <input class="add-item-input" type="text" placeholder="食材名" id="manual-item" onkeydown="if(event.key==='Enter')addManualItem()">
        <input class="add-item-input" style="max-width:100px;" type="text" placeholder="分量（例:100g）" id="manual-amount">
        <select class="add-item-select" id="manual-cat">
          <option value="肉・魚">肉・魚</option><option value="野菜">野菜</option>
          <option value="調味料">調味料</option><option value="乳製品・卵">乳製品・卵</option><option value="その他">その他</option>
        </select>
        <button class="add-item-btn" onclick="addManualItem()">追加</button>
      </div>
    </div>
  </div>
  <div id="screen-cooking" class="screen">
    <div id="cook-list">
      <div class="cook-list-title">今週の調理予定</div>
      <div id="cook-plan-content"></div>
    </div>
    <div id="cook-detail" class="cook-detail">
      <button class="cook-back" onclick="closeCookDetail()">← 一覧に戻る</button>
      <div class="cook-recipe-name" id="cd-name"></div>
      <div class="cook-recipe-sub">
        <span class="tag" id="cd-tag"></span>
        <span class="persons-badge" id="cd-persons"></span>
        <span style="font-size:13px;color:#888;" id="cd-time"></span>
      </div>
      <div id="cd-healsio-box"></div>
      <div class="cook-sections">
        <div class="cook-section">
          <div class="cook-section-title">材料</div>
          <ul class="ing-list" id="cd-ingredients"></ul>
        </div>
        <div class="cook-section">
          <div class="cook-section-title">進捗</div>
          <div id="cd-recipe-img-box"></div>
          <div class="cook-progress-box">
            <div class="cook-progress-num" id="cd-progress-num">0/0</div>
            <div class="cook-progress-label" id="cd-progress-label">手順をタップしてチェック</div>
          </div>
          <div class="progress-bar" style="margin-top:10px;"><div class="progress-fill" id="cd-progress-fill" style="width:0%"></div></div>
        </div>
      </div>
      <div class="steps-title">手順</div>
      <div id="cd-steps"></div>
      <div class="cook-nav-btns">
        <button class="btn-primary" id="cd-next-btn" onclick="nextStep()">次の手順へ</button>
        <button class="btn-secondary" onclick="resetSteps()">最初からやり直す</button>
      </div>
    </div>
  </div>
  <div id="screen-recipes" class="screen">
    <div class="import-section">
      <h3>レシピを追加</h3>
      <div class="import-tabs">
        <button class="import-tab active" onclick="switchImportTab('claude',this)">Claudeから追加</button>
        <button class="import-tab" onclick="switchImportTab('manual',this)">手動入力</button>
      </div>
      <div id="import-panel-claude" class="import-panel active">
        <div class="claude-import-steps">
          <div class="claude-step"><div class="claude-step-num">1</div><div class="claude-step-body"><div class="claude-step-title">Claudeのチャットでレシピを依頼する</div><div class="claude-step-desc">「〇〇のレシピをJSONで出力して」と依頼してください。</div></div></div>
          <div class="claude-step"><div class="claude-step-num">2</div><div class="claude-step-body"><div class="claude-step-title">出力されたJSONをここに貼り付ける</div>
            <textarea class="ai-area" id="json-input" placeholder="ClaudeのJSONをここに貼り付け" style="margin-top:10px;min-height:120px;"></textarea>
            <div id="json-preview" style="display:none;" class="json-preview"></div>
            <div style="display:flex;gap:8px;margin-top:10px;">
              <button class="btn-import" onclick="previewJson()">内容を確認する</button>
              <button class="btn-secondary btn-sm" onclick="document.getElementById('json-input').value='';document.getElementById('json-preview').style.display='none';">クリア</button>
            </div>
          </div></div>
          <div class="claude-step"><div class="claude-step-num">3</div><div class="claude-step-body"><div class="claude-step-title">確認して登録する</div>
            <button class="btn-import" id="json-register-btn" onclick="registerJson()" style="margin-top:8px;display:none;">レシピを登録する</button>
          </div></div>
        </div>
        <div class="claude-format-box">
          <div class="claude-format-title">JSONフォーマット（参考）</div>
          <pre class="claude-format-code">{"name":"レシピ名","type":"healsio or normal","servings":2,"time":"30分","mode":"まかせて調理 > 焼く","tags":{"course":"主菜","cuisine":"和","method":"焼","protein":"鶏"},"ingredients":["食材 分量"],"steps":["手順1","手順2"]}</pre>
          <button class="btn-secondary btn-sm" onclick="copyFormat()">フォーマットをコピー</button>
          <span id="copy-msg" style="font-size:11px;color:#166534;margin-left:8px;display:none;">コピーしました</span>
        </div>
      </div>
      <div id="import-panel-manual" class="import-panel">
        <div class="input-row">
          <input class="inp" type="text" placeholder="レシピ名 *" id="m-name">
          <select class="inp-sm" id="m-type"><option value="healsio">ヘルシオ</option><option value="normal">通常</option></select>
          <select class="inp-sm" id="m-servings"><option value="1">1人分基準</option><option value="2" selected>2人分基準</option><option value="3">3人分基準</option><option value="4">4人分基準</option></select>
        </div>
        <div class="input-row">
          <select class="inp-sm" id="m-course"><option value="">種別</option><option>主菜</option><option>副菜</option><option>汁物</option></select>
          <select class="inp-sm" id="m-cuisine"><option value="">系統</option><option>和</option><option>洋</option><option>中</option><option>他</option></select>
          <select class="inp-sm" id="m-method"><option value="">調理法</option><option>焼</option><option>煮</option><option>蒸</option><option>揚</option><option>他</option></select>
          <select class="inp-sm" id="m-protein"><option value="">主食材</option><option>豚</option><option>鶏</option><option>牛</option><option>挽</option><option>魚</option><option>他</option></select>
        </div>
        <div class="input-row">
          <input class="inp" type="text" placeholder="材料（カンマ区切り）例: 鶏もも肉 300g, 塩 小さじ1/2" id="m-ingredients">
          <input class="inp-sm" style="width:90px;" type="text" placeholder="時間" id="m-time">
        </div>
        <div class="input-row"><input class="inp" type="text" placeholder="ヘルシオ調理モード（例: まかせて調理 > 焼く）" id="m-mode"></div>
        <div class="input-row"><textarea class="inp" style="min-height:80px;resize:vertical;" placeholder="手順（1行ずつ）" id="m-steps"></textarea></div>
        <button class="btn-import" onclick="manualAdd()">登録する</button>
      </div>
    </div>
    <div class="recipes-topbar">
      <span style="font-size:12px;color:#888;" id="recipe-count"></span>
      <button class="btn-secondary btn-sm" onclick="exportRecipes()">JSONエクスポート</button>
    </div>
    <div class="recipe-filters">
      <div class="filter-row">
        <span class="filter-row-label">種別</span>
        <div class="filter-tabs" id="ft-type">
          <button class="filter-tab active" onclick="setTagFilter('type','all',this)">すべて</button>
          <button class="filter-tab" onclick="setTagFilter('type','healsio',this)">ヘルシオ</button>
          <button class="filter-tab" onclick="setTagFilter('type','normal',this)">通常</button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-row-label">料理種別</span>
        <div class="filter-tabs" id="ft-course">
          <button class="filter-tab active" onclick="setTagFilter('course','all',this)">すべて</button>
          <button class="filter-tab" onclick="setTagFilter('course','主菜',this)">主菜</button>
          <button class="filter-tab" onclick="setTagFilter('course','副菜',this)">副菜</button>
          <button class="filter-tab" onclick="setTagFilter('course','汁物',this)">汁物</button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-row-label">料理系統</span>
        <div class="filter-tabs" id="ft-cuisine">
          <button class="filter-tab active" onclick="setTagFilter('cuisine','all',this)">すべて</button>
          <button class="filter-tab" onclick="setTagFilter('cuisine','和',this)">和</button>
          <button class="filter-tab" onclick="setTagFilter('cuisine','洋',this)">洋</button>
          <button class="filter-tab" onclick="setTagFilter('cuisine','中',this)">中</button>
          <button class="filter-tab" onclick="setTagFilter('cuisine','他',this)">他</button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-row-label">調理法</span>
        <div class="filter-tabs" id="ft-method">
          <button class="filter-tab active" onclick="setTagFilter('method','all',this)">すべて</button>
          <button class="filter-tab" onclick="setTagFilter('method','焼',this)">焼</button>
          <button class="filter-tab" onclick="setTagFilter('method','煮',this)">煮</button>
          <button class="filter-tab" onclick="setTagFilter('method','蒸',this)">蒸</button>
          <button class="filter-tab" onclick="setTagFilter('method','揚',this)">揚</button>
          <button class="filter-tab" onclick="setTagFilter('method','他',this)">他</button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-row-label">主食材</span>
        <div class="filter-tabs" id="ft-protein">
          <button class="filter-tab active" onclick="setTagFilter('protein','all',this)">すべて</button>
          <button class="filter-tab" onclick="setTagFilter('protein','豚',this)">豚</button>
          <button class="filter-tab" onclick="setTagFilter('protein','鶏',this)">鶏</button>
          <button class="filter-tab" onclick="setTagFilter('protein','牛',this)">牛</button>
          <button class="filter-tab" onclick="setTagFilter('protein','挽',this)">挽</button>
          <button class="filter-tab" onclick="setTagFilter('protein','魚',this)">魚</button>
          <button class="filter-tab" onclick="setTagFilter('protein','他',this)">他</button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-row-label">調理時間</span>
        <div style="display:flex;align-items:center;gap:10px;flex:1;">
          <input type="range" id="time-slider" min="5" max="120" step="5" value="120" oninput="onTimeSlider(this.value)" style="flex:1;max-width:200px;">
          <span id="time-slider-label" style="font-size:12px;color:#555;min-width:60px;">制限なし</span>
          <button class="filter-tab active" id="time-reset-btn" onclick="resetTimeFilter()" style="font-size:11px;padding:3px 10px;">リセット</button>
        </div>
      </div>
    </div>
    <input class="recipe-search-bar" type="text" id="recipe-search" placeholder="レシピ名で検索..." oninput="renderRecipeGrid()">
    <div class="recipe-grid" id="recipe-grid"></div>
  </div>
</div>
<div class="modal-overlay" id="recipe-detail-overlay">
  <div class="modal recipe-detail-modal">
    <div class="modal-header">
      <h3 id="rd-modal-title">レシピ詳細</h3>
      <button class="modal-close" onclick="closeRecipeDetail()">✕</button>
    </div>
    <div class="modal-body" id="rd-modal-body"></div>
  </div>
</div>
<div class="modal-overlay" id="modal-overlay">
  <div class="modal" style="width:540px;">
    <div class="modal-header">
      <h3 id="modal-title">レシピを追加</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <input class="search-box" type="text" placeholder="レシピ名で検索..." id="modal-search" oninput="filterModalRecipes()">
      <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;background:#f5f5f0;border-radius:8px;padding:8px 10px;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;color:#888;font-weight:600;min-width:44px;">種別</span>
          <div class="filter-tabs" id="mf-type">
            <button class="filter-tab active" onclick="setModalTagFilter('type','all',this)">すべて</button>
            <button class="filter-tab" onclick="setModalTagFilter('type','healsio',this)">ヘルシオ</button>
            <button class="filter-tab" onclick="setModalTagFilter('type','normal',this)">通常</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;color:#888;font-weight:600;min-width:44px;">料理種別</span>
          <div class="filter-tabs" id="mf-course">
            <button class="filter-tab active" onclick="setModalTagFilter('course','all',this)">すべて</button>
            <button class="filter-tab" onclick="setModalTagFilter('course','主菜',this)">主菜</button>
            <button class="filter-tab" onclick="setModalTagFilter('course','副菜',this)">副菜</button>
            <button class="filter-tab" onclick="setModalTagFilter('course','汁物',this)">汁物</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;color:#888;font-weight:600;min-width:44px;">系統</span>
          <div class="filter-tabs" id="mf-cuisine">
            <button class="filter-tab active" onclick="setModalTagFilter('cuisine','all',this)">すべて</button>
            <button class="filter-tab" onclick="setModalTagFilter('cuisine','和',this)">和</button>
            <button class="filter-tab" onclick="setModalTagFilter('cuisine','洋',this)">洋</button>
            <button class="filter-tab" onclick="setModalTagFilter('cuisine','中',this)">中</button>
            <button class="filter-tab" onclick="setModalTagFilter('cuisine','他',this)">他</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;color:#888;font-weight:600;min-width:44px;">調理法</span>
          <div class="filter-tabs" id="mf-method">
            <button class="filter-tab active" onclick="setModalTagFilter('method','all',this)">すべて</button>
            <button class="filter-tab" onclick="setModalTagFilter('method','焼',this)">焼</button>
            <button class="filter-tab" onclick="setModalTagFilter('method','煮',this)">煮</button>
            <button class="filter-tab" onclick="setModalTagFilter('method','蒸',this)">蒸</button>
            <button class="filter-tab" onclick="setModalTagFilter('method','揚',this)">揚</button>
            <button class="filter-tab" onclick="setModalTagFilter('method','他',this)">他</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;color:#888;font-weight:600;min-width:44px;">主食材</span>
          <div class="filter-tabs" id="mf-protein">
            <button class="filter-tab active" onclick="setModalTagFilter('protein','all',this)">すべて</button>
            <button class="filter-tab" onclick="setModalTagFilter('protein','豚',this)">豚</button>
            <button class="filter-tab" onclick="setModalTagFilter('protein','鶏',this)">鶏</button>
            <button class="filter-tab" onclick="setModalTagFilter('protein','牛',this)">牛</button>
            <button class="filter-tab" onclick="setModalTagFilter('protein','挽',this)">挽</button>
            <button class="filter-tab" onclick="setModalTagFilter('protein','魚',this)">魚</button>
            <button class="filter-tab" onclick="setModalTagFilter('protein','他',this)">他</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;color:#888;font-weight:600;min-width:44px;">時間</span>
          <input type="range" id="modal-time-slider" min="5" max="120" step="5" value="120" oninput="onModalTimeSlider(this.value)" style="flex:1;max-width:160px;">
          <span id="modal-time-label" style="font-size:11px;color:#555;min-width:55px;">制限なし</span>
          <button class="filter-tab active" id="modal-time-reset" onclick="resetModalTime()" style="font-size:10px;padding:2px 8px;">リセット</button>
        </div>
      </div>
      <div class="recipe-list" id="modal-recipe-list"></div>
    </div>
    <div class="modal-footer">
      <p class="form-hint">新しいレシピをすぐ追加</p>
      <div class="form-row">
        <input class="inp" type="text" placeholder="レシピ名" id="quick-name">
        <select class="inp-sm" id="quick-type"><option value="healsio">ヘルシオ</option><option value="normal">通常</option></select>
        <button class="btn-import" onclick="quickAdd()">追加</button>
      </div>
    </div>
  </div>
</div>
`
  const script = document.createElement('script')
  script.textContent = buildScript(initialRecipes, initialMealPlan, cmap)
  document.body.appendChild(script)
}function buildScript(initialRecipes: Recipe[], initialMealPlan: MealPlan, cmap: Record<string, string>): string {
  return `
(function() {
var recipes = ${JSON.stringify(initialRecipes)};
var mealPlan = ${JSON.stringify(initialMealPlan)};
var nextId = ${Math.max(...initialRecipes.map(r => r.id), 6) + 1};
var shoppingList = [];
var currentModalKey = null;
var pendingJsonRecipes = [];
var currentCookRecipe = null, currentCookPersons = 2, stepStates = [];
var weekStart = null;
var MEALS = ['昼','夜'];
var CATEGORIES = ['肉・魚','野菜','調味料','乳製品・卵','穀物・豆・乾物','その他'];
var CMAP = ${JSON.stringify(cmap)};
var tagFilters = {type:'all',course:'all',cuisine:'all',method:'all',protein:'all'};
var timeFilterMax = 120;
var modalTagFilters = {type:'all',course:'all',cuisine:'all',method:'all',protein:'all'};
var modalTimeMax = 120;

function scheduleSave(){
  if(window._st)clearTimeout(window._st);
  window._st=setTimeout(function(){if(window.saveDataFn)window.saveDataFn(recipes,mealPlan);},1000);
}
function saveShoppingList(){try{localStorage.setItem('meal-planner-shopping',JSON.stringify(shoppingList));}catch(e){}}
function loadShoppingList(){try{var s=localStorage.getItem('meal-planner-shopping');if(s){shoppingList=JSON.parse(s);if(shoppingList.length>0)renderShoppingList();}}catch(e){}}

function toDateKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function addDays(d,n){var r=new Date(d);r.setDate(r.getDate()+n);return r;}
function fromInputValue(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);}
function getDayLabel(d){return ['日','月','火','水','木','金','土'][d.getDay()]+' '+(d.getMonth()+1)+'/'+d.getDate();}
function getWeekDates(){return Array.from({length:7},function(_,i){return addDays(weekStart,i);});}
function parseAmount(str){var m=str.match(/^([\d.\\/]+)\\s*([^\\d\\s].*)$/);if(m){var val;if(m[1].includes('/')){var p=m[1].split('/');val=parseFloat(p[0])/parseFloat(p[1]);}else val=parseFloat(m[1]);return{value:val,unit:m[2].trim()};}return null;}
function scaleIng(ing,base,persons){var ratio=persons/base;if(ratio===1)return ing;var si=ing.indexOf(' ');if(si===-1)return ing;var name=ing.slice(0,si),amt=ing.slice(si+1).trim(),p=parseAmount(amt);if(!p)return ing;var sc=p.value*ratio,ss=Number.isInteger(sc)?String(sc):(Math.round(sc*10)/10).toString();return name+' '+ss+p.unit;}
function categorize(name){for(var k in CMAP){if(name.includes(k))return CMAP[k];}return 'その他';}
function guessTimeMinutes(t){if(!t)return null;var m=t.match(/(\\d+)/);return m?parseInt(m[1]):null;}
function guessTags(r){
  var allText=(r.name||'')+' '+(r.mode||'')+' '+(r.ingredients||[]).join(' ');
  var course='主菜';
  if(/汁|スープ|みそ汁|味噌汁|ポタージュ|豚汁|けんちん/.test(allText))course='汁物';
  else if(/サラダ|おひたし|和え|漬け|きんぴら|酢の物|ナムル|小鉢/.test(allText))course='副菜';
  var cuisine='和';
  if(/オリーブ|バター|チーズ|ワイン|クリーム|トマト|パスタ|ロースト|グラタン/.test(allText))cuisine='洋';
  if(/豆板醤|オイスター|ごま油|中華|チンジャオ|餃子|八宝菜|麻婆/.test(allText))cuisine='中';
  if(/醤油|みりん|だし|味噌|おひたし|煮物|照り焼き|唐揚/.test(allText))cuisine='和';
  var method='他';
  if(/焼く|焼き|ロースト|グリル|ソテー|炒め/.test(allText)||/焼/.test(r.mode||''))method='焼';
  if(/煮る|煮物|煮込み|シチュー|スープ|汁/.test(allText)||/煮/.test(r.mode||''))method='煮';
  if(/蒸す|蒸し/.test(allText)||/蒸/.test(r.mode||''))method='蒸';
  if(/揚げ|フライ|天ぷら|から揚げ|唐揚/.test(allText))method='揚';
  var protein='他';
  if(/豚|ポーク|ばら|ロース/.test(allText))protein='豚';
  if(/鶏|チキン|ささみ|から揚げ|唐揚/.test(allText))protein='鶏';
  if(/牛|ビーフ/.test(allText))protein='牛';
  if(/合いびき|ひき肉|ミンチ|ハンバーグ/.test(allText))protein='挽';
  if(/サバ|鮭|たら|ぶり|あじ|まぐろ|えび|いか|魚|ツナ/.test(allText))protein='魚';
  return{course:course,cuisine:cuisine,method:method,protein:protein};
}
recipes=recipes.map(function(r){if(!r.tags||!r.tags.course)r.tags=guessTags(r);return r;});

function initWeekStart(){var t=new Date();weekStart=new Date(t.getFullYear(),t.getMonth(),t.getDate());document.getElementById('week-start-input').value=toDateKey(weekStart);refreshWeek();}
function onWeekStartChange(val){if(!val)return;weekStart=fromInputValue(val);refreshWeek();}
window.onWeekStartChange=onWeekStartChange;
function shiftWeek(days){weekStart=addDays(weekStart,days);document.getElementById('week-start-input').value=toDateKey(weekStart);refreshWeek();}
window.shiftWeek=shiftWeek;
function goToToday(){var t=new Date();weekStart=new Date(t.getFullYear(),t.getMonth(),t.getDate());document.getElementById('week-start-input').value=toDateKey(weekStart);refreshWeek();}
window.goToToday=goToToday;
function refreshWeek(){initWeekHeaders();renderGrid();}
function initWeekHeaders(){var dates=getWeekDates(),today=new Date();today.setHours(0,0,0,0);dates.forEach(function(d,i){var el=document.getElementById('d'+i);el.textContent=getDayLabel(d);el.classList.toggle('today',d.getTime()===today.getTime());});var last=getWeekDates()[6];document.getElementById('week-range-label').textContent=(weekStart.getMonth()+1)+'/'+weekStart.getDate()+' 〜 '+(last.getMonth()+1)+'/'+last.getDate();}

function getCellData(key){if(!mealPlan[key])mealPlan[key]={persons:2,recipeIds:[]};return mealPlan[key];}
function renderGrid(){
  var grid=document.getElementById('week-grid');grid.innerHTML='';
  var dates=getWeekDates();
  MEALS.forEach(function(meal){
    var lbl=document.createElement('div');lbl.className='meal-label';lbl.textContent=meal;grid.appendChild(lbl);
    dates.forEach(function(date){
      var key=toDateKey(date)+'-'+meal;
      var cell=document.createElement('div');cell.className='meal-cell';
      var data=mealPlan[key],persons=data?data.persons:2,recipeIds=data?data.recipeIds:[];
      var cellRecipes=recipeIds.map(function(id){return recipes.find(function(r){return r.id===id;});}).filter(Boolean);
      if(cellRecipes.length>0)cell.classList.add('has-recipes');
      var topDiv=document.createElement('div');topDiv.className='cell-top';
      var sel=document.createElement('select');sel.className='person-select';
      [1,2,3,4].forEach(function(n){var opt=document.createElement('option');opt.value=n;opt.textContent=n+'人';if(n===persons)opt.selected=true;sel.appendChild(opt);});
      sel.onchange=function(e){e.stopPropagation();getCellData(key).persons=parseInt(e.target.value);scheduleSave();renderGrid();};
      sel.onclick=function(e){e.stopPropagation();};
      topDiv.appendChild(sel);cell.appendChild(topDiv);
      var chipsDiv=document.createElement('div');chipsDiv.className='recipe-chips';
      cellRecipes.forEach(function(r){
        var chip=document.createElement('div');chip.className='recipe-chip';
        chip.innerHTML='<span class="chip-name">'+r.name+'</span><span class="chip-tag tag '+r.type+'">'+(r.type==='healsio'?'ヘルシオ':'通常')+'</span><span class="chip-del">✕</span>';
        chip.querySelector('.chip-del').onclick=function(e){e.stopPropagation();removeRecipeFromCell(key,r.id);};
        chipsDiv.appendChild(chip);
      });
      var addBtn=document.createElement('div');addBtn.className='add-recipe-btn';addBtn.textContent='+ レシピを追加';
      var dow=['日','月','火','水','木','金','土'][date.getDay()];
      addBtn.onclick=function(e){e.stopPropagation();openModal(key,dow,meal);};
      chipsDiv.appendChild(addBtn);cell.appendChild(chipsDiv);grid.appendChild(cell);
    });
  });
}
function removeRecipeFromCell(key,rid){if(!mealPlan[key])return;mealPlan[key].recipeIds=mealPlan[key].recipeIds.filter(function(id){return id!==rid;});if(mealPlan[key].recipeIds.length===0)delete mealPlan[key];scheduleSave();renderGrid();renderCookList();}

function generateShoppingList(){
  var entries=Object.entries(mealPlan).filter(function(e){return e[1].recipeIds&&e[1].recipeIds.length>0;});
  if(!entries.length){alert('献立にレシピが登録されていません。');return;}
  var itemMap={};
  entries.forEach(function(e){
    var key=e[0],data=e[1],persons=data.persons;
    var li=key.lastIndexOf('-'),meal=key.slice(li+1),dateStr=key.slice(0,li);
    var dp=dateStr.split('-').map(Number),d=new Date(dp[0],dp[1]-1,dp[2]);
    var dow=['日','月','火','水','木','金','土'][d.getDay()];
    data.recipeIds.forEach(function(rid){
      var r=recipes.find(function(x){return x.id===rid;});if(!r)return;
      var ratio=persons/(r.servings||2);
      (r.ingredients||[]).forEach(function(ingStr){
        var si=ingStr.indexOf(' '),iname=si===-1?ingStr:ingStr.slice(0,si),amtStr=si===-1?'':ingStr.slice(si+1).trim();
        var cat=categorize(iname),label=dow+'曜'+meal+' '+r.name;
        if(!itemMap[iname])itemMap[iname]={name:iname,category:cat,checked:false,amounts:{},noAmounts:[],recipes:[]};
        itemMap[iname].recipes.push(label);
        if(!amtStr){itemMap[iname].noAmounts.push('');return;}
        var parsed=parseAmount(amtStr);
        if(!parsed){itemMap[iname].noAmounts.push(amtStr);return;}
        var sv=Math.round(parsed.value*ratio*10)/10;
        if(!itemMap[iname].amounts[parsed.unit])itemMap[iname].amounts[parsed.unit]=0;
        itemMap[iname].amounts[parsed.unit]+=sv;
      });
    });
  });
  shoppingList=Object.values(itemMap).map(function(item,i){
    var parts=Object.entries(item.amounts).map(function(e){var v=Number.isInteger(e[1])?e[1]:Math.round(e[1]*10)/10;return v+e[0];});
    var uniq=[...new Set(item.noAmounts.filter(Boolean))];
    if(uniq.length>0)parts.push(uniq.join('・'));else if(parts.length===0)parts.push('適量');
    return{id:i+1,name:item.name,category:item.category,checked:false,amount:parts.join(' + '),recipes:[...new Set(item.recipes)]};
  });
  saveShoppingList();renderShoppingList();
  showScreen('shopping',document.querySelectorAll('.nav-btn')[1]);
}
window.generateShoppingList=generateShoppingList;

function renderShoppingList(){
  var total=shoppingList.length,checked=shoppingList.filter(function(i){return i.checked;}).length,pct=total>0?Math.round(checked/total*100):0;
  document.getElementById('shop-empty').style.display='none';
  document.getElementById('shop-content').style.display='block';
  document.getElementById('shop-meta').textContent=checked+'/'+total+'件 完了';
  document.getElementById('progress-fill').style.width=pct+'%';
  var container=document.getElementById('shop-categories');container.innerHTML='';
  CATEGORIES.forEach(function(cat){
    var items=shoppingList.filter(function(i){return i.category===cat;});if(!items.length)return;
    var sec=document.createElement('div');sec.className='category-section';
    sec.innerHTML='<div class="category-label">'+cat+'</div>';
    items.forEach(function(item){
      var div=document.createElement('div');div.className='shop-item'+(item.checked?' checked':'');
      div.innerHTML='<div class="shop-check">'+(item.checked?'✓':'')+'</div><div class="shop-iname">'+item.name+'</div><div class="shop-iamount">'+item.amount+'</div><div class="shop-irecipes">'+item.recipes.slice(0,2).join('、')+(item.recipes.length>2?'…':'')+'</div><button class="shop-del" data-id="'+item.id+'">✕</button>';
      div.onclick=function(e){if(!e.target.classList.contains('shop-del')){item.checked=!item.checked;saveShoppingList();renderShoppingList();}};
      div.querySelector('.shop-del').onclick=function(e){e.stopPropagation();var id=parseInt(e.target.dataset.id);shoppingList=shoppingList.filter(function(i){return i.id!==id;});saveShoppingList();renderShoppingList();};
      sec.appendChild(div);
    });
    container.appendChild(sec);
  });
}
function addManualItem(){var name=document.getElementById('manual-item').value.trim();if(!name)return;var amount=document.getElementById('manual-amount').value.trim();var maxId=shoppingList.reduce(function(m,i){return Math.max(m,i.id);},0);shoppingList.push({id:maxId+1,name:name,category:document.getElementById('manual-cat').value,checked:false,amount:amount||'適量',recipes:['手動追加']});document.getElementById('manual-item').value='';document.getElementById('manual-amount').value='';saveShoppingList();renderShoppingList();}
window.addManualItem=addManualItem;
function resetChecks(){shoppingList.forEach(function(i){i.checked=false;});saveShoppingList();renderShoppingList();}
window.resetChecks=resetChecks;
function clearAllShop(){shoppingList=[];saveShoppingList();document.getElementById('shop-empty').style.display='block';document.getElementById('shop-content').style.display='none';}
window.clearAllShop=clearAllShop;

function renderCookList(){
  var content=document.getElementById('cook-plan-content');
  var allKeys=Object.keys(mealPlan).filter(function(k){return mealPlan[k].recipeIds&&mealPlan[k].recipeIds.length>0;});
  if(!allKeys.length){content.innerHTML='<div class="empty-state-box">献立計画でレシピを選ぶとここに表示されます。</div>';return;}
  var byDate={};
  allKeys.sort().forEach(function(key){
    var li=key.lastIndexOf('-'),meal=key.slice(li+1),dateKey=key.slice(0,li);
    var dp=dateKey.split('-').map(Number),d=new Date(dp[0],dp[1]-1,dp[2]);
    var dow=['日','月','火','水','木','金','土'][d.getDay()],label=dow+'曜 '+dp[1]+'/'+dp[2];
    if(!byDate[dateKey])byDate[dateKey]={label:label,items:[]};
    byDate[dateKey].items.push({meal:meal,persons:mealPlan[key].persons,recipeIds:mealPlan[key].recipeIds});
  });
  content.innerHTML='';
  Object.entries(byDate).forEach(function(e){
    var info=e[1];
    var sec=document.createElement('div');sec.className='cook-day-section';
    sec.innerHTML='<div class="cook-day-label">'+info.label+'</div>';
    info.items.sort(function(a,b){return a.meal==='昼'?-1:1;}).forEach(function(item){
      var group=document.createElement('div');group.className='cook-meal-group';
      group.innerHTML='<div class="cook-meal-header"><span class="cook-meal-title">'+item.meal+'</span><span class="cook-meal-persons">'+item.persons+'人分</span></div>';
      item.recipeIds.forEach(function(rid){
        var r=recipes.find(function(x){return x.id===rid;});if(!r)return;
        var card=document.createElement('div');card.className='cook-card';
        card.innerHTML='<div class="cook-card-info"><div class="cook-card-name">'+r.name+'</div><div class="cook-card-meta">'+(r.time||'')+(r.mode?' · '+r.mode:'')+' · 基準'+(r.servings||2)+'人分 → <strong>'+item.persons+'人分</strong>で調理</div></div><span class="tag '+r.type+'">'+(r.type==='healsio'?'ヘルシオ':'通常')+'</span><div class="cook-card-arrow">›</div>';
        card.onclick=function(){openCookDetail(r,item.persons);};
        group.appendChild(card);
      });
      sec.appendChild(group);
    });
    content.appendChild(sec);
  });
}

function openCookDetail(recipe,persons){
  currentCookRecipe=recipe;currentCookPersons=persons;stepStates=(recipe.steps||[]).map(function(){return false;});
  document.getElementById('cook-list').style.display='none';
  document.getElementById('cd-name').textContent=recipe.name;
  var tag=document.getElementById('cd-tag');tag.className='tag '+recipe.type;tag.textContent=recipe.type==='healsio'?'ヘルシオ':'通常';
  document.getElementById('cd-persons').textContent=persons+'人分（基準'+(recipe.servings||2)+'人分）';
  document.getElementById('cd-time').textContent=recipe.time||'';
  var hbox=document.getElementById('cd-healsio-box');
  hbox.innerHTML=(recipe.type==='healsio'&&recipe.mode)?'<div class="healsio-mode-box"><div class="healsio-mode-label">ヘルシオ 調理モード</div><div class="healsio-mode-value">'+recipe.mode+'</div></div>':'';
  var imgBox=document.getElementById('cd-recipe-img-box');
  imgBox.innerHTML=recipe.image?'<img src="'+recipe.image+'" alt="'+recipe.name+'" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:10px;">':'';
  var base=recipe.servings||2,ingList=document.getElementById('cd-ingredients');
  ingList.innerHTML=recipe.ingredients&&recipe.ingredients.length?recipe.ingredients.map(function(ing){var scaled=scaleIng(ing,base,persons),si=scaled.indexOf(' '),name=si===-1?scaled:scaled.slice(0,si),amount=si===-1?'':scaled.slice(si+1);return'<li class="ing-item"><span class="ing-name">'+name+'</span><span class="ing-amount'+(scaled!==ing?' ing-amount-scaled':'')+'">'+amount+'</span></li>';}).join(''):'<li class="ing-item" style="color:#aaa;">材料未登録</li>';
  renderSteps();
  document.getElementById('cook-detail').classList.add('active');
}
function renderSteps(){
  var steps=currentCookRecipe.steps||[],done=stepStates.filter(Boolean).length,total=steps.length;
  document.getElementById('cd-progress-num').textContent=done+'/'+total;
  document.getElementById('cd-progress-label').textContent=(done===total&&total>0)?'完成！':'手順をタップしてチェック';
  document.getElementById('cd-progress-fill').style.width=(total>0?Math.round(done/total*100):0)+'%';
  var container=document.getElementById('cd-steps');
  if(!steps.length){container.innerHTML='<div style="color:#aaa;font-size:13px;padding:1rem 0;">手順未登録</div>';return;}
  var firstUndone=stepStates.findIndex(function(s){return !s;});
  container.innerHTML=steps.map(function(step,i){var isDone=stepStates[i],isCurrent=i===firstUndone;return'<div class="step-item'+(isDone?' done':'')+(isCurrent?' current':'')+'" onclick="toggleStep('+i+')"><div class="step-num">'+(isDone?'✓':i+1)+'</div><div class="step-text">'+step+'</div></div>';}).join('');
  var btn=document.getElementById('cd-next-btn');
  if(done===total&&total>0){btn.textContent='完成！お疲れ様でした';btn.disabled=true;btn.style.opacity='.5';}
  else{btn.textContent='次の手順へ';btn.disabled=false;btn.style.opacity='1';}
}
function toggleStep(i){stepStates[i]=!stepStates[i];renderSteps();}
window.toggleStep=toggleStep;
function nextStep(){var i=stepStates.findIndex(function(s){return !s;});if(i>=0){stepStates[i]=true;renderSteps();}}
window.nextStep=nextStep;
function resetSteps(){stepStates=stepStates.map(function(){return false;});renderSteps();}
window.resetSteps=resetSteps;
function closeCookDetail(){document.getElementById('cook-detail').classList.remove('active');document.getElementById('cook-list').style.display='block';currentCookRecipe=null;}
window.closeCookDetail=closeCookDetail;

function switchImportTab(tab,btn){document.querySelectorAll('.import-tab').forEach(function(t){t.classList.remove('active');});document.querySelectorAll('.import-panel').forEach(function(p){p.classList.remove('active');});btn.classList.add('active');document.getElementById('import-panel-'+tab).classList.add('active');}
window.switchImportTab=switchImportTab;
function copyFormat(){var text=document.querySelector('.claude-format-code').textContent;navigator.clipboard.writeText(text).then(function(){var msg=document.getElementById('copy-msg');msg.style.display='inline';setTimeout(function(){msg.style.display='none';},2000);});}
window.copyFormat=copyFormat;
function previewJson(){
  var raw=document.getElementById('json-input').value.trim(),preview=document.getElementById('json-preview'),btn=document.getElementById('json-register-btn');
  pendingJsonRecipes=[];preview.style.display='block';
  if(!raw){preview.innerHTML='<div class="json-preview-error">JSONを貼り付けてください。</div>';btn.style.display='none';return;}
  var parsed;
  try{parsed=JSON.parse(raw.replace(/\`\`\`json\\n?/g,'').replace(/\`\`\`\\n?/g,'').trim());}
  catch(e){try{parsed=JSON.parse('['+raw.replace(/\`\`\`json\\n?/g,'').replace(/\`\`\`\\n?/g,'').trim().replace(/}\\s*{/g,'},{')+']');}catch(e2){preview.innerHTML='<div class="json-preview-error">JSONの形式が正しくありません。</div>';btn.style.display='none';return;}}
  var items=Array.isArray(parsed)?parsed:[parsed],valid=[];
  items.forEach(function(item){if(!item.name)return;if(!['healsio','normal'].includes(item.type))item.type='normal';if(!item.servings||isNaN(item.servings))item.servings=2;if(!Array.isArray(item.ingredients))item.ingredients=[];if(!Array.isArray(item.steps))item.steps=[];valid.push(item);});
  pendingJsonRecipes=valid;
  preview.innerHTML=valid.map(function(r){return'<div class="json-preview-item"><div class="json-preview-name">'+r.name+' <span class="tag '+r.type+'">'+(r.type==='healsio'?'ヘルシオ':'通常')+'</span></div><div class="json-preview-meta">'+(r.time||'')+(r.mode?' · '+r.mode:'')+' · 基準'+r.servings+'人分 · 材料'+r.ingredients.length+'品 · '+r.steps.length+'ステップ</div></div>';}).join('');
  btn.style.display=valid.length>0?'inline-block':'none';
}
window.previewJson=previewJson;
function registerJson(){
  if(!pendingJsonRecipes.length)return;
  var added=[];
  pendingJsonRecipes.forEach(function(r){
    if(recipes.find(function(x){return x.name===r.name;}))return;
    if(!r.tags){r.tags=guessTags(r);}else{var g=guessTags(r);if(!r.tags.course)r.tags.course=g.course;if(!r.tags.cuisine)r.tags.cuisine=g.cuisine;if(!r.tags.method)r.tags.method=g.method;if(!r.tags.protein)r.tags.protein=g.protein;}
    recipes.push(Object.assign({id:nextId++},r));added.push(r.name);
  });
  if(!added.length){alert('すべて登録済みのレシピでした。');return;}
  document.getElementById('json-input').value='';document.getElementById('json-preview').style.display='none';document.getElementById('json-register-btn').style.display='none';pendingJsonRecipes=[];
  scheduleSave();renderRecipeGrid();alert(added.length+'件登録しました。\\n'+added.join('、'));
}
window.registerJson=registerJson;
function manualAdd(){
  var name=document.getElementById('m-name').value.trim();if(!name)return;
  var ing=document.getElementById('m-ingredients').value.trim(),sr=document.getElementById('m-steps').value.trim();
  var r={id:nextId++,name:name,type:document.getElementById('m-type').value,servings:parseInt(document.getElementById('m-servings').value),time:document.getElementById('m-time').value.trim(),mode:document.getElementById('m-mode').value.trim(),ingredients:ing?ing.split(/[,、]/).map(function(s){return s.trim();}).filter(Boolean):[],steps:sr?sr.split('\\n').map(function(s){return s.trim();}).filter(Boolean):[],tags:{course:document.getElementById('m-course').value||null,cuisine:document.getElementById('m-cuisine').value||null,method:document.getElementById('m-method').value||null,protein:document.getElementById('m-protein').value||null}};
  var g=guessTags(r);if(!r.tags.course)r.tags.course=g.course;if(!r.tags.cuisine)r.tags.cuisine=g.cuisine;if(!r.tags.method)r.tags.method=g.method;if(!r.tags.protein)r.tags.protein=g.protein;
  recipes.push(r);
  ['m-name','m-ingredients','m-time','m-mode','m-steps'].forEach(function(id){document.getElementById(id).value='';});
  scheduleSave();renderRecipeGrid();alert('レシピを登録しました。');
}
window.manualAdd=manualAdd;

function setTagFilter(key,val,btn){tagFilters[key]=val;var group=btn.closest('.filter-tabs');if(group)group.querySelectorAll('.filter-tab').forEach(function(t){t.classList.remove('active');});btn.classList.add('active');renderRecipeGrid();}
window.setTagFilter=setTagFilter;
function onTimeSlider(val){timeFilterMax=parseInt(val);document.getElementById('time-slider-label').textContent=timeFilterMax>=120?'制限なし':timeFilterMax+'分以内';renderRecipeGrid();}
window.onTimeSlider=onTimeSlider;
function resetTimeFilter(){timeFilterMax=120;document.getElementById('time-slider').value=120;document.getElementById('time-slider-label').textContent='制限なし';renderRecipeGrid();}
window.resetTimeFilter=resetTimeFilter;

function renderRecipeGrid(){
  var grid=document.getElementById('recipe-grid');
  var q=(document.getElementById('recipe-search')?.value||'').toLowerCase();
  var filtered=recipes.filter(function(r){
    if(tagFilters.type!=='all'&&r.type!==tagFilters.type)return false;
    if(tagFilters.course!=='all'&&r.tags?.course!==tagFilters.course)return false;
    if(tagFilters.cuisine!=='all'&&r.tags?.cuisine!==tagFilters.cuisine)return false;
    if(tagFilters.method!=='all'&&r.tags?.method!==tagFilters.method)return false;
    if(tagFilters.protein!=='all'&&r.tags?.protein!==tagFilters.protein)return false;
    if(timeFilterMax<120){var mins=guessTimeMinutes(r.time);if(mins!==null&&mins>timeFilterMax)return false;}
    if(q&&!r.name.toLowerCase().includes(q))return false;
    return true;
  });
  document.getElementById('recipe-count').textContent=filtered.length+' / '+recipes.length+'件';
  if(!filtered.length){grid.innerHTML='<div style="color:#aaa;font-size:13px;">条件に合うレシピが見つかりません</div>';return;}
  grid.innerHTML=filtered.map(function(r){var tags=r.tags||{};return'<div class="recipe-card" onclick="openRecipeDetail('+r.id+')"><div class="rc-del" onclick="event.stopPropagation();deleteRecipe('+r.id+')">✕</div>'+(r.image?'<img class="rc-img" src="'+r.image+'" alt="'+r.name+'">'+'':'<div class="rc-img-placeholder" onclick="event.stopPropagation();triggerImageUpload('+r.id+')">＋ 写真を追加</div>')+'<span class="tag '+r.type+'" style="margin-bottom:6px;display:inline-block;">'+(r.type==='healsio'?'ヘルシオ':'通常')+'</span><div class="rc-name">'+r.name+'</div><div class="rc-servings">基準 '+(r.servings||2)+'人分'+(r.time?' · '+r.time:'')+'</div><div style="margin-top:4px;flex-wrap:wrap;display:flex;gap:2px;">'+(tags.course?'<span class="tag-badge course">'+tags.course+'</span>':'')+(tags.cuisine?'<span class="tag-badge cuisine">'+tags.cuisine+'</span>':'')+(tags.method?'<span class="tag-badge method">'+tags.method+'</span>':'')+(tags.protein?'<span class="tag-badge protein">'+tags.protein+'</span>':'')+'</div><div style="font-size:10px;color:#aaa;margin-top:5px;">タップして詳細を見る</div></div>';}).join('');
}

function triggerImageUpload(recipeId){var input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=function(e){var file=e.target.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(ev){var r=recipes.find(function(r){return r.id===recipeId;});if(r){r.image=ev.target.result;scheduleSave();renderRecipeGrid();}};reader.readAsDataURL(file);};input.click();}
window.triggerImageUpload=triggerImageUpload;

function openRecipeDetail(id){
  var r=recipes.find(function(r){return r.id===id;});if(!r)return;
  document.getElementById('rd-modal-title').textContent=r.name;
  var tags=r.tags||{};
  var html='';
  if(r.image)html+='<img class="rd-img" src="'+r.image+'" alt="'+r.name+'">';
  html+='<div class="rd-badges"><span class="tag '+r.type+'">'+(r.type==='healsio'?'ヘルシオ':'通常')+'</span>'+(r.time?'<span class="rd-badge">'+r.time+'</span>':'')+'<span class="rd-badge">基準 '+(r.servings||2)+'人分</span><button class="btn-secondary btn-sm" onclick="triggerImageUpload('+r.id+');closeRecipeDetail();" style="font-size:10px;padding:3px 10px;">'+(r.image?'写真を変更':'＋ 写真を追加')+'</button></div>';
  html+='<div style="margin-bottom:1rem;"><div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">'+(tags.course?'<span class="tag-badge course">'+tags.course+'</span>':'')+(tags.cuisine?'<span class="tag-badge cuisine">'+tags.cuisine+'</span>':'')+(tags.method?'<span class="tag-badge method">'+tags.method+'</span>':'')+(tags.protein?'<span class="tag-badge protein">'+tags.protein+'</span>':'')+'</div><details style="font-size:12px;"><summary style="cursor:pointer;color:#888;margin-bottom:6px;">タグを編集</summary><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;"><select id="edit-course-'+r.id+'" class="inp-sm" style="font-size:11px;padding:4px 6px;"><option value="">種別</option>'+['主菜','副菜','汁物'].map(function(v){return'<option'+(tags.course===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select><select id="edit-cuisine-'+r.id+'" class="inp-sm" style="font-size:11px;padding:4px 6px;"><option value="">系統</option>'+['和','洋','中','他'].map(function(v){return'<option'+(tags.cuisine===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select><select id="edit-method-'+r.id+'" class="inp-sm" style="font-size:11px;padding:4px 6px;"><option value="">調理法</option>'+['焼','煮','蒸','揚','他'].map(function(v){return'<option'+(tags.method===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select><select id="edit-protein-'+r.id+'" class="inp-sm" style="font-size:11px;padding:4px 6px;"><option value="">食材</option>'+['豚','鶏','牛','挽','魚','他'].map(function(v){return'<option'+(tags.protein===v?' selected':'')+'>'+v+'</option>';}).join('')+'</select><button class="btn-import" style="font-size:11px;padding:5px 12px;" onclick="saveTagEdit('+r.id+')">保存</button></div></details></div>';
  if(r.type==='healsio'&&r.mode)html+='<div class="rd-healsio-box"><div class="rd-healsio-label">ヘルシオ 調理モード</div><div class="rd-healsio-value">'+r.mode+'</div></div>';
  if(r.ingredients&&r.ingredients.length){html+='<div class="rd-section-title">材料（'+(r.servings||2)+'人分）</div><ul class="rd-ingredients">'+r.ingredients.map(function(ing){var si=ing.indexOf(' '),name=si===-1?ing:ing.slice(0,si),amount=si===-1?'':ing.slice(si+1);return'<li class="rd-ing-item"><span class="rd-ing-name">'+name+'</span><span class="rd-ing-amount">'+amount+'</span></li>';}).join('')+'</ul>';}
  else html+='<div class="rd-section-title">材料</div><div style="color:#aaa;font-size:13px;margin-bottom:1rem;">未登録</div>';
  html+='<div class="rd-section-title">手順</div>';
  if(r.steps&&r.steps.length)html+='<div class="rd-steps">'+r.steps.map(function(step,i){return'<div class="rd-step"><div class="rd-step-num">'+(i+1)+'</div><div class="rd-step-text">'+step+'</div></div>';}).join('')+'</div>';
  else html+='<div style="color:#aaa;font-size:13px;">未登録</div>';
  document.getElementById('rd-modal-body').innerHTML=html;
  document.getElementById('recipe-detail-overlay').classList.add('open');
}
function saveTagEdit(id){var r=recipes.find(function(r){return r.id===id;});if(!r)return;if(!r.tags)r.tags={};r.tags.course=document.getElementById('edit-course-'+id)?.value||r.tags.course;r.tags.cuisine=document.getElementById('edit-cuisine-'+id)?.value||r.tags.cuisine;r.tags.method=document.getElementById('edit-method-'+id)?.value||r.tags.method;r.tags.protein=document.getElementById('edit-protein-'+id)?.value||r.tags.protein;scheduleSave();closeRecipeDetail();renderRecipeGrid();}
window.saveTagEdit=saveTagEdit;
function closeRecipeDetail(){document.getElementById('recipe-detail-overlay').classList.remove('open');}
window.closeRecipeDetail=closeRecipeDetail;

function deleteRecipe(id){if(!confirm('このレシピを削除しますか？'))return;recipes=recipes.filter(function(r){return r.id!==id;});Object.keys(mealPlan).forEach(function(k){if(mealPlan[k]&&mealPlan[k].recipeIds){mealPlan[k].recipeIds=mealPlan[k].recipeIds.filter(function(rid){return rid!==id;});if(mealPlan[k].recipeIds.length===0)delete mealPlan[k];}});scheduleSave();renderRecipeGrid();renderGrid();renderCookList();}
function exportRecipes(){var blob=new Blob([JSON.stringify(recipes,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='recipes_backup.json';a.click();URL.revokeObjectURL(url);}
window.exportRecipes=exportRecipes;

var modalTagFilters={type:'all',course:'all',cuisine:'all',method:'all',protein:'all'};
var modalTimeMax=120;
function onModalTimeSlider(val){modalTimeMax=parseInt(val);document.getElementById('modal-time-label').textContent=modalTimeMax>=120?'制限なし':modalTimeMax+'分以内';filterModalRecipes();}
window.onModalTimeSlider=onModalTimeSlider;
function resetModalTime(){modalTimeMax=120;document.getElementById('modal-time-slider').value=120;document.getElementById('modal-time-label').textContent='制限なし';filterModalRecipes();}
window.resetModalTime=resetModalTime;
function setModalTagFilter(key,val,btn){modalTagFilters[key]=val;var group=btn.closest('.filter-tabs');if(group)group.querySelectorAll('.filter-tab').forEach(function(t){t.classList.remove('active');});btn.classList.add('active');filterModalRecipes();}
window.setModalTagFilter=setModalTagFilter;

function openModal(key,day,meal){currentModalKey=key;document.getElementById('modal-title').textContent=day+'曜 '+meal+' にレシピを追加';document.getElementById('modal-search').value='';Object.keys(modalTagFilters).forEach(function(k){modalTagFilters[k]='all';});modalTimeMax=120;document.getElementById('modal-time-slider').value=120;document.getElementById('modal-time-label').textContent='制限なし';['mf-type','mf-course','mf-cuisine','mf-method','mf-protein'].forEach(function(id){document.getElementById(id)?.querySelectorAll('.filter-tab').forEach(function(t,i){t.classList.toggle('active',i===0);});});filterModalRecipes();document.getElementById('modal-overlay').classList.add('open');}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');currentModalKey=null;}
window.closeModal=closeModal;
function filterModalRecipes(){
  var q=document.getElementById('modal-search').value.toLowerCase();
  var existingIds=currentModalKey&&mealPlan[currentModalKey]?mealPlan[currentModalKey].recipeIds:[];
  var filtered=recipes.filter(function(r){
    if(modalTagFilters.type!=='all'&&r.type!==modalTagFilters.type)return false;
    if(modalTagFilters.course!=='all'&&r.tags?.course!==modalTagFilters.course)return false;
    if(modalTagFilters.cuisine!=='all'&&r.tags?.cuisine!==modalTagFilters.cuisine)return false;
    if(modalTagFilters.method!=='all'&&r.tags?.method!==modalTagFilters.method)return false;
    if(modalTagFilters.protein!=='all'&&r.tags?.protein!==modalTagFilters.protein)return false;
    if(modalTimeMax<120){var mins=guessTimeMinutes(r.time);if(mins!==null&&mins>modalTimeMax)return false;}
    if(q&&!r.name.toLowerCase().includes(q))return false;
    return true;
  });
  var list=document.getElementById('modal-recipe-list');
  if(!filtered.length){list.innerHTML='<div style="color:#aaa;font-size:13px;text-align:center;padding:1rem;">レシピが見つかりません</div>';return;}
  list.innerHTML=filtered.map(function(r){var added=existingIds.includes(r.id);var tags=r.tags||{};return'<div class="recipe-item" style="'+(added?'opacity:.5;cursor:default;':'')+'" onclick="'+(added?'':'addRecipeToCell('+r.id+')')+'"><div style="display:flex;gap:10px;align-items:flex-start;">'+(r.image?'<img src="'+r.image+'" style="width:56px;height:56px;object-fit:cover;border-radius:6px;flex-shrink:0;">':'')+'<div style="flex:1;min-width:0;"><div class="r-name">'+r.name+(added?' <span style="font-size:11px;color:#aaa;">（追加済み）</span>':'')+'</div><div class="r-meta">'+(r.time||'')+(r.mode?' · '+r.mode:'')+' · 基準'+(r.servings||2)+'人分</div><div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:4px;"><span class="tag '+r.type+'">'+(r.type==='healsio'?'ヘルシオ':'通常')+'</span>'+(tags.course?'<span class="tag-badge course" style="font-size:9px;">'+tags.course+'</span>':'')+(tags.cuisine?'<span class="tag-badge cuisine" style="font-size:9px;">'+tags.cuisine+'</span>':'')+(tags.method?'<span class="tag-badge method" style="font-size:9px;">'+tags.method+'</span>':'')+(tags.protein?'<span class="tag-badge protein" style="font-size:9px;">'+tags.protein+'</span>':'')+'</div></div></div></div>';}).join('');
}
function addRecipeToCell(rid){if(!currentModalKey)return;var data=getCellData(currentModalKey);if(!data.recipeIds.includes(rid))data.recipeIds.push(rid);scheduleSave();renderGrid();filterModalRecipes();}
function quickAdd(){var name=document.getElementById('quick-name').value.trim();if(!name)return;var r={id:nextId++,name:name,type:document.getElementById('quick-type').value,servings:2,time:'',mode:'',ingredients:[],steps:[]};r.tags=guessTags(r);recipes.push(r);document.getElementById('quick-name').value='';scheduleSave();filterModalRecipes();renderRecipeGrid();}
window.quickAdd=quickAdd;

function showScreen(name,btn){document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});document.getElementById('screen-'+name).classList.add('active');if(btn)btn.classList.add('active');if(name==='cooking')renderCookList();}
window.showScreen=showScreen;

initWeekStart();
loadShoppingList();
renderRecipeGrid();
})();
`
}