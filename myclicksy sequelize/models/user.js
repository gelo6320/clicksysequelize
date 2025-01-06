// models/user.js
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      userId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
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
  
    return User;
  };