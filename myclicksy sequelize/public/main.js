// public/main.js
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const ADMIN_USER = "clicksy2025";
const ADMIN_PASS = "clicksy2025";

// Riferimenti DOM Principali
const emailOverlay = document.getElementById("emailOverlay");
const emailInput = document.getElementById("emailInput");
const emailSaveButton = document.getElementById("emailSaveButton");

const editEmailSection = document.getElementById("editEmailSection");
const showEditEmailForm = document.getElementById("showEditEmailForm");
const editEmailForm = document.getElementById("editEmailForm");
const editEmailInput = document.getElementById("editEmailInput");
const editEmailButton = document.getElementById("editEmailButton");

const claimButton = document.getElementById("claimButton");
const timerDisplay = document.getElementById("timerDisplay");

const referralLink = document.getElementById("referralLink");
const copyButton = document.getElementById("copyButton");
const copiedIcon = document.getElementById("copiedIcon");

const instagramShare = document.getElementById("instagramShare");
const goToContactsLink = document.getElementById("goToContactsLink");
const contactsList = document.getElementById("contactsList");
const instagramSocial = document.getElementById("instagramSocial");
const tiktokSocial = document.getElementById("tiktokSocial");

// Vetrina
const vetrinaScorrevole = document.getElementById("vetrinaScorrevole");
const minimizeVetrina = document.getElementById("minimizeVetrina");
const restoreVetrina = document.getElementById("restoreVetrina");
const vetrinaItems = document.getElementById("vetrinaItems");

// Admin
const adminOverlay = document.getElementById("adminOverlay");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminContent = document.getElementById("adminContent");
const adminLoginButton = document.getElementById("adminLoginButton");
const adminLogoutButton = document.getElementById("adminLogoutButton");
const adminUsername = document.getElementById("adminUsername");
const adminPassword = document.getElementById("adminPassword");
const totalAccessCount = document.getElementById("totalAccessCount");
const contactsListInput = document.getElementById("contactsListInput");
const saveContactsButton = document.getElementById("saveContactsButton");
const instagramLinkInput = document.getElementById("instagramLinkInput");
const tiktokLinkInput = document.getElementById("tiktokLinkInput");
const saveSocialButton = document.getElementById("saveSocialButton");
const leaderboardUL = document.getElementById("leaderboard");

const comeFunzionaAdmin = document.getElementById("comeFunzionaAdmin");
const linkPersonaleAdmin = document.getElementById("linkPersonaleAdmin");
const btnTextAdmin = document.getElementById("btnTextAdmin");
const btnColorAdmin = document.getElementById("btnColorAdmin");
const btnSizeAdmin = document.getElementById("btnSizeAdmin");
const clicksyTitleAdmin = document.getElementById("clicksyTitleAdmin");
const bgValueAdmin = document.getElementById("bgValueAdmin");
const newSectionType = document.getElementById("newSectionType");
const newSectionContent = document.getElementById("newSectionContent");
const addSectionButton = document.getElementById("addSectionButton");
const saveAdminConfig = document.getElementById("saveAdminConfig");

let bgChoiceRadio = null; // gestito a runtime
let userData = null;
let userTimerInterval = null;

// Config Client (caricato dall’adminConfig)
let adminConfig = null;

// 1) Admin Overlay se ?admin=1
if (getQueryParam("admin") === "1") {
  adminOverlay.style.display = "flex";
}
adminLoginButton?.addEventListener("click", () => {
  if (adminUsername.value === ADMIN_USER && adminPassword.value === ADMIN_PASS) {
    adminLoginForm.style.display = "none";
    adminContent.style.display = "block";
    loadAdminData();
  } else {
    alert("Credenziali errate!");
  }
});
adminLogoutButton?.addEventListener("click", () => {
  adminUsername.value = "";
  adminPassword.value = "";
  adminContent.style.display = "none";
  adminLoginForm.style.display = "block";
  adminOverlay.style.display = "none";
});

