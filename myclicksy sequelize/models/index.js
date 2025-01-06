// models/index.js
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // Disabilita i log SQL
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Definizione dei modelli
db.User = require('./user')(sequelize, DataTypes);
db.Referral = require('./referral')(sequelize, DataTypes);

// Relazioni (se necessarie)
db.User.hasMany(db.Referral, { foreignKey: 'referrerId' });
db.Referral.belongsTo(db.User, { foreignKey: 'referrerId' });

module.exports = db;