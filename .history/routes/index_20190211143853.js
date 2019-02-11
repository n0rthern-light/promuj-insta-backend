var express = require('express');
var router = express.Router();
const shortid = require('shortid');
const sha256 = require('js-sha256').sha256;
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
                  password: sha256(password),
                  csrfToken: Insta.csrfToken,
                  sessionId: Insta.sessionId,
                  isActive: true
                }

                resolve(_user);
              }
              else {
                console.log('couldnt get user');
                resolve(undefined);
              }

      }).catch(console.error);
    }).catch(console.error);
});

}
/*
async function doLogin (login, password, res) {
  var user = db.get('users')
  .find({ username: login })
  .value();

  var user_by_login_and_pass = db.get('users').find({username: login, password: sha256(password)}).value();
  console.log('First user: ' + user);
  console.log('Second user: ' + user_by_login_and_pass);

  var bPasswordChanged = (user !== undefined && user_by_login_and_pass === undefined);
  var idUserPasswordChanged = '';
  if(bPasswordChanged) {
    idUserPasswordChanged = user.id;
  }
  if(user === undefined || bPasswordChanged) {
    console.log('user === undefined')
      var old_user = user;
      user = await getUser(login, password);
      if(user !== undefined) {
        console.log('ret true 1')

      if(bPasswordChanged) {
        db.get('users').find({id: idUserPasswordChanged}).assign({csrfToken: user.csrfToken, sessionId: user.sessionId, password: user.password}).write();
        user = db.get('users').find({id: idUserPasswordChanged}).value();
      } else {
        db.get('users')
        .push(user)
        .write();
      }

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
*/

async function doLogin(login, password, res) {
  var user = await getUser(login, password);

  if(user === undefined) {
    console.log('couldnt login through instagram');
    res.statusCode = 300;
    res.send({ status: 'error', message: 'no user found' });
    return;
  }

  var user_in_database = db.get('users').find({ username: login }).value();

  if(user_in_database) {
    //update password and rest
    db.get('users').find({ id: user_in_database.id }).assign({ csrfToken: user.csrfToken, sessionId: user.sessionId, password: user.password }).write();
    user = db.get('users').find({ id: user_in_database.id }).value();
  } else {
    //push user to database
    db.get('users')
      .push(user)
      .write();
  }

  res.statusCode = 200;
  res.send({ status: 'ok', user: user });
}

router.post('/login_instagram', function(req, res, next){
  var login = req.param('login', null);
  var password = req.param('password', null);
  res.cookie('ig_cb', 1);

  doLogin(login, password, res);
});







router.post('/request_user_from_token', function(req, res, next){

  var users = db.get('users').value();
  var f_user = undefined;
  var key = '#m@RB^.q&Q.SP^.!';
  var d = new Date();
  var n = d.getUTCHours();
  var token = req.param('token', null);
  users.forEach(function(user){
    //user id + hashed pw + UTC h
    var token_of_user = sha256.hmac(key, user.id + user.password);
    console.log('BE:'+token_of_user);
    console.log('FE:' + token);
    if (token === token_of_user) {
      f_user = user;
    }
  });

  console.log(f_user);
  if(f_user !== undefined) {
    res.statusCode = 200;
    res.send(f_user);
  } else {
    res.statusCode = 300;
    res.send('');
  }

});

module.exports = router;