// Carica dati Admin
function loadAdminData() {
  fetch("/api/accessCount")
    .then(r => r.json())
    .then(d => totalAccessCount.textContent = d.totalAccessCount);

  fetch("/api/contacts")
    .then(r => r.json())
    .then(arr => {
      contactsListInput.value = arr.join("\n");
    });

  fetch("/api/social")
    .then(r => r.json())
    .then(d => {
      instagramLinkInput.value = d.instagram || "#";
      tiktokLinkInput.value = d.tiktok || "#";
    });

  fetch("/api/leaderboard")
    .then(r => r.json())
    .then(lb => {
      leaderboardUL.innerHTML = "";
      lb.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.referralCode} => ${item.successfulReferrals} referral`;
        leaderboardUL.appendChild(li);
      });
      if (lb.length === 0) {
        leaderboardUL.innerHTML = "<li>Nessun referral presente</li>";
      }
    });

  // Carica admin config
  fetch("/api/adminConfig")
    .then(r => r.json())
    .then(cfg => {
      adminConfig = cfg;
      comeFunzionaAdmin.value = cfg.comeFunzionaText;
      linkPersonaleAdmin.value = cfg.linkPersonaleText;
      btnTextAdmin.value = cfg.ritiraButtonText;
      btnColorAdmin.value = cfg.ritiraButtonColor || "#f39c12";
      btnSizeAdmin.value = cfg.ritiraButtonSize || "1.2em";
      clicksyTitleAdmin.value = cfg.clicksyTitle || "Partecipa a Clicksy!";
      bgValueAdmin.value = cfg.backgroundValue;
      // Se customSections esiste, iniettiamo nel DOM
      if (cfg.customSections && cfg.customSections.length > 0) {
        cfg.customSections.forEach(s => addCustomSection(s));
      }
      // Aggiorna interfaccia
      document.querySelectorAll("input[name='bgChoice']").forEach(rad => {
        if (rad.value === cfg.backgroundChoice) {
          rad.checked = true;
          bgChoiceRadio = rad;
        }
      });
    });
}

// Salva admin config
saveAdminConfig?.addEventListener("click", () => {
  const body = {
    comeFunzionaText: comeFunzionaAdmin.value,
    linkPersonaleText: linkPersonaleAdmin.value,
    ritiraButtonText: btnTextAdmin.value,
    ritiraButtonColor: btnColorAdmin.value,
    ritiraButtonSize: btnSizeAdmin.value,
    clicksyTitle: clicksyTitleAdmin.value,
    backgroundChoice: document.querySelector("input[name='bgChoice']:checked")?.value || "color",
    backgroundValue: bgValueAdmin.value
  };
  fetch("/api/adminConfig", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${ADMIN_USER}:${ADMIN_PASS}`)
    },
    body: JSON.stringify(body)
  })
  .then(r => r.json())
  .then(d => {
    alert("Configurazione salvata!");
    applyAdminConfig(d.adminConfig);
  })
  .catch(err => alert("Errore salvataggio configurazione."));
});

