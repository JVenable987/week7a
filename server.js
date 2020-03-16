var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
module.exports = app; // for testing
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});

router.get('/movies', function(req, res){
    console.log(req.body);
    res = res.status(200);
    res.json({headers: req.headers,
        queries: req.query,
        env: process.env.SECRET_KEY,
        msg: "GET movies"
    });
});
router.put('/movies', passport.authenticate("jwt", {session:false}), function(req, res){
    console.log(req.body);
    res = res.status(200);
    res.json({headers: req.headers,
        queries: req.query,
        env: process.env.SECRET_KEY,
        msg:"movie updated",
        auth: true
    });
});
router.post('/movies', function(req, res) {
    console.log(req.body);
    res = res.status(200);
    res.json({headers: req.headers,
        queries: req.query,
        env: process.env.SECRET_KEY,
        msg:"movie saved"
    });
});
router.delete('/movies', passport.authenticate("jwt", {session:false}), function(req, res){
    console.log(req.body);
    res = res.status(200);
    res.json({
        headers: req.headers,
        queries: req.query,
        env: process.env.SECRET_KEY,
        msg: "movie deleted",
        auth: true
    });
});
router.all('/signup', function(req, res){
    res = res.status(405).send({success: false, msg: "Method not supported"});
});
router.all('/signin', function(req, res){
    res = res.status(405).send({success: false, msg: "Method not supported"});
});
router.all('/movies', function(req, res){
    res = res.status(405).send({success: false, msg: "Method not supported"});
});
router.all('/*', function(req, res){
    res = res.status(404).send({success: false, msg: "page not found"})
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
