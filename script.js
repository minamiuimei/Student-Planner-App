// 授業名ごとのデフォルト持ち物マップ
const DEFAULT_ITEMS_MAP = {
  "国語": ["教科書", "ノート"],
  "数学": ["教科書", "ノート", "問題集"],
  "英語": ["教科書", "ノート", "ファイル"],
  "理科": ["教科書", "ノート", "資料集"],
  "社会": ["教科書", "ノート", "資料集"],
  "体育": ["体操服"],
  "音楽": ["ファイル"],
  "美術": ["ファイル"],
  "技術": ["教科書"],
  "家庭科": ["教科書"]
};

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

// --- テーマ切り替え機能 ---
function changeTheme(themeName) {
  document.body.className = '';
  document.body.classList.add(`theme-${themeName}`);
  localStorage.setItem("userTheme", themeName);
}

function loadTheme() {
  const savedTheme = localStorage.getItem("userTheme") || "beige";
  changeTheme(savedTheme);
}

// --- 【自動リセット機能】日付変更時のチェック状態クリア ---
function checkDateAndResetChecklist() {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastDate = localStorage.getItem("lastSavedCheckDate");

  if (lastDate !== todayStr) {
    localStorage.removeItem("checked_today");
    localStorage.removeItem("checked_tomorrowPreview");
    localStorage.setItem("lastSavedCheckDate", todayStr);
  }
}

// --- 画面切り替え ---
function showTodayScreen() {
  const today = document.getElementById("todayScreen");
  const tomorrow = document.getElementById("tomorrowScreen");
  const setup = document.getElementById("setupScreen");

  if (today) today.classList.remove("hidden");
  if (tomorrow) tomorrow.classList.add("hidden");
  if (setup) setup.classList.add("hidden");

  renderTodayView();
}

function showTomorrowScreen() {
  const today = document.getElementById("todayScreen");
  const tomorrow = document.getElementById("tomorrowScreen");
  const setup = document.getElementById("setupScreen");

  if (today) today.classList.add("hidden");
  if (tomorrow) tomorrow.classList.remove("hidden");
  if (setup) setup.classList.add("hidden");

  renderTomorrowView();
}

function showSetupScreen() {
  const today = document.getElementById("todayScreen");
  const tomorrow = document.getElementById("tomorrowScreen");
  const setup = document.getElementById("setupScreen");

  if (today) today.classList.add("hidden");
  if (tomorrow) tomorrow.classList.add("hidden");
  if (setup) setup.classList.remove("hidden");

  initSetupScreen();
}

// --- 共通入力欄操作 ---
function toggleClubItemInput(index) {
  const check = document.getElementById(`clubCheck_${index}`);
  const box = document.getElementById(`clubItemBox_${index}`);
  if (check && box) {
    box.classList.toggle("hidden", !check.checked);
  }
}

function autoFillItems(subjectInput) {
  const subjectName = subjectInput.value.trim();
  const periodRow = subjectInput.closest(".period-row");
  const defaultItems = DEFAULT_ITEMS_MAP[subjectName];

  if (!defaultItems || defaultItems.length === 0) return;

  const container = periodRow.querySelector(".items-container");
  if (!container) return;
  container.innerHTML = "";

  defaultItems.forEach((itemVal) => {
    const addBtn = periodRow.querySelector(".add-item-input-btn");
    if (addBtn) addItemInput(addBtn, itemVal);
  });
}

function addItemInput(btnElement, value = "") {
  const periodRow = btnElement.closest(".period-row");
  if (!periodRow) return;
  const container = periodRow.querySelector(".items-container");
  if (!container) return;

  const count = container.querySelectorAll(".item-input-group").length + 1;

  const group = document.createElement("div");
  group.className = "item-input-group";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "period-item";
  input.setAttribute("list", "item-list");
  input.placeholder = `持ち物${count}`;
  input.value = value;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-item-btn";
  removeBtn.textContent = "削除";
  removeBtn.onclick = () => group.remove();

  group.appendChild(input);
  group.appendChild(removeBtn);
  container.appendChild(group);
}

