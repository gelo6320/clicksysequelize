// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");

const ADMIN_USER = "clicksy2025";
const ADMIN_PASS = "clicksy2025";

const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione di Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // Disabilita i log SQL
});

// Definizione del modello User
const User = sequelize.define('User', {
  userId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  claimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  timerEnd: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  referralCode: {
    type: DataTypes.STRING,
    unique: true,
  },
  usedRefBenefit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  arrivedFrom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  successfulReferrals: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

// Sincronizza il database
sequelize.sync()
  .then(() => {
    console.log('Database & tabelle create!');
  })
  .catch(err => {
    console.error('Errore nella sincronizzazione del database:', err);
  });

// Middleware per generare userId se non esiste
app.use(async (req, res, next) => {
  if (!req.cookies.userId) {
    const newUserId = "user-" + Math.random().toString(36).substr(2, 9);
    res.cookie("userId", newUserId, { maxAge: 31536000000 }); // 1 anno

    try {
      // Crea un nuovo utente nel database
      await User.create({
        userId: newUserId,
        referralCode: "REF-" + Math.random().toString(36).substr(2, 9),
      });
      console.log(`Nuovo utente creato: ${newUserId}`);
    } catch (err) {
      console.error('Errore nella creazione dell\'utente:', err);
    }
  }
  next();
});

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // Serve i file statici

/*
  ================================
  API UTENTE
  ================================
*/

// Rotta per ottenere i dati dell'utente
app.get("/api/user", async (req, res) => {
  const uid = req.cookies.userId;
  if (!uid) {
    return res.status(400).json({ error: "Cookie utente mancante" });
  }

  try {
    let user = await User.findByPk(uid);
    if (!user) {
      // Crea un nuovo utente se non esiste
      user = await User.create({
        userId: uid,
        referralCode: "REF-" + Math.random().toString(36).substr(2, 9),
      });
      console.log(`Nuovo utente creato tramite API: ${uid}`);
    }
    res.json(user);
  } catch (error) {
    console.error('Errore nel recupero dell\'utente:', error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Rotta per aggiornare l'email dell'utente
app.post("/api/user/email", async (req, res) => {
  const uid = req.cookies.userId;
  if (!uid) {
    return res.status(400).json({ error: "Cookie utente mancante" });
  }

  try {
    let user = await User.findByPk(uid);
    if (!user) {
      return res.status(400).json({ error: "Utente non trovato" });
    }

    const { email } = req.body;
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: "Email non valida" });
    }

    user.email = email;
    await user.save();
    res.json({ message: "Email aggiornata con successo", email: user.email });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'email:', error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Rotta per gestire il claim del premio
app.post("/api/user/claim", async (req, res) => {
  const uid = req.cookies.userId;
  if (!uid) {
    return res.status(400).json({ error: "Cookie utente mancante" });
  }

  try {
    let user = await User.findByPk(uid);
    if (!user) {
      return res.status(400).json({ error: "Utente non trovato" });
    }

    if (user.claimed) {
      return res.status(400).json({ error: "Hai già reclamato il premio" });
    }

    user.claimed = true;
    user.timerEnd = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore in futuro
    await user.save();
    res.json({ message: "Hai reclamato 100€! Il timer è attivo.", timerEnd: user.timerEnd });
  } catch (error) {
    console.error('Errore nel reclamo del premio:', error);
    res.status(500).json({ error: "Errore del server" });
  }
});

/*
  ================================
  API REFERRAL
  ================================
*/

// Rotta per gestire il referral
app.get("/api/referral", async (req, res) => {
  const { ref } = req.query;
  if (!ref) {
    return res.status(400).json({ error: "Parametro ref mancante" });
  }

  try {
    // Trova il referrer tramite referralCode
    const referrer = await User.findOne({ where: { referralCode: ref } });
    if (!referrer) {
      return res.json({ message: "Referral non trovato", ref });
    }

    const visitorId = req.cookies.userId;
    if (visitorId === referrer.userId) {
      return res.json({ message: "Stesso utente, nessun referral", ref });
    }

    // Trova o crea il visitatore
    let visitor = await User.findByPk(visitorId);
    if (!visitor) {
      visitor = await User.create({
        userId: visitorId,
        referralCode: "REF-" + Math.random().toString(36).substr(2, 9),
        arrivedFrom: referrer.userId,
      });
      console.log(`Nuovo visitatore creato tramite referral: ${visitorId}`);
    } else if (!visitor.arrivedFrom) {
      visitor.arrivedFrom = referrer.userId;
      await visitor.save();
      console.log(`Visitor ${visitorId} registrato per referral ${ref}`);
    }

    res.json({ message: "Referral registrato", ref, ownerUid: referrer.userId });
  } catch (error) {
    console.error('Errore nella gestione del referral:', error);
    res.status(500).json({ error: "Errore del server" });
  }
});

/*
  ================================
  API ADMINCONFIG
  ================================
*/

// Rotta per ottenere la configurazione admin
app.get("/api/adminConfig", async (req, res) => {
  // Implementa la logica per recuperare le configurazioni dal DB
  // Per semplicità, restituisci una configurazione predefinita
  const adminConfig = {
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

// Rotta per aggiornare la configurazione admin
app.post("/api/adminConfig", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Non autorizzato" });

  const base64 = authHeader.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("ascii");
  const [u, p] = decoded.split(":");
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return res.status(401).json({ error: "Credenziali Admin errate" });
  }

  // In una implementazione reale, salva la configurazione nel database
  // Per semplicità, restituisci la configurazione inviata
  const updatedConfig = req.body;
  res.json({ message: "Admin config salvato con successo", adminConfig: updatedConfig });
});

/*
  ================================
  Fallback
  ================================
*/
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
