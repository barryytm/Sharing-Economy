var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser')
var router = express.Router();
var update_handler = require("./handle_update.js");



var pg = require('pg');

var expressValidator = require('express-validator');

var sess;

router.use(session({secret: 'shhhhh',
                    resave: true,
                    saveUninitialized: false,
                    cookie: {maxAge: 50000}}));

router.use( bodyParser.json() );       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

router.use(expressValidator({
    customValidators: {

        isValid: function(value) {
            
            console.log("im value:       " + value);
            var usrRegex = new RegExp("^[a-zA-Z0-9äöüÄÖÜ]*$");           
            
            if (usrRegex.test(value)) {
                return true;
            }
            return false;
        },

        isCorrectPW: function(value, q) {
            console.log("im value:       " + value);
            console.log("im q:       " + q);
            if (q == undefined || JSON.parse(q).password != value  ) {
                return false;
            }

            return true;


        },

        doesExist: function(value, q) {
            if (q == undefined) {
                return true;
            } else {
                if (value == JSON.parse(q).email)
                    return false;
                else {
                    return true;
                }
            }
        }, 

        doesNotExist: function(value, q) {
            if (q == undefined) {
                return false;
            } else {
                if (value == JSON.parse(q).email)
                    return true ;
            }
        }, 

        usernameAvailable: function(value, q) {
           
            if (q == undefined ||   JSON.parse(q).username != value ){

                return true;
            } else{
                return false;
            }
            
        }
    }


}));


router.post('/login', function(req, res){
    sess = req.session;


    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query('SELECT * FROM wanderland.user_account WHERE wanderland.user_account.email = ' +  
                "'"+ req.body.email + "'" +  ' AND wanderland.user_account.password =' + "'" + 
                req.body.pass + "'" , function(err, result) {
                    done();
                    if (err) {
                        console.error(err); 
                        res.send("Error " + err); 
                     }
                    else {                  
                        console.log("hhahahahah" + JSON.stringify(result.rows[0]));
                        
                        req.checkBody("email", 'Wrong email and password combination').doesNotExist(JSON.stringify(result.rows[0]));

                        var errors = req.validationErrors();
                        var mappedErrors = req.validationErrors(true);

                        if (errors) {

                            var errorMsgs = { "errors": {} };
                            
                            errorMsgs.errors.status = "display: block";
                            

                            if ( mappedErrors.email ) 
                                errorMsgs.errors.error_email = mappedErrors.email.msg;                            
                        
                            res.end('loginFail');

                            
                                



                        } else {
                            sess.email = req.body.email;
                            sess.pass = req.body.pass;                            
                            res.end('done');                           

                        }
                        
                }
            });
        });    
});



var tool = require('./public/assets/js/db_function');


router.get('/', function(req, res) {
    sess = req.session;
   
   
    console.log(sess.error_msg);
    //console.log("here " + req.pass);
    //console.log("here " + sess.email);

    //console.log(expressValidator);
    
   
    if (sess.email) {
       /* pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query('SELECT * FROM wanderland.user_account WHERE wanderland.user_account.email = ' +  
                "'"+ sess.email + "'" , function(err, result) {
                    done();
                    if (err) {
                        console.error(err); 
                        res.send("Error " + err); 
                     }
                    else {  
                        res.render('profile', {

                            results: result.rows,
                            errors: ' '
                            });

                    }
                }); 
        });*/
        res.redirect('/profile');
    } else {

        if (!sess.error_msg) {
            sess.error_msg = '';
            res.render('index', {
                            errors: sess.error_msg
                            
                            });

        } else {
            console.log(sess.error_msg.errors);
            res.render('index', {
                            errors: sess.error_msg.errors
                            
                            });

        }

        
        
                   
        
    }
    
});

router.get('/profile', function(req, res){
    sess=req.session;
    



    if (sess.email){

        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query('SELECT * FROM wanderland.user_account WHERE wanderland.user_account.email = ' +  
                "'"+ sess.email + "'" , function(err, result) {
                    done();
                    if (err) {
                        console.error(err); 
                        res.send("Error " + err); 
                     }
                    else {  
                        res.render('profile', {
                            
                            results: result.rows,
                            errors: ' '
                            });

                    }
                });
        });

    } else {
        res.redirect('/');
    }


});

router.get('/logout',function(req,res){
    req.session.destroy(function(err) {
      if(err) {
        console.log(err);
        res.end(err);                
      } else {
        
        res.redirect('/');
      }
});
});

