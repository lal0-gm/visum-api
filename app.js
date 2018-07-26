'use strict';

let express     = require('express');
let bodyParser  = require('body-parser');
let cfenv       = require('cfenv');
let fs          = require('fs');
let multer      = require('multer');
let streamBuffers = require('stream-buffers');
let mongoose    = require('mongoose');
let Grid        = require('gridfs-stream');

// create express instance
let oApp = express();



oApp.use(bodyParser.json());

//Motor de Vistas
//oApp .set('view engine', 'ejs');

// connect to mongodb
require('./server/db/mongo-connect.js');
var MediaFile = require('./server/db/models/MediaFile.js');

var Schema = mongoose.Schema;
var conn = mongoose.connection;

Grid.mongo = mongoose.mongo;
var gfs;
conn.once('open', function () {
  console.log('open');
  gfs = Grid(conn.db);
});

var upload = multer();


/*oApp.get('/', function(req, res){

  gfs.files.find().toArray(function (err, files){
    if (!files || files.length === 0){
      res.status(404).json({message: "No hay acrhivos"})
    }else{
      //res.status(200).json({message: "Si hay acrhivos: "+ files.length})
    
      res.render('index', { files: files });

    }



  })

})
*/


oApp.post('/api/media/', upload.single('file'), function(req, res) {

  //req.file.id = req.params.id;
  req.file.id = new mongoose.Types.ObjectId()
  req.file.name = req.body.name
  console.log(req.file);

  new MediaFile(req.file)
    .save(function (err, mediaFile) {
      if (err) {
          return res.status(500).send('Error occurred: database error');
      }

      var myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
          frequency: 10,   // in milliseconds.
          chunkSize: 2048  // in bytes.
      });

      myReadableStreamBuffer.put(req.file.buffer);
      myReadableStreamBuffer.stop();

      // streaming to gridfs
      //filename to store in mongodb
      var writestream = gfs.createWriteStream({
          filename: mediaFile.id
      });
      myReadableStreamBuffer.pipe(writestream);
      // fs.write(writestream, req.file.buffer);
      writestream.on('close', function (file) {
          // do something with `file`
          console.log(file.filename + 'Written To DB');
      });

      res.json(mediaFile);
  });

});

oApp.get('/api/media/:id', function(req, res) {

  MediaFile.findOne({ id: req.params.id }, function (err, mediaFile) {
    if (err || mediaFile === null) {
        return res.status(500).send('Error occurred: database error');
    }

    res.set('Content-Type', mediaFile.mimetype);

    //read from mongodb
    var readstream = gfs.createReadStream({
         filename: req.params.id
    });
    readstream.pipe(res);
    res.on('close', function () {
         console.log('Stremeando');
    });

  });
});

oApp.get('/api/media', function(req, res){

  gfs.files.find().toArray(function (err, files){
    if (!files || files.length === 0){
      res.status(404).json({message: "No hay acrhivos"})
    }else{
      //res.status(200).json({message: "Si hay acrhivos: "+ files.length})
    
      return res.json(files);

    }



  })


})


// express app listener
oApp.listen(3000, function(){
    console.log('Server listening at 3000');
});