// --- 設定画面の構築 & 描画（エラー回避策導入） ---
function initSetupScreen() {
  const area = document.getElementById("scheduleSetupArea");
  if (!area) return;
  area.innerHTML = "";
  const settings = JSON.parse(localStorage.getItem("userSettings")) || {};

  const daysStr = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日"];

  daysStr.forEach((dayName, dayIndex) => {
    const dayDiv = document.createElement("div");
    dayDiv.className = "schedule-day";
    dayDiv.setAttribute("data-day", dayIndex);

    let rowsHTML = `<h2>📅 ${dayName}</h2>`;
    const savedDaySchedule = settings.schedules?.[dayIndex] || [];

    for (let p = 0; p < 6; p++) {
      const pData = savedDaySchedule[p] || { subject: "", classroom: "", items: [] };
      
      // 動的HTML構築のためのグループ描画
      const itemsHTML = (pData.items || []).map((it, idx) => `
        <div class="item-input-group">
          <input type="text" class="period-item" list="item-list" placeholder="持ち物${idx + 1}" value="${it}">
          <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">削除</button>
        </div>
      `).join('');

      rowsHTML += `
        <div class="period-row">
          <div class="period-header">
            <span class="period-num">${p + 1}時間目</span>
            <input type="text" class="classroom-input" placeholder="場所" value="${pData.classroom || ''}">
          </div>
          <input type="text" class="subject" placeholder="教科名" list="subject-list" value="${pData.subject || ''}" onchange="autoFillItems(this)">
          <div class="items-container">
            ${itemsHTML}
          </div>
          <button type="button" class="add-item-input-btn" onclick="addItemInput(this)">+ 持ち物追加</button>
        </div>
      `;
    }

    const clubInfo = settings.weekdayClubs?.[dayIndex] || { hasClub: false, item: "" };
    
    // エラー対策：判定結果を外部変数に格納
    const isCheckedAttr = clubInfo.hasClub ? "checked" : "";
    const isHiddenClass = clubInfo.hasClub ? "" : "hidden";

    rowsHTML += `
      <div class="weekday-club-box" style="margin-top: 10px;">
        <label>
          <input type="checkbox" id="clubCheck_${dayIndex}" ${isCheckedAttr} onchange="toggleClubItemInput(${dayIndex})"> 部活動あり
        </label>
        <div id="clubItemBox_${dayIndex}" class="${isHiddenClass}" style="margin-top: 6px;">
          <input type="text" id="clubItem_${dayIndex}" placeholder="部活の持ち物" class="period-item" list="item-list" value="${clubInfo.item || ''}">
        </div>
      </div>
    `;

    dayDiv.innerHTML = rowsHTML;
    area.appendChild(dayDiv);
  });

  if (settings.weatherPlaces) {
    if (document.getElementById("weatherPlace1")) document.getElementById("weatherPlace1").value = settings.weatherPlaces[0] || "";
    if (document.getElementById("weatherPlace2")) document.getElementById("weatherPlace2").value = settings.weatherPlaces[1] || "";
    if (document.getElementById("weatherPlace3")) document.getElementById("weatherPlace3").value = settings.weatherPlaces[2] || "";
  }
  if (document.getElementById("saturdayClub")) document.getElementById("saturdayClub").checked = settings.saturdayClub || false;
  if (document.getElementById("sundayClub")) document.getElementById("sundayClub").checked = settings.sundayClub || false;

  renderCustomSubjects();
  renderCustomItems();
}