router.post('/account', function(req, res){
    sess = req.session;

    var account = req.body.email;
    var password = req.body.password;
    
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query('SELECT * FROM wanderland.user_account WHERE wanderland.user_account.email = ' +  
                "'"+ sess.email + "'" +  ' AND wanderland.user_account.password =' + "'" + 
                password + "'" , function(err, result) {
                    done();
                    if (err) {
                        console.error(err); 
                        res.send("Error " + err); 
                     }
                    else {                  
                        console.log(JSON.stringify(result.rows[0]));
                        
                        req.checkBody("email", 'Wrong email and password combination').doesNotExist(JSON.stringify(result.rows[0]));

                        var errors = req.validationErrors();
                        var mappedErrors = req.validationErrors(true);

                        if (errors) {

                            var errorMsgs = { "errors": {} };
                            
                            errorMsgs.errors.status = "display: block";
                            console.log(errorMsgs.errors.status);

                            

                            if ( mappedErrors.email ) 
                                errorMsgs.errors.error_email = mappedErrors.email.msg;
                            console.log(errorMsgs.errors.error_email);

                            res.render('index', errorMsgs);


                        } else {
                            sess.email = account;


                            res.render('profile', {
                            errors: '', 
                            results: result.rows
                            });

                        }
                        
                }
            });
        });    
});

router.post('/signup', function(req, res){
    
    var account = req.body.emailNew; 
    var password = req.body.password;
    var username = req.body.username;

    sess = req.session;

   
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query('SELECT * FROM wanderland.user_account WHERE user_account.email = ' + 
            "'" + account + "'" +  ' OR user_account.username =' + "'" + username + "'" , 
            function(err, result) {
                done();            
                if (err) {
                    console.error(err); 
                    res.send("Error " + err);

                 } else {
                    
                    if (result.rows.length === 2) {
                        req.checkBody("username", "Username already exists. Please choose another username.").usernameAvailable(JSON.stringify(result.rows[1]));
                        req.checkBody("username", "Special characters are not allowed in Username.").isValid();
                        req.checkBody("emailNew", 'Email already exists. Plese choose another email address.').doesExist(JSON.stringify(result.rows[0]));
                    } else {
                        
                        req.checkBody("username", "Username already exists. Please choose another username.").usernameAvailable(JSON.stringify(result.rows[0]));
                        req.checkBody("username", "Special characters are not allowed in Username.").isValid();
                        req.checkBody("emailNew", 'Email already exists. Plese choose another email address.').doesExist(JSON.stringify(result.rows[0]));
                    }
                
                    var errors = req.validationErrors();
                    var mappedErrors = req.validationErrors(true);

                    if (errors) {

                            var errorMsgs = { "errors": {} };
                            
                            errorMsgs.errors.status = "display: block";
                            

                            if ( mappedErrors.username ) 
                                errorMsgs.errors.error_username = mappedErrors.username.msg;
                            if ( mappedErrors.emailNew ) 
                                errorMsgs.errors.error_emailNew = mappedErrors.emailNew.msg;
                            
                            res.render('index', errorMsgs);


                        } else {
                            

                            pg.connect(process.env.DATABASE_URL, function(err, client, done) {
                            

                            client.query('INSERT INTO wanderland.user_account (username, email, password, first_name, last_name, profile_pic, gender, phone_num, city_id, country_id, date_of_birth, date_joined, description) VALUES (' + 
                                "'" + username + "'" +  ", '" + account + "'" + ", '" + password + "'" +', ' + 'NULL' + ', ' + 'NULL, ' + 'NULL, '  + 'NULL, ' + ' NULL, ' +  'NULL'  + ', '  + 'NULL' +  ',NULL, ' + 
                                'NULL, ' + 'NULL' + ');', function(err, result){
                                done();

                                if (err) {
                                    console.error(err); 
                                    res.send("Error " + err);
                                }

                                sess.email = account;
                                console.log("111111122222" + sess.email);

                                pg.connect(process.env.DATABASE_URL, function(err, client, done) {                           
                            client.query('SELECT * FROM wanderland.user_account WHERE user_account.email = ' + 
                                "'" + account + "'" +  ' AND wanderland.user_account.password =' + "'" + 
                                password + "'" +  ' AND wanderland.user_account.username =' + "'" + 
                                username + "'", function(err, result){
                                    console.log("55555555       " + JSON.stringify(result.rows));
                                    done();
                                    if (err) {
                                        console.error(err); 
                                        res.send("Error " + err);
                                    } else {
                                        console.log("11111111111   " + JSON.stringify(result.rows));
                                        //sess.email = account;
                                        res.render('profile', {
                                            results: result.rows,
                                            errors: ''

                                        });
                                    }
                            });                            
                        });

                            });                            
                        });
                            
                        

                        }                            
                }             
        });
    });
});

