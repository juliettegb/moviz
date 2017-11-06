var express = require('express'); // pour importer le module
var request = require ('request');
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

app.get('/', function(req, res){
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

app.listen(8080, function(){
  console.log('Server listening on port 8080');
});
