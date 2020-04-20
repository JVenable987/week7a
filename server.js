var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
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
    //userNew.name = req.body.name;
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

router.get('/movies', passport.authenticate("jwt", {session:false}), function(req, res){
    console.log(req.body);
    res = res.status(200);
    movieArray = Movie.find({Title: req.body.Title});
    if (reviews = true) {
        res.json({
            headers: req.headers,
            queries: req.query,
            movies: movieArray,
            env: process.env.SECRET_KEY,
            msg: "GET movies"
        });
    }
    else{
        res.json({
            headers: req.headers,
            queries: req.query,
            movies: movieArray,
            env: process.env.SECRET_KEY,
            msg: "GET movies"
        });
    }
});
router.put('/movies', passport.authenticate("jwt", {session:false}), function(req, res){
    console.log(req.body);
    res = res.status(200);
    if(!req.body.title || !req.body.newTitle || !req.body.YearReleased || !req.body.Genre || !req.body.ActorArray){
        res.json({
            headers: req.headers,
            queries: req.query,
            msg: "Please enter all fields",
            auth: false
        });
    }
    else {
        Movie.updateOne({$inc: {title: req.body.Title}}, {
            Title: req.body.newTitle, YearReleased: req.body.YearReleased,
            Genre: req.body.Genre, ActorArray: req.body.ActorArray
        }, callback);
        res.json({
            headers: req.headers,
            queries: req.query,
            msg: "movie updated",
            auth: true
        });
    }
});
router.post('/movies', passport.authenticate("jwt", {session:false}), function(req, res) {
    console.log(req.body);
    res = res.status(200);
    var movie = new Movie();
    movie.Title = req.body.Title;
    movie.YearReleased = req.body.YearReleased;
    movie.Genre = req.body.Genre;
    movie.ActorArray = req.body.ActorArray;
    movie.save(function(err) {
        if (err) {
            // duplicate entry
            if (err.code == 11000)
                return res.json({ success: false, message: 'A movie with that title already exists. '});
            else
                return res.send(err);
        }

        res.json({headers: req.headers,
            queries: req.query,
            env: process.env.SECRET_KEY,
            msg:"movie saved",
            success: true,
            message: 'movie created!' });
    });
});
router.delete('/movies', passport.authenticate("jwt", {session:false}), function(req, res){
    console.log(req.body);
    res = res.status(200);
    if (!req.body.Title) {
        res.json({success: false, message: 'Please pass title of movie.'});
    }
    else {
        Movie.deleteMany({Title: req.body.Title});
        Review.deleteMany({Title: req.body.Title});
            res.json({
                headers: req.headers,
                queries: req.query,
                env: process.env.SECRET_KEY,
                msg: "movie deleted",
                auth: true,
                success: true,
                message: 'Movie deleted!'});
    }
});
router.post('/reviews', passport.authenticate("jwt", {session:false}), function(req, res) {
    console.log(req.body);
    res = res.status(200);
    var review = new Review();
    review.Title = req.body.Title;
    review.ReviewerName = User.findOne({token: req.body.token});
    review.Quote = req.body.Quote;
    review.rating = req.body.rating;
    review.save(function(err) {
        if (err) {
            return res.send(err);
        }
        res.json({headers: req.headers,
            queries: req.query,
            env: process.env.SECRET_KEY,
            msg:"review saved",
            success: true,
            message: 'review created!' });
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
