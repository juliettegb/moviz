var express = require('express'); // pour importer le module
var request = require ('request');
var mongoose = require('mongoose');
var app = express(); // initialisation du serveur
app.set('view engine', 'ejs');
app.use(express.static('public'));

//var movieList = []; //penser à injecter movie dans movieList
var options = { method: 'GET',
  url: 'https://api.themoviedb.org/3/discover/movie',
  qs:
   { page: '1',
     include_video: 'false',
     include_adult: 'false',
     sort_by: 'popularity.desc',
     region: 'FR',
     language: 'fr-FR',
     api_key: 'ba8fce530ef7796be5f967ea6f6edd54' },
  body: '{}' };

  var option = { server: { socketOptions: {connectTimeoutMS: 30000 } }};
  mongoose.connect('mongodb://moviz:test@ds149865.mlab.com:49865/moviz', option, function(err){
    console.log(err);
  })

  var favSchema = mongoose.Schema({
    id: Number,
    title: String,
    desc: String,
    icon: String,
  });

  var favModel = mongoose.model('Faves', favSchema); // lecteur enregistreur prêt, il a les règles à respecter etc.

app.get('/', function(req, res){
  request(options, function(error, response, body){
    var body = JSON.parse(body);
      console.log(body);
    res.render('home', {body});
  });
});

app.get('/home', function(req, res){
  request(options, function(error, response, body){
    var body = JSON.parse(body);
    //for (var i=0; i<21; i++){
      //var movie = {title: body.results[i].title, desc: body.results[i].overview, icon: "https://image.tmdb.org/t/p/w500/"+body.results[i].poster_path};
      //movieList.push(movie[i]);
      console.log(body);
    //};
    res.render('home', {body});
  });
});

app.get('/addtofav', function(req, res){
  var id= req.query.id;
  console.log(req.query.id);
  request("https://api.themoviedb.org/3/movie/"+id+"?api_key=ba8fce530ef7796be5f967ea6f6edd54&language=fr-FR", function(error, response, datas){
    var datas = JSON.parse(datas);
    console.log(datas);

    var fav = new favModel({ //ordre d'enregistrement
      id: req.query.id,
      title: datas.title,
      desc: datas.overview,
      icon: "https://image.tmdb.org/t/p/w500/"+datas.poster_path,
    });

    fav.save(function (error, datas){ //on est sur de l'asynchrone donc fonction de callback qui sera exécutée lorsque le backend aura fini son boulot!
      console.log(error);
      console.log(datas);
      //favModel.find(function (err, body){ //on refait un find pour que le res.render affiche également les nouvelles entrées
      //});
      request(options, function(error, response, body){
        var body = JSON.parse(body);
        console.log(body);
        res.render('home', {body});
      });
    });
  });
});

app.get('/review', function(req, res){
  var query = favModel.find(); // on stocke le find dans query pour pouvoir l'exécuter que plus tard via .exec
  query.exec(function(err,datas){
    //favModel.find(function(err, datas){
      res.render('review', {datas: datas});
    //});
  });
  //res.render('review', {datas: []});
});

app.get('/contact', function(req,res){
  res.render('contact', {});
});

app.listen(8080, function(){
  console.log('Server listening on port 8080');
});
