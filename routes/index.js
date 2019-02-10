var express = require('express');
var router = express.Router();
const shortid = require('shortid');
let Instagram = require('instagram-nodejs-without-api');

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ users: [] })
  .write();



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

const getUser = (login, password) => {

  return new Promise(resolve => {
    var Insta = new Instagram()

      Insta.getCsrfToken().then((csrf) =>
      {
        Insta.csrfToken = csrf;
      }).then(() => {
            Insta.auth(login, password).then(sessionId => {
              if(sessionId) {
                Insta.sessionId = sessionId            //store sessionId & csrf
                var _user = 
                {
                  id: shortid.generate(),
                  username: login,
                  csrfToken: Insta.csrfToken,
                  sessionId: Insta.sessionId,
                  isActive: true
                }

                console.log(_user);

                resolve(_user);
              }
              else
                resolve(undefined);
      });
    });
});
  
 }

async function doLogin (login, password, res) {
  var user = db.get('users')
  .find({ username: login })
  .value();

  console.log('First user:' + user);
  

  if(user === undefined) {
    console.log('user === undefined')
      user = await getUser(login, password);
      if(user !== undefined) {
        console.log('ret true 1')

      db.get('users')
        .push(user)
        .write();
        res.statusCode = 200;
        res.send({status: 'ok', user: user});
        return;
      } else {
        console.log('return false');
        res.statusCode = 300;
        res.send({status: 'error', message: 'no user found'});
        return;
      }
      
  }
  console.log('ret true 2');
  res.statusCode = 200;
  res.send({status: 'ok', user: user});
    
 }

router.post('/login_instagram', function(req, res, next){
  var login = req.param('login', null);
  var password = req.param('password', null);
  res.cookie('ig_cb', 1);

  console.log('login: '+login+' password: '+password);

  doLogin(login, password, res);
});

module.exports = router;