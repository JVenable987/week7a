var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// user schema
var MovieSchema = new Schema({
    Title: { type: String, required: true, index: { unique: true }},
    YearReleased: Number,
    Genre: {type: String,
        enum: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller',
    'Western', 'Unknown'],
default: 'Unknown'},
    Actors: [{ActorName: "", CharacterName: ""}, {ActorName: "", CharacterName: ""}, {ActorName: "", CharacterName: ""}],
    imageUrl: String
});

MovieSchema.pre('save', function(next) {
    var movie = this;
    next();
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);