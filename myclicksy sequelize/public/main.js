// public/main.js

// Funzione per ottenere i parametri della query string
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Riferimenti agli elementi DOM
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

// Variabili globali
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

editEmailButton?.addEventListener("click", async () => {
  const newEm = editEmailInput.value.trim();
  if (!newEm) {
    alert("Per favore, inserisci un'email valida.");
    return;
  }
  try {
    const response = await fetch("/api/user/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEm })
    });
    const result = await response.json();
    if (response.ok) {
      alert("Email aggiornata con successo!");
      editEmailForm.style.display = "none";
      userData.email = newEm; // Aggiorna localmente
    } else {
      alert(result.error || "Errore nell'aggiornamento dell'email.");
    }
  } catch (error) {
    console.error(error);
    alert("Errore durante la richiesta.");
  }
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
async function getUserData() {
  try {
    const response = await fetch("/api/user");
    if (!response.ok) throw new Error("User not found");
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function saveUserData(body) {
  try {
    const response = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const updatedUser = await response.json();
    return updatedUser;
  } catch (error) {
    console.error(error);
    return null;
  }
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
    // In una implementazione reale, il referralCode dovrebbe essere generato dal server
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
    })
    .catch(err => console.error("Errore nel copia link:", err));
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

  try {
    // Simula un ritardo per l'animazione dello spinner
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Invio richiesta al server per reclamare il premio
    const response = await fetch("/api/user/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const result = await response.json();

    if (response.ok) {
      alert("Hai reclamato 100€! Il timer è attivo.");
      userData.claimed = true;
      userData.timerEnd = result.timerEnd;
      handleTimer(result.timerEnd);
    } else {
      alert(result.error || "Errore durante il reclamo.");
      claimButton.disabled = false;
      claimButton.innerHTML = `Ritira 100<strong>€</strong>`;
    }
  } catch (error) {
    console.error(error);
    alert("Errore durante il reclamo.");
    claimButton.disabled = false;
    claimButton.innerHTML = `Ritira 100<strong>€</strong>`;
  }
});

// Gestione timer
function handleTimer(endTime) {
  if (endTime > Date.now()) {
    claimButton.textContent = "Peccato, non hai vinto";
    claimButton.disabled = true;
    showTimer(endTime);
  } else {
    claimButton.disabled = false;
    claimButton.textContent = "Ritira 100€";
    timerDisplay.style.display = "none";
  }
}

// Timer display
function showTimer(endTime) {
  timerDisplay.style.display = "block";
  updateTimer(endTime);
  userTimerInterval = setInterval(() => updateTimer(endTime), 1000);
}

function updateTimer(endTime) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) {
    clearInterval(userTimerInterval);
    timerDisplay.textContent = "";
    claimButton.disabled = false;
    claimButton.style.backgroundColor = adminConfig?.ritiraButtonColor || "#f39c12";
    claimButton.innerHTML = `${adminConfig?.ritiraButtonText || 'Ritira 100€'}`;
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
async function initAll() {
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
  userData = await getUserData();
  if (userData) {
    // Se mail = null => popup
    if (!userData.email) {
      showEmailPopup();
    }

    // Gestisci lo stato del pulsante "Ritira 100€"
    handleClaimButton(userData);
    
    // Inizializza il link referral
    initReferralLink(userData);
  }

  loadContacts();
  loadSocial();
  initializeVetrina();
  setInterval(updateVetrinaTimers, 1000);
  setInterval(checkNewItem, 3000);
}

initAll();

// Funzione che mostra il popup email
function showEmailPopup() {
  emailOverlay.style.display = "flex";
}

// Funzione per nascondere il popup email
function hideEmailPopup() {
  emailOverlay.style.display = "none";
}

// Funzione per validare l'email (client-side)
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Event listener per il pulsante di salvataggio dell'email
emailSaveButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) {
    alert("Per favore, inserisci un'email valida.");
    return;
  }
  if (!validateEmail(email)) {
    alert("Per favore, inserisci un'email valida.");
    return;
  }

  try {
    const response = await fetch("/api/user/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      hideEmailPopup();
      userData.email = email; // Aggiorna localmente
    } else {
      alert(result.error || "Errore nell'aggiornamento dell'email.");
    }
  } catch (error) {
    console.error(error);
    alert("Errore durante la richiesta.");
  }
});

/*
  ================================
  REFERRAL LOGIC
  ================================
*/

// Rotta per gestire il referral (già implementata nel server)
