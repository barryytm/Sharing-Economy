var pg = require('pg');
var client = 
module.exports = {
	get_info_by_post_id : function(post_id, callback){
		pg.connect(process.env.DATABASE_URL, function(err, client, done) {
			client.query('SELECT * FROM product_post WHERE post_id ='+post_id, function(err, result){
				done();
				if (err) {
					console.log(err);
				}
				else{
					if (JSON.stringify(result.rows) === "[]") {
						console.log('-1');
						callback('-1');
					} else {
						console.log(result.rows[0].type);
						console.log('1: '+typeof result.rows[0].type);
						callback(result.rows[0].type);
					}
				}
			});

		});

		console.log('i have been called');
	}
};
