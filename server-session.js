var express = require('express'); // pour importer le module
var request = require ('request');
var mongoose = require('mongoose');
var session = require("express-session");
var bodyParser = require('body-parser')
var app = express(); // initialisation du serveur

const stripe = require("stripe")("sk_test_vThh3OIl813enaLYiv7CRoWs");

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false })); //on enrichit express du body-parser
app.use(bodyParser.json()); //same here
app.use(
 session({
  secret: 'a4f8071f-c873-4447-8ee2',
  resave: false,
  saveUninitialized: false,
 })
);

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
    userID: String,
  });

  var userSchema = mongoose.Schema({
    mail: String,
    pw: String,
  });

  var favModel = mongoose.model('Faves', favSchema); // lecteur enregistreur prêt, il a les règles à respecter etc.
  var userModel = mongoose.model('Users', userSchema);

app.get('/', function(req, res){
  //console.log(req.session.userID);
  request(options, function(error, response, body){
    var body = JSON.parse(body);
    //console.log(body);
    var query = favModel.find({userID: req.session.userID}); // le find permet de n'afficher que les coeurs propres au user connecté
    query.exec(function(err,datas){
      res.render('home', {body: body, datas: datas, userID: req.session.userID}); //envoi des films webservice + films favoris BDD vers le ejs
    });
  });
});

app.get('/home', function(req, res){
  //console.log(req.session.userID);
  request(options, function(error, response, body){
    var body = JSON.parse(body);
    //console.log(body);
    var query = favModel.find({userID: req.session.userID});
    query.exec(function(err,datas){
      res.render('home', {body: body, datas: datas, userID: req.session.userID});//pour les boutons du header???
    });
  });
});

app.get('/addtofav', function(req, res){
  if(req.session.userID == undefined){
    res.redirect('/');
  } else {
    var id= req.query.id;
    request("https://api.themoviedb.org/3/movie/"+id+"?api_key=ba8fce530ef7796be5f967ea6f6edd54&language=fr-FR", function(error, response, datas){
      var datas = JSON.parse(datas);
      //console.log(datas);

        var fav = new favModel({ //ordre d'enregistrement
          id: req.query.id,
          title: datas.title,
          desc: datas.overview,
          icon: "https://image.tmdb.org/t/p/w500/"+datas.poster_path,
          userID: req.session.userID,
        });

      fav.save(function (error, datas){ //on est sur de l'asynchrone donc fonction de callback qui sera exécutée lorsque le backend aura fini son boulot!
        //console.log(error);
        //console.log(datas);
        /* A la place du redirect:
        request(options, function(error, response, body){
          var body = JSON.parse(body);
          console.log(body);
          res.render('home', {body, datas}); //datas? et avant le render ajouter var query + query.exec?
        });*/
        res.redirect('/'); //remplace la portion request(options...) jusqu'au res.render('home') //// Voir correction Noël pour plus d'ex de factorisation (condition du displayLike et autres infos qu'on passe à l'ejs via le render)
      });
    });
  };
});

app.get('/review', function(req, res){
  //console.log(req.session.userID);
  var query = favModel.find({userID: req.session.userID}); // on stocke le find dans query pour pouvoir l'exécuter que plus tard via .exec
  query.exec(function(err,datas){
    res.render('review', {datas: datas, userID: req.session.userID});
  });
});

app.get('/contact', function(req,res){
  res.render('contact', {userID: req.session.userID});
});

app.get('/signup', function(req,res){ //ou signupform mais en fait on peut distinguer les "deux routes" en gardant signup mais avec app.get et app.post
  res.render('signup', {userID: req.session.userID}); //userID: undefined puisque pas encore signed up
});

app.post('/signup', function(req,res){ //get: pour lire, post: plutôt pour écrire et il existe d'autres type d'envoi (protocoles d'échange HTTP)
  var query = userModel.find(); // on stocke le find dans query pour pouvoir l'exécuter que plus tard via .exec
  query.exec(function(err,datas){
    var user = new userModel({
      mail: req.body.mail,
      pw: req.body.pw,
    });
    user.save(function (error, body){ //on est sur de l'asynchrone donc fonction de callback qui sera exécutée lorsque le backend aura fini son boulot!
      console.log(error);
      //console.log(datas);
      console.log("Inscription ok");
      res.redirect('/'); //remplace la portion request(options...) jusqu'au res.render('home') //// Voir correction Noël pour plus d'ex de factorisation (condition du displayLike et autres infos qu'on passe à l'ejs via le render)
    });
  });
});

app.get('/signin', function(req,res){
  res.render('signin', {userID: undefined, error: false}); //undefined car pas encore signed in et pas d'erreur car on propose le form pr la première fois à l'utilisateur
});

app.post('/signin', function(req,res){
  var signin = false;
  var query = userModel.find();
  query.exec(function(err,datas){ //autre solution + optimale: findOne (mail=req.query.mail, pw....)
    var isLogged = false;
    for(var i=0; i<datas.length; i++){
      if (req.body.mail == datas[i].mail && req.body.pw == datas[i].pw){
        req.session.userID = datas[i]._id;
        isLogged = true;
        console.log("Identification ok");
        console.log("Utilisateur en session: "+datas[i]._id);
      } /*else {
        console.log("Identification failed"); //pour tous les autres users en fait
      }*/
    };

    if (isLogged == true){
      res.redirect('/');
    } else {
      res.render('signin',{userID: undefined, error: true}); //userID: req.session.userID et erreur : true or false, si true (cas "else" alors nouvel envoi du form avec alerte et si dans le "if" ça reste à false
    }
  });
});

app.get('/signout', function(req,res){
  req.session.userID = undefined;
  res.redirect('/');
  console.log("Successful logout");
});

app.get('/search', function (req, res) {
 var text = req.query.text;
  request("https://api.themoviedb.org/3/search/movie?api_key=ba8fce530ef7796be5f967ea6f6edd54&language=fr-FR&query="+text+"&page=1&include_adult=false", function(error, response, body) {
    var test = [];
    var movieList = JSON.parse(body);
    for (var i=0; i<movieList.length; i++){
      test[i] = false;
    };

    favModel.find(function (err, datas) {
      res.render('search', {
      movieList: movieList,
      datas: datas,
      body: movieList,
      test : test,
      userID: req.session.userID
      });
    });
  });
});

app.post("/buy", function(req, res) {
  let amount = 500;

  stripe.customers.create({
    email: req.body.stripeEmail,
    source: req.body.stripeToken
  })
  .then(customer =>
    stripe.charges.create({
      amount,
      description: req.body.titleMovie,
      currency: "eur",
      customer: customer.id
    }))
  .then(charge => res.send("Ok"));
});

var port = process.env.PORT || 8080;
app.listen(port, function (){
  console.log("Server listening on port"+port);
});

/*app.listen(8080, function(){
  console.log('Server listening on port 8080');
});*/