router.post('/updatePassword', function(req, res){
    sess=req.session;
    var currPW = req.body.cpassword;
    var newPW = req.body.npassword;
    if (sess.email) {

        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query('SELECT * FROM wanderland.user_account WHERE wanderland.user_account.email = ' +  
                "'"+ sess.email + "'" +  ' AND wanderland.user_account.password =' + "'" + currPW + "'", function(err, result) {
                    done();
                    if (err) {
                        console.error(err); 
                        res.send("Error " + err); 
                    }
                    else { 
                        req.checkBody("cpassword", "Wrong password entered. Password not updated.").isCorrectPW(JSON.stringify(result.rows[0]));

                        var errors = req.validationErrors();
                        var mappedErrors = req.validationErrors(true);

                        if (errors) {
                            
                            var errorMsgs = { "errors": {} };
                            
                            //errorMsgs.errors.status = "display: block";
                            

                            if ( mappedErrors.cpassword ) 
                                errorMsgs.errors.error_npw = mappedErrors.cpassword.msg;
                            
                            
                            pg.connect(process.env.DATABASE_URL, function(err, client, done) {
                                        client.query('SELECT * FROM wanderland.user_account WHERE wanderland.user_account.email = ' +  
                                            "'"+ sess.email + "'" , function(err, result) {
                                                done();
                                                console.log(JSON.stringify(result.rows[0]));
                                                if (err) {
                                                    console.error(err); 
                                                    res.send("Error " + err); 
                                                 }
                                                else {  
                                                    console.log(errorMsgs);

                                                    res.render('profile', {results: result.rows, errors: errorMsgs.errors});



                                                }
                                            }); 
                                    });

                        } else {
                            pg.connect(process.env.DATABASE_URL, function(err, client, done) {
                            

                            client.query('UPDATE wanderland.user_account SET password = ' + "'" + newPW + "'" + 'WHERE user_account.email = ' +  "'"+ sess.email + "'" , function(err, result){
                                done();

                                if (err) {
                                    console.error(err); 
                                    res.send("Error " + err);
                                } else {

                                    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
                                        client.query('SELECT * FROM wanderland.user_account WHERE wanderland.user_account.email = ' +  
                                            "'"+ sess.email + "'" , function(err, result) {
                                                done();
                                                if (err) {
                                                    console.error(err); 
                                                    res.send("Error " + err); 
                                                }
                                                else {  
                                                    res.render('profile', {

                                                        results: result.rows,
                                                        errors: ''
                                                        });

                                                }
                                            }); 
                                    });
                                }

                            });                            
                        });



                        }
                        

                    }
                }); 
        });

    }


    
    

});

router.post('/update_email', function(req, res){
    sess=req.session;
    var newEmail = req.body.newEmailValue;

    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query('SELECT * FROM wanderland.user_account WHERE user_account.email = ' + 
            "'" + newEmail + "'" , function(err, result) {
                done();            
                if (err) {
                    console.error(err); 
                    res.send("Error " + err);

                } else {
                        req.checkBody("newEmailValue", 'Email already exists. Plese choose another email address.').doesExist(JSON.stringify(result.rows[0]));
                    
                        var errors = req.validationErrors();
                        var mappedErrors = req.validationErrors(true);

                        if (errors) {

                            var errorMsgs = { "errors": {} };                            
                            
                            if ( mappedErrors.newEmailValue ) 
                                errorMsgs.errors.error_newEmailValue = mappedErrors.newEmailValue.msg;
                                update_handler.sendDefault(sess.email, errorMsgs.errors, req, res);

                        }  else {
                            //sess.email = newEmail;
                            update_handler.update_email(newEmail, sess, req, res);
                            
                        }
                            

                        

                }

});
});
});
// Post page
router.get('/post/:postId', function(req, res){
    var username, type, post_date, way_of_travelling, travel_start_date, travel_end_date;

    tool.get_info_by_post_id(req.params.postId, function(result){
        if (result === 'error') {
          res.send('No such result in database');
        }else{
          // res.send(result['post_date']);
          // console.log('result[0]: '+result[0]);
          console.log('result.username: '+result.username);

          // username = result['username'];
          // post_date = result['post_date'];
          // console.log('username: '+username);
          // console.log('post_date: '+post_date);
          res.render('post', {result: result});

        };
    });
    // console.log(typeof post_date.toISOString());
    // post_date = post_date.toISOString();
    // tool.tmp();
    // res.send('This is post page with id is '+req.params.postId);
});


router.post('/update_name', function(req, res){
    sess=req.session;
    var first_name = req.body.newNameFirst;
    var last_name = req.body.newNameLast;
    update_handler.update_name(first_name, last_name, sess.email, req, res);
});

router.post('/update_address', function(req, res){
    sess=req.session;
    var city = req.body.newCity;
    var country = req.body.newCountry;
    update_handler.update_address(city, country, sess.email, req, res);
});

router.post('/update_phone', function(req, res){
    sess=req.session;
    var phone_num = req.body.newPhone;
    
    update_handler.update_phone(phone_num, sess.email, req, res);
});

router.post('/update_dob', function(req, res){
    sess=req.session;
    var dob = req.body.newDOB;
    
    update_handler.update_dob(dob, sess.email, req, res);
});

router.post('/update_gender', function(req, res){
    sess=req.session;
    var gender = req.body.newGender;
    
    update_handler.update_gender(gender, sess.email, req, res);
});

router.post('/update_desc', function(req, res){
    sess=req.session;
    var desc = req.body.newDesc;
    
    update_handler.update_description(desc, sess.email, req, res);
});





module.exports = router;