function renderCustomSubjects() {
  const customSubjects = JSON.parse(localStorage.getItem("customSubjects")) || [];
  const dataList = document.getElementById("subject-list");
  const listContainer = document.getElementById("customSubjectList");
  if (!dataList) return;

  dataList.innerHTML = `
    <option value="国語"></option><option value="数学"></option>
    <option value="英語"></option><option value="理科"></option>
    <option value="社会"></option><option value="体育"></option>
    <option value="音楽"></option><option value="美術"></option>
    <option value="技術"></option><option value="家庭科"></option>
    <option value="道徳"></option><option value="学活"></option>
  `;

  if (listContainer) listContainer.innerHTML = "";
  
  customSubjects.forEach((subject, index) => {
    const option = document.createElement("option");
    option.value = subject;
    dataList.appendChild(option);

    if (listContainer) {
      const tag = document.createElement("div");
      tag.className = "custom-tag";
      tag.innerHTML = `<span>${subject}</span>`;
      
      const delBtn = document.createElement("button");
      delBtn.textContent = "×";
      delBtn.onclick = () => {
        customSubjects.splice(index, 1);
        localStorage.setItem("customSubjects", JSON.stringify(customSubjects));
        renderCustomSubjects();
      };
      
      tag.appendChild(delBtn);
      listContainer.appendChild(tag);
    }
  });
}

function renderCustomItems() {
  const customItems = JSON.parse(localStorage.getItem("customItems")) || [];
  const defaultItems = ["教科書", "ノート", "問題集", "資料集", "プリント", "ファイル", "体操服", "部活道具", "BYOD端末", "筆箱"];
  const allMasterItems = [...new Set([...defaultItems, ...customItems])];

  const dataList = document.getElementById("item-list");
  const listContainer = document.getElementById("customItemList");

  if (dataList) {
    dataList.innerHTML = "";
    allMasterItems.forEach(item => {
      const option = document.createElement("option");
      option.value = item;
      dataList.appendChild(option);
    });
  }

  if (listContainer) {
    listContainer.innerHTML = "";
    customItems.forEach((item, index) => {
      const tag = document.createElement("div");
      tag.className = "custom-tag";
      tag.innerHTML = `<span>${item}</span>`;
      
      const delBtn = document.createElement("button");
      delBtn.textContent = "×";
      delBtn.onclick = () => {
        customItems.splice(index, 1);
        localStorage.setItem("customItems", JSON.stringify(customItems));
        renderCustomItems();
      };
      
      tag.appendChild(delBtn);
      listContainer.appendChild(tag);
    });
  }

  const okibenContainer = document.getElementById("okibenSetupList");
  if (okibenContainer) {
    const okibenList = JSON.parse(localStorage.getItem("okibenItems")) || [];
    okibenContainer.innerHTML = "";

    allMasterItems.forEach((item, idx) => {
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `okiben_${idx}`;
      const isOkiben = okibenList.some(o => o.trim() === item.trim());
      checkbox.checked = isOkiben;

      const label = document.createElement("label");
      label.htmlFor = `okiben_${idx}`;
      label.textContent = item;

      checkbox.addEventListener("change", () => {
        let currentOkiben = JSON.parse(localStorage.getItem("okibenItems")) || [];
        if (checkbox.checked) {
          if (!currentOkiben.some(i => i.trim() === item.trim())) {
            currentOkiben.push(item.trim());
          }
        } else {
          currentOkiben = currentOkiben.filter(i => i.trim() !== item.trim());
        }
        localStorage.setItem("okibenItems", JSON.stringify(currentOkiben));
      });

      li.appendChild(checkbox);
      li.appendChild(label);
      okibenContainer.appendChild(li);
    });
  }
}

