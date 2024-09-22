const mongoose = require('mongoose');

const ContactSchema = mongoose.Schema({
  name:String,
  number:String,
  email:String,
  useremail:String,
  favorite:{
    type:Boolean,
    default:false
  },
  selected:{
    type:Boolean,
    default:false
  }
});

const ContactModel = new mongoose.model('contact', ContactSchema);
module.exports = ContactModel;