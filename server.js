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
router.route('/allreviews')
    .get(authJwtController.isAuthenticated, function (req, res) {
        Review.find(function (err, reviews) {
            if (err) res.send(err);
            // return the reviews
            res.json(reviews);
        });
    });
router.route('/allmovies')
    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.find(function (err, movies) {
            if (err) res.send(err);
            // return the reviews
            res.json(movies);
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
    Movie.findOne({Title: req.body.Title}).exec(function(err, movie){
        if (err) res.send(err);
        console.log(movie);
        if (movie == null){
            res.json({
                headers: req.headers,
                queries: req.query,
                env: process.env.SECRET_KEY,
                msg: "failed to GET movies"
            })
        } else if (req.query.reviews) {
            Review.find({Title: req.body.Title}).select('Title ReviewerName quote rating').exec(function(error, reviews){
                if (error) res.send(error);
                res.json({
                    headers: req.headers,
                    queries: req.query,
                    movies: movie,
                    reviews: reviews,
                    env: process.env.SECRET_KEY,
                    msg: "GET movies reviews is true"
                });
            });
        }
        else{
            res.json({
                headers: req.headers,
                queries: req.query,
                movies: movie,
                env: process.env.SECRET_KEY,
                msg: "GET movies reviews is not true"
            });
        }
    });

});
router.put('/movies', passport.authenticate("jwt", {session:false}), function(req, res){
    console.log(req.body);
    res = res.status(200);
    if(!req.body.Title){
        res.json({
            headers: req.headers,
            queries: req.query,
            msg: "Please enter the title",
            auth: false
        });
    }
    //Get the fields from the movie into variables, then replace with changed forms
    //if(!req.body.newTitle){}
    //if(!req.body.YearReleased){}
    //if(!req.body.Genre){}
    //if(!(req.body.Actor1 && req.body.Char1)){}
    //if (!(req.body.Actor2 && req.body.Char2)){}
    //if (!(req.body.Actor3 && req.body.Char3)){}
    //if (!(req.body.imageUrl)){}
    else{
        if(req.body.newTitle && req.body.Title && req.body.YearReleased && req.body.Genre && req.body.Actor1 && req.body.Actor2 && req.body.Actor3 && req.body.Char1 && req.body.Char2 && req.body.Char3 && req.body.imageUrl) {
            var ActorArray = [{ActorName:req.body.Actor1, CharacterName:req.body.Char1},{ActorName:req.body.Actor2, CharacterName:req.body.Char2},
                {ActorName:req.body.Actor3, CharacterName:req.body.Char3}];
            Movie.updateOne({$inc: {title: req.body.Title}}, {
                Title: req.body.newTitle, YearReleased: req.body.YearReleased,
                Genre: req.body.Genre, Actors: ActorArray
            }, callback);
            res.json({
                headers: req.headers,
                queries: req.query,
                msg: "movie updated",
                auth: true
            });
        }
    }
});
router.post('/movies', passport.authenticate("jwt", {session:false}), function(req, res) {
    console.log(req.body);
    if(req.body.Title && req.body.YearReleased && req.body.Genre && req.body.Actor1 && req.body.Actor2 && req.body.Actor3 && req.body.Char1 && req.body.Char2 && req.body.Char3 && req.body.imageUrl) {
        res = res.status(200);
        var movie = new Movie();
        movie.Title = req.body.Title;
        movie.YearReleased = req.body.YearReleased;
        movie.Genre = req.body.Genre;
        if (req.body.Actor1) {
            movie.Actors[0] = {ActorName: req.body.Actor1, CharacterName: req.body.Char1};
        }
        if (req.body.Actor2) {
            movie.Actors[1] = {ActorName: req.body.Actor2, CharacterName: req.body.Char2};
        }
        if (req.body.Actor3) {
            movie.Actors[2] = {ActorName: req.body.Actor3, CharacterName: req.body.Char3};
        }
        movie.imageUrl = req.body.imageUrl;

        movie.save(function (err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({success: false, message: 'A movie with that title already exists. '});
                else
                    return res.send(err);
            }

            res.json({
                headers: req.headers,
                queries: req.query,
                env: process.env.SECRET_KEY,
                msg: "movie saved",
                success: true,
                message: 'movie created!'
            });
        });

    }else{
        res.json({
            headers: req.headers,
                queries: req.query,
                env: process.env.SECRET_KEY,
                msg: "Please enter all fields",
                success: false,
                message: 'movie not created'
        })
    }
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

    User.findOne({token: req.body.token}).select('name').exec(function(err, userName){
        if (err) {
            return res.send(err);
        }
        review.Title = req.body.Title;
        review.ReviewerName  = userName;
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
router.all('/reviews', function(req, res){
    res = res.status(405).send({success: false, msg: "Method not supported"});
});
router.all('/*', function(req, res){
    res = res.status(404).send({success: false, msg: "page not found"})
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
