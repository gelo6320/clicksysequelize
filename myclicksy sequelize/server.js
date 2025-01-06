// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const db = require('./models');

const ADMIN_USER = "clicksy2025";
const ADMIN_PASS = "clicksy2025";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // Serve i file statici

// Sincronizza il database
db.sequelize.sync().then(() => {
  console.log('Database & tables created!');
});

// Middleware per generare userId
app.use(async (req, res, next) => {
  if (!req.cookies.userId) {
    const newUserId = "user-" + Math.random().toString(36).substr(2, 9);
    res.cookie("userId", newUserId, { maxAge: 31536000000 }); // 1 anno

    // Crea un nuovo utente nel database
    await db.User.create({
      userId: newUserId,
      referralCode: "REF-" + Math.random().toString(36).substr(2, 9),
    });
  }
  next();
});

// Middleware per il contatore degli accessi
app.use(async (req, res, next) => {
  // Puoi implementare un contatore globale nel database se necessario
  // Ad esempio, un modello 'AccessCounter' con un solo record
  next();
});

/*
  ================================
  API UTENTE
  ================================
*/
app.get("/api/user", async (req, res) => {
  const uid = req.cookies.userId;
  if (!uid) {
    return res.status(400).json({ error: "Cookie utente mancante" });
  }

  try {
    let user = await db.User.findByPk(uid);
    if (!user) {
      // Crea un nuovo utente se non esiste
      user = await db.User.create({
        userId: uid,
        referralCode: "REF-" + Math.random().toString(36).substr(2, 9),
      });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore del server" });
  }
});

app.post("/api/user", async (req, res) => {
  const uid = req.cookies.userId;
  if (!uid) {
    return res.status(400).json({ error: "Cookie utente mancante" });
  }

  try {
    let user = await db.User.findByPk(uid);
    if (!user) {
      return res.status(400).json({ error: "Utente non trovato" });
    }

    // Aggiorna i campi se presenti
    if (req.body.email !== undefined) user.email = req.body.email;
    if (req.body.claimed !== undefined) user.claimed = req.body.claimed;
    if (req.body.timerEnd !== undefined) user.timerEnd = new Date(req.body.timerEnd);
    if (req.body.usedRefBenefit !== undefined) user.usedRefBenefit = req.body.usedRefBenefit;
    if (req.body.arrivedFrom !== undefined) user.arrivedFrom = req.body.arrivedFrom;
    if (req.body.successfulReferrals !== undefined) user.successfulReferrals = req.body.successfulReferrals;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore del server" });
  }
});

/*
  ================================
  API REFERRAL
  ================================
*/
app.get("/api/referral", async (req, res) => {
  const { ref } = req.query;
  if (!ref) {
    return res.status(400).json({ error: "Parametro ref mancante" });
  }

  try {
    // Trova il referrer tramite referralCode
    const referrer = await db.User.findOne({ where: { referralCode: ref } });
    if (!referrer) {
      return res.json({ message: "Referral non trovato", ref });
    }

    const visitorId = req.cookies.userId;
    if (visitorId === referrer.userId) {
      return res.json({ message: "Stesso utente, nessun referral", ref });
    }

    // Trova o crea il visitatore
    let visitor = await db.User.findByPk(visitorId);
    if (!visitor) {
      visitor = await db.User.create({
        userId: visitorId,
        referralCode: "REF-" + Math.random().toString(36).substr(2, 9),
        arrivedFrom: referrer.userId,
      });
    } else if (!visitor.arrivedFrom) {
      visitor.arrivedFrom = referrer.userId;
      await visitor.save();
    }

    res.json({ message: "Referral registrato", ref, ownerUid: referrer.userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore del server" });
  }
});

/*
  ================================
  API CONTATTI
  ================================
*/
app.get("/api/contacts", async (req, res) => {
  // Implementa una tabella 'Contact' nel database se necessario
  // Per semplicità, utilizzerò un file statico
  const contacts = [
    "Email: support@clicksy.com",
    "Telefono: +39 123 4567 890"
  ];
  res.json(contacts);
});

app.post("/api/contacts", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Non autorizzato" });

  const base64 = authHeader.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("ascii");
  const [u, p] = decoded.split(":");
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return res.status(401).json({ error: "Credenziali Admin errate" });
  }
  if (!Array.isArray(req.body.contacts)) {
    return res.status(400).json({ error: "Formato contatti non valido" });
  }

  // Per semplicità, salvo nuovamente su file (consigliato spostare su DB)
  fs.writeFileSync(path.join(__dirname, "db.json"), JSON.stringify({ ...db, contacts: req.body.contacts }, null, 2));
  res.json({ message: "Contatti aggiornati con successo", contacts: req.body.contacts });
});

/*
  ================================
  API SOCIAL
  ================================
*/
app.get("/api/social", async (req, res) => {
  // Simile a contatti, usa una tabella 'Social' se necessario
  const social = {
    instagram: "#",
    tiktok: "#"
  };
  res.json(social);
});

app.post("/api/social", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Non autorizzato" });

  const base64 = authHeader.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("ascii");
  const [u, p] = decoded.split(":");
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return res.status(401).json({ error: "Credenziali Admin errate" });
  }

  const { instagram, tiktok } = req.body;
  if (instagram === undefined || tiktok === undefined) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  // Simile a contatti, salva su file per semplicità
  fs.writeFileSync(path.join(__dirname, "db.json"), JSON.stringify({ ...db, social: { instagram, tiktok } }, null, 2));
  res.json({ message: "Social salvati con successo", social: { instagram, tiktok } });
});

