var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false })


var app = express();
app.set('port', 8080);
app.listen(app.get('port'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const {MongoClient} = require('mongodb')

app.use('/', indexRouter);
app.use('/users', usersRouter);

//connect mongo
const withDb = async (operations,res) => {
  try {
    const client =await MongoClient.connect('mongodb://localhost:27017',{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db("blog")
    await operations(db);
    client.close();
  }catch(err) {
    res.status(500).json({message: err.message});
  }
}


//get comment mongodb database
app.get('/api/articles/:name', async(req, res) => {

  withDb(async(db) => {
    const articles = req.params.name;
    const articleInfo =await db
      .collection('articles')
      .findOne({name : articles})
    res.status(200).json(articleInfo);
  },res);  
});

//post comment mongodb database
app.post('/api/articles/:name/add-comments',(req, res) => {
  const {username, text} = req.body;
  const articleName = req.params.name;
  withDb(async(db) => {
    const articleInfo = await db
    .collection('articles')
    .findOne({name : articleName});
    await db.collection('articles').updateOne(
      {name : articleName},
      {
        $set : {
          Comments : articleInfo.Comments.concat({username : username,
            text:text}),

        },
      }
    );
    const updatedArticle = await db
    .collection('articles')
    .findOne({name : articleName});
    res.status(200).json(updatedArticle);
  },res)
})

const articlesInfo = {
  'learn-react':{
    Comments: [],
  },
  'learn-node':{
    Comments: [],
  },
  'my-thoughts-on-learning-react':{
    Comments: [],
  }
}

// app.post('/api/articles/:name/add-comments',(req, res)=>{
//     const {username,text} = req.body;
//     const articleName = req.params.name;
//     console.log(req.body)
//     articlesInfo[articleName].Comments.push({username,text});
//     res.status(200).send(articlesInfo[articleName]);
// })

//get leaning
app.get("/postUplod/:id", function(req, res){
  res.send(`hello ${req.params.id}`);
})

//dwsdw

//post request
app.post('/postreq',jsonParser,function(req, res) {
  console.log(JSON.stringify(req.body));
  res.send("hello "+req.body.name);
})
app.post('/api/postuser', urlencodedParser, function (req, res) {
  console.log(req.body.name)
  res.send('welcome, ' + req.body.name)
})
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});




// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
