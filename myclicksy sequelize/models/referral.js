// models/referral.js
module.exports = (sequelize, DataTypes) => {
    const Referral = sequelize.define('Referral', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      referrerId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      referredId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  
    return Referral;
  };