// Aggiungi sezione custom
addSectionButton?.addEventListener("click", () => {
  const stype = newSectionType.value; // text o code
  const scontent = newSectionContent.value;
  if (!scontent.trim()) return;
  const newSec = { type: stype, content: scontent };
  // Salviamo
  fetch("/api/adminConfig", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${ADMIN_USER}:${ADMIN_PASS}`)
    },
    body: JSON.stringify({ newSection: newSec })
  })
  .then(r => r.json())
  .then(d => {
    adminConfig = d.adminConfig;
    addCustomSection(newSec);
    alert("Nuova sezione aggiunta!");
  })
  .catch(err => alert("Errore aggiunta sezione."));
});

// Funzione che inietta una sezione custom nel DOM
function addCustomSection(sec) {
  const container = document.getElementById("mainContainer");
  const div = document.createElement("div");
  div.style.marginTop = "16px";
  div.style.padding = "14px";
  div.style.borderRadius = "8px";
  div.style.backgroundColor = "#fafafa";

  if (sec.type === "text") {
    div.textContent = sec.content;
  } else if (sec.type === "code") {
    // Interpretiamo come HTML
    div.innerHTML = sec.content;
  }
  container.appendChild(div);
}

// Applica config (background, testo, ecc.)
function applyAdminConfig(cfg) {
  document.getElementById("comeFunzionaText").textContent = cfg.comeFunzionaText;
  document.getElementById("linkPersonaleText").textContent = cfg.linkPersonaleText;
  claimButton.textContent = cfg.ritiraButtonText || "Ritira 100€";
  claimButton.style.backgroundColor = cfg.ritiraButtonColor || "#f39c12";
  claimButton.style.fontSize = cfg.ritiraButtonSize || "1.2em";
  document.getElementById("clicksyTitle").textContent = cfg.clicksyTitle || "Partecipa a Clicksy!";

  // Background
  if (cfg.backgroundChoice === "image") {
    document.body.style.background = `url(${cfg.backgroundValue}) no-repeat center center / cover`;
  } else {
    document.body.style.background = cfg.backgroundValue || "linear-gradient(115deg, #1fd1f9 10%, #b621fe 90%)";
  }

  // Aggiungi sezioni custom
  if (cfg.customSections && cfg.customSections.length > 0) {
    cfg.customSections.forEach(s => addCustomSection(s));
  }
}

// 2) Se clicco su "Modifica Email" => mostro form
showEditEmailForm?.addEventListener("click", (e) => {
  e.preventDefault();
  editEmailForm.style.display = editEmailForm.style.display === "none" ? "flex" : "none";
});
editEmailButton?.addEventListener("click", () => {
  const newEm = editEmailInput.value.trim();
  if (!newEm) return;
  saveUserData({ email: newEm }).then(() => {
    alert("Email aggiornata con successo!");
  });
});

// Carica contatti, social
function loadContacts() {
  fetch("/api/contacts").then(r => r.json()).then(arr => {
    contactsList.innerHTML = "";
    arr.forEach(line => {
      const li = document.createElement("li");
      li.textContent = line;
      contactsList.appendChild(li);
    });
  });
}
function loadSocial() {
  fetch("/api/social").then(r => r.json()).then(d => {
    instagramSocial.href = d.instagram || "#";
    tiktokSocial.href = d.tiktok || "#";
  });
}

// Ottengo userData e applico logica
function getUserData() {
  return fetch("/api/user").then(r => {
    if (!r.ok) throw new Error("User not found");
    return r.json();
  });
}
function saveUserData(body) {
  return fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(r => r.json());
}

/*
  ================================
  REFERRAL LOGIC
  ================================
*/
function checkReferralParam() {
  const ref = getQueryParam("ref");
  if (ref) {
    fetch(`/api/referral?ref=${encodeURIComponent(ref)}`)
      .then(r => r.json())
      .then(d => console.log("Referral param registrato:", d))
      .catch(err => console.error(err));
  }
}

function initReferralLink(userD) {
  if (!userD.referralCode) {
    // Genera un referralCode univoco se non presente
    userD.referralCode = "REF-" + Math.random().toString(36).substr(2, 9);
    saveUserData({ referralCode: userD.referralCode });
  }
  const base = location.origin + location.pathname;
  const personalLink = `${base}?ref=${userD.referralCode}`;
  referralLink.href = personalLink;
  referralLink.textContent = personalLink;
}
copyButton?.addEventListener("click", () => {
  navigator.clipboard.writeText(referralLink.textContent)
    .then(() => {
      copiedIcon.style.display = "block";
      setTimeout(() => copiedIcon.style.display = "none", 1500);
    });
});

// Instagram Share
instagramShare?.addEventListener("click", () => {
  const link = referralLink.textContent.trim();
  navigator.clipboard.writeText(link).then(() => {
    alert("Link copiato! Ora puoi condividerlo nella tua story.");
  });
  const shareText = encodeURIComponent("Partecipa a Clicksy! " + link);
  window.open(`instagram://story-camera?text=${shareText}`, "_blank");
});

/*
  ================================
  PULSANTE "RITIRA 100€"
  ================================
*/
claimButton?.addEventListener("click", async () => {
  if (!userData) return;
  if (claimButton.disabled) return;

  // Mostra spinner
  claimButton.innerHTML = `<span class="spinner" style="margin-right:8px;"></span>Caricamento...`;
  claimButton.disabled = true;

  // Simula un ritardo per lo spinner
  setTimeout(async () => {
    // Aggiorna il pulsante
    claimButton.style.backgroundColor = "#e74c3c";
    claimButton.textContent = "Peccato, non hai vinto";

    // Determina il timer
    let newTimer = 24 * 60 * 60 * 1000; // 24 ore
    if (!userData.usedRefBenefit && userData.arrivedFrom && !userData.claimed) {
      // Prima volta con referral: 10 ore
      newTimer = 10 * 60 * 60 * 1000;
      
      // Aggiorna il referrer
      try {
        const referrer = await db.User.findByPk(userData.arrivedFrom);
        if (referrer) {
          referrer.successfulReferrals += 1;
          // Aggiungi 4 ore al timer del referrer
          if (referrer.timerEnd && referrer.timerEnd > Date.now()) {
            referrer.timerEnd = new Date(referrer.timerEnd.getTime() - (4 * 60 * 60 * 1000));
          }
          await referrer.save();
        }
      } catch (error) {
        console.error("Errore nell'aggiornamento del referrer:", error);
      }

      // Marca che l'utente ha usato il beneficio del referral
      userData.usedRefBenefit = true;
    }

    // Aggiorna lo stato dell'utente
    await saveUserData({
      claimed: true,
      usedRefBenefit: userData.usedRefBenefit,
      timerEnd: Date.now() + newTimer
    }).then(updated => {
      userData = updated;
      showTimer(updated.timerEnd);
    });

    // Aggiorna il pulsante
    claimButton.style.backgroundColor = "#7f8c8d";
    claimButton.textContent = "Peccato, non hai vinto";
    claimButton.disabled = true;
  }, 1500);
});

function showTimer(endTime) {
  timerDisplay.style.display = "block";
  updateTimer(endTime);
  userTimerInterval = setInterval(() => updateTimer(endTime), 1000);
}

function updateTimer(endTime) {
  const diff = endTime - Date.now();
  if (diff <= 0) {
    clearInterval(userTimerInterval);
    timerDisplay.textContent = "";
    claimButton.disabled = false;
    claimButton.style.backgroundColor = adminConfig?.ritiraButtonColor || "#f39c12";
    claimButton.textContent = adminConfig?.ritiraButtonText || "Ritira 100€";
    saveUserData({ claimed: false, timerEnd: null });
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  timerDisplay.textContent = `Timer: ${h}h ${m}m ${s}s`;
}

/*
  ================================
  VETRINA
  ================================
*/
const LAUNCH_TIMESTAMP = new Date("2025-01-01T00:00:00Z").getTime();
let partialSums = [0];
let globalItems = [];

function getIntervalByIndex(i) {
  const val = (i * 9301 + 49297) % 233280;
  const rand = val / 233280;
  return 5 + Math.floor(rand * 16);
}
function initializeVetrina() {
  const now = Date.now();
  let currentIndex = 0;
  while (true) {
    const nextInterval = getIntervalByIndex(currentIndex);
    const nextTimeSeconds = partialSums[partialSums.length - 1] + nextInterval;
    const nextTimestamp = LAUNCH_TIMESTAMP + nextTimeSeconds * 1000;
    if (nextTimestamp > now) break;
    partialSums.push(nextTimeSeconds);
    createItem(nextTimestamp, currentIndex);
    currentIndex++;
  }
  renderVetrina();
}
function createItem(timestamp, index) {
  const messages = [
    "È stata appena inviata una nuova vincita!",
    "Un premio inatteso è stato distribuito ora!",
    "Un utente ha ricevuto un bonus speciale!",
    "Un nuovo payout è stato appena erogato!",
    "Una nuova vincita è stata confermata!"
  ];
  const msgIndex = index % messages.length;
  globalItems.push({ time: timestamp, text: messages[msgIndex] });
}
function checkNewItem() {
  const now = Date.now();
  const lastIndex = partialSums.length - 1;
  let currentIndex = lastIndex;
  while (true) {
    const nextInterval = getIntervalByIndex(currentIndex);
    const nextTimeSeconds = partialSums[partialSums.length - 1] + nextInterval;
    const nextTimestamp = LAUNCH_TIMESTAMP + nextTimeSeconds * 1000;
    if (nextTimestamp <= now) {
      partialSums.push(nextTimeSeconds);
      createItem(nextTimestamp, currentIndex);
      currentIndex++;
    } else {
      break;
    }
  }
  renderVetrina();
}
function renderVetrina() {
  const oneHourAgo = Date.now() - 3600 * 1000;
  globalItems = globalItems.filter(item => item.time >= oneHourAgo);
  globalItems.sort((a, b) => b.time - a.time);
  vetrinaItems.innerHTML = "";
  globalItems.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("vetrina-item");
    div.dataset.time = item.time;
    div.innerHTML = `<span>${item.text}</span>`;
    vetrinaItems.appendChild(div);
  });
}
function updateVetrinaTimers() {
  const itemDivs = vetrinaItems.querySelectorAll(".vetrina-item");
  itemDivs.forEach(div => {
    const itemTime = parseInt(div.dataset.time, 10);
    const timePassed = Math.floor((Date.now() - itemTime) / 1000);
    let displayTime = "";
    if (timePassed >= 3600) {
      const hours = Math.floor(timePassed / 3600);
      displayTime = `${hours} ore`;
    } else if (timePassed >= 60) {
      const minutes = Math.floor(timePassed / 60);
      displayTime = `${minutes} minuti`;
    } else {
      displayTime = `${timePassed} secondi`;
    }
    const originalText = div.getAttribute("data-original-text") || div.querySelector("span").textContent;
    const splitted = originalText.split(" - ");
    const pureText = splitted[splitted.length - 1];
    div.setAttribute("data-original-text", pureText);
    div.querySelector("span").textContent = `${displayTime} fa - ${pureText}`;
  });
}

