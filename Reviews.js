var mongoose = require('mongoose');
var Movies = require('./Movies');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// user schema
var ReviewSchema = new Schema({
    Title: { type: String, required: true, index: { unique: true }},
    ReviewerName: String,
    quote: String,
    rating: {type:Number, min:1, max:5}
});
ReviewSchema.pre('save', function(next) {
    var review = this;
    next();
});

// return the model
module.exports = mongoose.model('Reviews', ReviewSchema);