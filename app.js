var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
mongoose.connect('mongodb+srv://quangvinh02200_db_user:3rgv230nrZNBudpa@cluster0.tlwmnuk.mongodb.net/BAOCAO?appName=Cluster0');
mongoose.connection.on('connected', () => {
    console.log('Đã kết nối MongoDB');
})



//route
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));

app.use(function (req, res, next) {
    next(createError(404));
});


app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
});

module.exports = app;