/*
  ================================
  API LEADERBOARD
  ================================
*/
app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaderboard = await db.User.findAll({
      attributes: ['referralCode', 'successfulReferrals'],
      order: [['successfulReferrals', 'DESC']],
      limit: 10
    });
    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore del server" });
  }
});

/*
  ================================
  API ADMINCONFIG
  ================================
  Implementa una tabella 'AdminConfig' nel DB per gestire le configurazioni dinamiche
*/
app.get("/api/adminConfig", async (req, res) => {
  // Implementa la logica per recuperare le configurazioni
  const adminConfig = db.adminConfig || {
    comeFunzionaText: "Testo standard su come funziona.",
    linkPersonaleText: "Ogni click sul tuo link fa risparmiare ore di attesa!",
    ritiraButtonText: "Ritira 100€",
    ritiraButtonColor: "#f39c12",
    ritiraButtonSize: "1.2em",
    backgroundChoice: "color",
    backgroundValue: "linear-gradient(115deg, #1fd1f9 10%, #b621fe 90%)",
    clicksyTitle: "Partecipa a Clicksy!",
    customSections: []
  };
  res.json(adminConfig);
});

app.post("/api/adminConfig", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Non autorizzato" });

  const base64 = authHeader.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("ascii");
  const [u, p] = decoded.split(":");
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return res.status(401).json({ error: "Credenziali Admin errate" });
  }

  let config = db.adminConfig || {
    comeFunzionaText: "Testo standard su come funziona.",
    linkPersonaleText: "Ogni click sul tuo link fa risparmiare ore di attesa!",
    ritiraButtonText: "Ritira 100€",
    ritiraButtonColor: "#f39c12",
    ritiraButtonSize: "1.2em",
    backgroundChoice: "color",
    backgroundValue: "linear-gradient(115deg, #1fd1f9 10%, #b621fe 90%)",
    clicksyTitle: "Partecipa a Clicksy!",
    customSections: []
  };

  // Aggiorna i campi se presenti
  if (req.body.comeFunzionaText !== undefined) config.comeFunzionaText = req.body.comeFunzionaText;
  if (req.body.linkPersonaleText !== undefined) config.linkPersonaleText = req.body.linkPersonaleText;
  if (req.body.ritiraButtonText !== undefined) config.ritiraButtonText = req.body.ritiraButtonText;
  if (req.body.ritiraButtonColor !== undefined) config.ritiraButtonColor = req.body.ritiraButtonColor;
  if (req.body.ritiraButtonSize !== undefined) config.ritiraButtonSize = req.body.ritiraButtonSize;
  if (req.body.backgroundChoice !== undefined) config.backgroundChoice = req.body.backgroundChoice;
  if (req.body.backgroundValue !== undefined) config.backgroundValue = req.body.backgroundValue;
  if (req.body.clicksyTitle !== undefined) config.clicksyTitle = req.body.clicksyTitle;

  // Aggiungi nuove sezioni se presenti
  if (req.body.newSection) {
    config.customSections.push(req.body.newSection);
  }

  db.adminConfig = config;
  saveDB();
  res.json({ message: "Admin config salvato con successo", adminConfig: config });
});

/*
  ================================
  FALLBACK
  ================================
*/
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Server in esecuzione su http://localhost:" + PORT);
});