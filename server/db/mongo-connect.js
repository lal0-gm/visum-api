'use strict';

let mongoose = require('mongoose');

mongoose.Promise = global.Promise;

module.exports = mongoose.connect('mongodb://prueba-gridfs:de3fko0n@ds147461.mlab.com:47461/prueba-gridfs', { useNewUrlParser: true } );
 