minimizeVetrina.addEventListener("click", () => {
  vetrinaScorrevole.classList.remove("show");
  vetrinaScorrevole.classList.add("hide");
  restoreVetrina.classList.add("visible");
});
restoreVetrina.addEventListener("click", () => {
  vetrinaScorrevole.classList.remove("hide");
  vetrinaScorrevole.classList.add("show");
  restoreVetrina.classList.remove("visible");
});

/*
  ================================
  INIT
  ================================
*/
function initAll() {
  // Carica config e la applica
  fetch("/api/adminConfig")
    .then(r => r.json())
    .then(cfg => {
      adminConfig = cfg;
      applyAdminConfig(cfg);
    });

  // Check referral
  checkReferralParam();

  // Carico user
  getUserData().then(u => {
    userData = u;
    // Se mail = null => popup
    if (!u.email) {
      emailOverlay.style.display = "flex";
    }
    // Se timer non scaduto => disabilito
    if (u.timerEnd && new Date(u.timerEnd) > Date.now()) {
      claimButton.disabled = true;
      claimButton.style.backgroundColor = "#7f8c8d";
      claimButton.textContent = "Peccato, non hai vinto";
      showTimer(new Date(u.timerEnd));
    } else if (u.claimed) {
      // Se claimed ma timer scaduto => re-enable
      if (new Date(u.timerEnd) < Date.now()) {
        saveUserData({ claimed: false, timerEnd: null }).then(() => {
          claimButton.disabled = false;
        });
      } else {
        // Timer non scaduto
        claimButton.disabled = true;
        claimButton.style.backgroundColor = "#7f8c8d";
        claimButton.textContent = "Peccato, non hai vinto";
        showTimer(new Date(u.timerEnd));
      }
    }

    // Genero link referral univoco
    initReferralLink(u);
  })
  .catch(err => console.error(err));

  loadContacts();
  loadSocial();
  initializeVetrina();
  setInterval(updateVetrinaTimers, 1000);
  setInterval(checkNewItem, 3000);
}

initAll();