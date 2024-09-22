const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const RegisterModel = require('./models/register');
const ContactModel = require('./models/contacts');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

app.use(cookieParser())

mongoose.connect('mongodb+srv://viveksalwan63:iWCwO0yiUx75TL3H@smartcms.vx1vg.mongodb.net/')
    .then(result => console.log('mongo connected'))
    .catch(err => console.log('database connection error'))

const verifyUser = (req, res, next) => {
    const token = req.cookies.token
    if (!token) {
        return res.json(null)
    } else {
        jwt.verify(token, 'jwt-secret-key', (err, decoded) => {
            if (err) {
                console.log(err)
            } else {
                req.email = decoded.email;
                req.name = decoded.name;
                req.role = decoded.role
                next();
            }
        })
    }
}


app.get('/', verifyUser, (req, res) => {
    return res.json({ email: req.email, name: req.name, role: req.role })
})

app.post('/register', (req, res) => {
    const { name, email, password, } = req.body
    RegisterModel.findOne({ email })

        .then(user => {
            if (user) {
                res.json({ massage: 'user already exits' })
            } else {
                bcrypt.hash(password, 10)
                    .then(hashed => {
                        RegisterModel.create({ name, email, password: hashed })
                            .then(resp => res.json({ massage: 'registered' }))
                            .catch(err => console.log(err))

                    }).catch(err => res.json(err))


            }
        }).catch(err => console.log(err))
})

app.post('/login', (req, res) => {
    const { email, password, } = req.body;

    RegisterModel.findOne({ email })
        .then(user => {
            if (user) {
                return bcrypt.compare(password, user.password)
                    .then(response => {

                        if (response) {
                            const token = jwt.sign({ email: user.email, name: user.name, }, 'jwt-secret-key', { expiresIn: '1d' })
                            res.cookie('token', token, {
                                httpOnly: true
                            })
                            res.json({ massage: 'logged in' })
                        } else {
                            res.json({ massage: 'Wrong Password' })
                        }
                    })


            } else {
                res.json({ massage: 'User not Found' })
            }
        })

})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json('success');
})


app.post('/reset-password', (req, res) => {
    const { email } = req.body;
    RegisterModel.findOne({ email })
        .then(user => {

            if (user) {
                const OtpGenerator = () => {
                    return Math.floor(1000 + Math.random() * 9000)
                }

                const otp = OtpGenerator()

                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'viveksalwan2021@gmail.com',
                        pass: 'mpypsfrdualrgizn'
                    }
                });

                var mailOptions = {
                    from: 'viveksalwan2021@gmail.com',
                    to: email,
                    subject: 'Forgot Password OTP',
                    text: `Your One-Time Password (OTP) for reseting your password is: ${otp}`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        return res.json({ massage: 'email sent', otp: otp });
                    }
                });


            } else {
                return res.json({ massage: 'Email is not Registered' })
            }

        }).catch(err => res.json(err))
})


app.put('/change-password', (req, res) => {
    const { newPassword, email } = req.body;
    RegisterModel.findOne({ email })
        .then(user => {
            bcrypt.hash(newPassword, 10, (err, hashed) => {
                if (err) {
                    console.log('error hashing password')
                } else {
                    user.password = hashed;
                    user.save()
                        .then(resp => res.json({ massage: 'Password Changed Successfully' }))
                        .catch(err => res.json(err))

                }
            })

        }).catch(err => res.json(err))
})



app.post('/save-contact', (req, res) => {
    const { name, number, email, useremail } = req.body;

    ContactModel.findOne({ number: number })
        .then(contact => {
            if (contact) {
                return res.json('phone number already exits in your contact list')
            } else {
                ContactModel.create({ name, number, email, useremail })
                    .then(resp => res.json('saved'))
                    .catch(err => console.log(err))
            }
        })

})


app.get('/get-contacts/:userEmail', (req, res) => {
    const userEmail  = req.params.userEmail;
    // console.log('email' + userEmail)
    ContactModel.find({useremail:userEmail})
        .then(resp => res.json(resp))
        .catch(err => res.json(err))
})



app.get('/getContactById/:id', (req, res) => {
    const id = req.params.id

    ContactModel.findById(id)
        .then(resp => res.json(resp))
        .catch(err => res.json(err))
})



app.put('/edit-contact', (req, res) => {
    const { name, number, email, contactID } = req.body;

    ContactModel.findByIdAndUpdate(contactID, { name: name, number: number, email: email })
        .then(resp => res.json(resp))
        .catch(err => res.json(err))
})


app.delete('/delete-contact/:id', (req, res) => {
    const id = req.params.id;

    ContactModel.findByIdAndDelete(id)
        .then(resp => res.json('deleted'))
        .catch(err => res.json(err))

})


app.put('/add-to-favorite', (req,res)=>{
    const {contactID} = req.body;
    
    ContactModel.findByIdAndUpdate(contactID, {favorite:true})
    .then(resp => res.json('added to favorite'))
    .catch(err => res.json(err))
})



app.put('/remove-from-favorite', (req,res)=>{
    const {contactID} = req.body;

    ContactModel.findByIdAndUpdate(contactID, {favorite:false})
    .then(resp => res.json('removed from favorite'))
    .catch(err => res.json(err))
})


app.get('/get-favorite-contacts/:useremail', (req,res)=>{

    const useremail = req.params.useremail;
   
    ContactModel.find({useremail:useremail, favorite:true})
    .then(resp => res.json(resp))
    .catch(err => res.json(err))

})


// app.put('/select-contact', (req,res)=>{
//     const {contactID} = req.body;

//     ContactModel.findByIdAndUpdate(contactID, {selected:true})
//     .then(resp => res.json('contact selected'))
//     .catch(err => res.json(err))
// })




app.put('/delete-selected-contact', (req,res)=>{
    const {selectedContacts} = req.body;
    
    const contactIds = selectedContacts.filter(contact => contact._id)
   
    ContactModel.deleteMany({ _id: { $in: contactIds } })
    .then(resp => res.json('deleted'))
    .catch(err => res.json(err))
})


app.listen(3001, () => {
    console.log('Server is Running')
})