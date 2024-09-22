const mongoose = require('mongoose');

const RegisterSchema = mongoose.Schema({
   name:String,
   email:String,
   password:String
});

const RegisterModel = new mongoose.model('/registration', RegisterSchema);
module.exports = RegisterModel;