// --- カウントダウン機能 & 通知処理 ---
function updateCountdown() {
  const targetData = JSON.parse(localStorage.getItem("userTarget"));
  const display = document.getElementById("countdownDisplay");
  if (!display) return;

  if (!targetData) {
    display.textContent = "目標が設定されていません";
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(targetData.date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    display.textContent = `${targetData.title} まで あと ${diffDays} 日！`;
  } else if (diffDays === 0) {
    display.textContent = `🎉 今日は ${targetData.title} 当日です！`;
  } else {
    display.textContent = `${targetData.title} は終了しました (${Math.abs(diffDays)}年前)`;
  }

  checkCountdownNotification(targetData.title, diffDays);
}

function checkCountdownNotification(title, diffDays) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastNotified = JSON.parse(localStorage.getItem("lastNotifiedTarget")) || {};

  // 3日前通知
  if (diffDays === 3 && lastNotified.date !== todayStr + "_3days") {
    new Notification("📅 イベント3日前のお知らせ", {
      body: `${title} の3日前です！準備を確認しましょう。`,
      icon: "icon.png"
    });
    localStorage.setItem("lastNotifiedTarget", JSON.stringify({ date: todayStr + "_3days" }));
  }

  // 当日通知
  if (diffDays === 0 && lastNotified.date !== todayStr + "_today") {
    new Notification("🎉 イベント当日のお知らせ", {
      body: `今日は ${title} 当日です！全力を尽くしましょう！`,
      icon: "icon.png"
    });
    localStorage.setItem("lastNotifiedTarget", JSON.stringify({ date: todayStr + "_today" }));
  }
}

// --- 日付＆時間割の描画ロジック ---
function getTargetDayInfo(offset = 0) {
  const swapVal = document.getElementById("daySwapSelect")?.value;
  if (swapVal && swapVal !== "auto") {
    const dayIdx = parseInt(swapVal) - 1;
    return { dayIdx, isWeekend: false, dayOfWeek: dayIdx + 1 };
  }

  const date = new Date();
  date.setDate(date.getDate() + offset);
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { dayIdx: -1, isWeekend: true, dayOfWeek };
  } else {
    return { dayIdx: dayOfWeek - 1, isWeekend: false, dayOfWeek };
  }
}

function formatDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAY_NAMES[d.getDay()]}）`;
}

function renderTodayView() {
  const todayDateEl = document.getElementById("todayDate");
  if (todayDateEl) todayDateEl.textContent = formatDate(0);
  updateCountdown();

  const settings = JSON.parse(localStorage.getItem("userSettings")) || {};
  const okibenList = JSON.parse(localStorage.getItem("okibenItems")) || [];
  
  const todayInfo = getTargetDayInfo(0);
  renderScheduleAndItems(todayInfo, "todaySchedule", "todayItems", "todayClub", settings, okibenList, "today");
  
  const tomorrowInfo = getTargetDayInfo(1);
  renderScheduleAndItems(tomorrowInfo, null, "tomorrowItems", null, settings, okibenList, "tomorrowPreview");
  
  const memoEl = document.getElementById("memo");
  if (memoEl) memoEl.value = localStorage.getItem("userMemo") || "";
  fetchWeather(settings.weatherPlaces || []);
}

function renderTomorrowView() {
  const tomorrowDateEl = document.getElementById("tomorrowDate");
  if (tomorrowDateEl) tomorrowDateEl.textContent = formatDate(1);
  const settings = JSON.parse(localStorage.getItem("userSettings")) || {};
  const okibenList = JSON.parse(localStorage.getItem("okibenItems")) || [];
  
  const tomorrowInfo = getTargetDayInfo(1);
  renderScheduleAndItems(tomorrowInfo, "tomorrowSchedule", "tomorrowPageItems", "tomorrowClub", settings, okibenList, "tomorrow");
}

function renderScheduleAndItems(dayInfo, schedId, itemsId, clubId, settings, okibenList, pageKey) {
  const schedEl = schedId ? document.getElementById(schedId) : null;
  const itemsEl = itemsId ? document.getElementById(itemsId) : null;
  const clubEl = clubId ? document.getElementById(clubId) : null;

  if (schedEl) schedEl.innerHTML = "";
  if (itemsEl) itemsEl.innerHTML = "";
  if (clubEl) clubEl.innerHTML = "";

  const { dayIdx, isWeekend, dayOfWeek } = dayInfo;
  const rawItems = [];

  if (isWeekend) {
    if (schedEl) schedEl.innerHTML = `<div class="no-items">休日のため時間割はありません</div>`;
    
    const hasWeekendClub = (dayOfWeek === 6 && settings.saturdayClub) || (dayOfWeek === 0 && settings.sundayClub);
    if (clubEl) {
      clubEl.textContent = hasWeekendClub ? "🏃 週末部活あり" : "部活動なし";
    }
    if (hasWeekendClub) {
      rawItems.push("部活道具");
    }

    if (itemsEl) {
      renderItemList(itemsEl, rawItems, okibenList, pageKey);
    }
    return;
  }

  // 平日の処理
  const daySchedule = settings.schedules?.[dayIdx] || [];

  if (schedEl) {
    let schedHTML = "";
    daySchedule.forEach((p, i) => {
      if (p.subject) {
        const roomBadgeHTML = p.classroom ? `<span class="classroom-badge">${p.classroom}</span>` : '';
        schedHTML += `<div class="schedule-item"><strong>${i + 1}時限:</strong> ${p.subject} ${roomBadgeHTML}</div>`;
        (p.items || []).forEach(it => {
          if (it && it.trim() !== "") rawItems.push(it.trim());
        });
      }
    });
    schedEl.innerHTML = schedHTML || `<div class="no-items">時間割が未設定です</div>`;
  } else {
    daySchedule.forEach(p => (p.items || []).forEach(it => {
      if (it && it.trim() !== "") rawItems.push(it.trim());
    }));
  }

  // 平日部活の判定
  const clubInfo = settings.weekdayClubs?.[dayIdx];
  if (clubInfo && clubInfo.hasClub) {
    const clubItemText = clubInfo.item ? `(${clubInfo.item})` : '';
    if (clubEl) clubEl.textContent = `🏃 部活あり ${clubItemText}`;
    if (clubInfo.item) rawItems.push(clubInfo.item.trim());
  } else if (clubEl) {
    clubEl.textContent = "部活動なし";
  }

  if (itemsEl) {
    renderItemList(itemsEl, rawItems, okibenList, pageKey);
  }
}

function renderItemList(container, rawItems, okibenList, pageKey) {
  const cleanedOkiben = okibenList.map(o => o.trim());
  const finalItems = [...new Set(rawItems)].filter(it => !cleanedOkiben.includes(it.trim()));

  if (finalItems.length === 0) {
    container.innerHTML = `<div class="no-items">持ち物はありません</div>`;
    return;
  }

  const checkedStates = JSON.parse(localStorage.getItem(`checked_${pageKey}`)) || {};
  const ul = document.createElement("ul");
  ul.className = "checklist";

  finalItems.forEach((item, idx) => {
    const li = document.createElement("li");
    const isChecked = !!checkedStates[item];
    const checkedClass = isChecked ? 'checked' : '';
    const checkedAttr = isChecked ? 'checked' : '';

    li.innerHTML = `
      <input type="checkbox" id="${pageKey}_item_${idx}" ${checkedAttr}>
      <label for="${pageKey}_item_${idx}" class="${checkedClass}">${item}</label>
    `;

    const chk = li.querySelector("input");
    chk.addEventListener("change", () => {
      const lbl = li.querySelector("label");
      lbl.classList.toggle("checked", chk.checked);
      checkedStates[item] = chk.checked;
      localStorage.setItem(`checked_${pageKey}`, JSON.stringify(checkedStates));
    });

    ul.appendChild(li);
  });
  container.appendChild(ul);
}

// --- 天気予報 API (Open-Meteo) ---
async function fetchWeather(places) {
  const container = document.getElementById("weatherList");
  if (!container) return;

  const validPlaces = places.filter(p => p.trim() !== "");
  if (validPlaces.length === 0) {
    container.innerHTML = `<div class="no-items">設定画面で地域を登録してください (例: 東京都)</div>`;
    return;
  }

  container.innerHTML = "天気情報を取得中...";
  let html = "";

  for (const place of validPlaces) {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=ja&format=json`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        html += `<div class="weather-item"><span>${place}</span>: 取得失敗(地域名不明)</div>`;
        continue;
      }

      const { latitude, longitude, name } = geoData.results[0];
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo`);
      const weatherData = await weatherRes.json();

      const code = weatherData.daily.weathercode[0];
      const maxTemp = Math.round(weatherData.daily.temperature_2m_max[0]);
      const minTemp = Math.round(weatherData.daily.temperature_2m_min[0]);
      const { text: weatherText, isRainy } = getWeatherInfo(code);

      const rainWarningHTML = isRainy ? `<div style="color: #d9534f; font-weight: bold; margin-top: 2px;">☔ 雨が降りそうです。折りたたみ傘を持っていきましょう！</div>` : '';

      html += `
        <div class="weather-item" style="margin-bottom: 8px;">
          <div><strong>${name}</strong>: <span>${weatherText}</span> (🌡️ ${maxTemp}℃ / ${minTemp}℃)</div>
          ${rainWarningHTML}
        </div>
      `;
    } catch (e) {
      html += `<div class="weather-item"><span>${place}</span>: 通信エラー</div>`;
    }
  }

  container.innerHTML = html;
}

function getWeatherInfo(code) {
  let text = "🌤️ 天気不明";
  let isRainy = false;

  if (code === 0) {
    text = "☀️ 晴れ";
  } else if (code >= 1 && code <= 3) {
    text = "⛅ 晴れのち曇り";
  } else if (code >= 45 && code <= 48) {
    text = "🌫️ 霧";
  } else if (code >= 51 && code <= 67) {
    text = "🌧 雨";
    isRainy = true;
  } else if (code >= 71 && code <= 77) {
    text = "❄️ 雪";
    isRainy = true;
  } else if (code >= 80 && code <= 82) {
    text = "☔ にわか雨";
    isRainy = true;
  } else if (code >= 95) {
    text = "⚡ 雷雨";
    isRainy = true;
  }

  return { text, isRainy };
}

// --- イベントリスナーの登録 ---
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  checkDateAndResetChecklist();

  const tomorrowBtn = document.getElementById("tomorrowBtn");
  const todayBtn = document.getElementById("todayBtn");
  const editSetupBtn = document.getElementById("editSetupBtn");

  if (tomorrowBtn) tomorrowBtn.onclick = showTomorrowScreen;
  if (todayBtn) todayBtn.onclick = showTodayScreen;
  if (editSetupBtn) editSetupBtn.onclick = showSetupScreen;

  const daySwapSelect = document.getElementById("daySwapSelect");
  if (daySwapSelect) daySwapSelect.onchange = renderTodayView;

  const saveMemoBtn = document.getElementById("saveMemoBtn");
  if (saveMemoBtn) {
    saveMemoBtn.onclick = () => {
      const val = document.getElementById("memo")?.value || "";
      localStorage.setItem("userMemo", val);
      alert("メモを保存しました！");
    };
  }

  const applyCommonItemBtn = document.getElementById("applyCommonItemBtn");
  if (applyCommonItemBtn) {
    applyCommonItemBtn.onclick = () => {
      const itemVal = document.getElementById("commonItemInput")?.value.trim() || "";
      if (!itemVal) return alert("持ち物名を入力してください");

      const periodRows = document.querySelectorAll(".period-row");
      periodRows.forEach(row => {
        const itemInputs = row.querySelectorAll(".period-item");
        const isAlreadyExists = Array.from(itemInputs).some(input => input.value.trim() === itemVal);

        if (!isAlreadyExists) {
          if (itemInputs.length === 1 && itemInputs[0].value.trim() === "") {
            itemInputs[0].value = itemVal;
          } else {
            const addBtn = row.querySelector(".add-item-input-btn");
            if (addBtn) addItemInput(addBtn, itemVal);
          }
        }
      });

      alert(`「${itemVal}」をすべての授業に追加しました！`);
      if (document.getElementById("commonItemInput")) document.getElementById("commonItemInput").value = "";
    };
  }

  const addSubjectBtn = document.getElementById("addSubjectBtn");
  if (addSubjectBtn) {
    addSubjectBtn.onclick = () => {
      const input = document.getElementById("newSubjectInput");
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;
      const list = JSON.parse(localStorage.getItem("customSubjects")) || [];
      if (!list.includes(val)) list.push(val);
      localStorage.setItem("customSubjects", JSON.stringify(list));
      input.value = "";
      renderCustomSubjects();
    };
  }

  const addItemBtn = document.getElementById("addItemBtn");
  if (addItemBtn) {
    addItemBtn.onclick = () => {
      const input = document.getElementById("newItemInput");
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;
      const list = JSON.parse(localStorage.getItem("customItems")) || [];
      if (!list.includes(val)) list.push(val);
      localStorage.setItem("customItems", JSON.stringify(list));
      input.value = "";
      renderCustomItems();
    };
  }

  const saveSetupBtn = document.getElementById("saveSetupBtn");
  if (saveSetupBtn) {
    saveSetupBtn.onclick = () => {
      const schedules = [];
      const weekdayClubs = [];
      const days = document.querySelectorAll(".schedule-day");

      days.forEach((day, dayIndex) => {
        if (dayIndex >= 5) return;
        const subjects = [];
        const periodRows = day.querySelectorAll(".period-row");

        periodRows.forEach(row => {
          const subjectVal = row.querySelector(".subject")?.value.trim() || "";
          const roomVal = row.querySelector(".classroom-input")?.value.trim() || "";
          const itemInputs = row.querySelectorAll(".period-item");
          const itemsArr = [];

          itemInputs.forEach(input => {
            if (input.value.trim() !== "") itemsArr.push(input.value.trim());
          });

          subjects.push({
            subject: subjectVal,
            classroom: roomVal,
            items: itemsArr
          });
        });

        schedules.push(subjects);

        const isClub = document.getElementById(`clubCheck_${dayIndex}`)?.checked || false;
        const clubItem = document.getElementById(`clubItem_${dayIndex}`)?.value.trim() || "";
        weekdayClubs.push({ hasClub: isClub, item: clubItem });
      });

      const weatherPlaces = [
        document.getElementById("weatherPlace1")?.value.trim() || "",
        document.getElementById("weatherPlace2")?.value.trim() || "",
        document.getElementById("weatherPlace3")?.value.trim() || ""
      ];

      const settings = {
        schedules,
        weekdayClubs,
        saturdayClub: document.getElementById("saturdayClub")?.checked || false,
        sundayClub: document.getElementById("sundayClub")?.checked || false,
        weatherPlaces
      };

      localStorage.setItem("userSettings", JSON.stringify(settings));
      alert("設定を保存しました！");
      showTodayScreen();
    };
  }

  const resetAllBtn = document.getElementById("resetAllBtn");
  if (resetAllBtn) {
    resetAllBtn.onclick = () => {
      if (confirm("全てのデータを初期化しますか？")) {
        localStorage.clear();
        location.reload();
      }
    };
  }

  const editCountdownBtn = document.getElementById("editCountdownBtn");
  if (editCountdownBtn) {
    editCountdownBtn.onclick = () => {
      document.getElementById("countdownForm")?.classList.toggle("hidden");
    };
  }

  const saveTargetBtn = document.getElementById("saveTargetBtn");
  if (saveTargetBtn) {
    saveTargetBtn.onclick = () => {
      const title = document.getElementById("targetTitle")?.value.trim() || "";
      const date = document.getElementById("targetDate")?.value || "";

      if (!title || !date) return alert("目標名と日付を入力してください");

      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      localStorage.setItem("userTarget", JSON.stringify({ title, date }));
      localStorage.removeItem("lastNotifiedTarget");

      document.getElementById("countdownForm")?.classList.add("hidden");
      updateCountdown();
      alert("目標を保存しました！");
    };
  }

  // PWA サービスワーカー登録
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    } catch (e) {}
  }

  showTodayScreen();
});
