const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); // this command read all variables from the file and save them into Nodejs environment variables (process.env)
const app = require('./app');
//cannot read process variables inside app.js, because it was not yet configured

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)


dbConnect().catch(err => console.log(err));
 
async function dbConnect() {
  await mongoose.connect(DB).then(() => console.log('Success'));
}




const port = process.env.PORT || 3000;
app.listen(port, () => { //This method is identical to Node’s http.Server.listen() method
    console.log(`App running on port ${port}`);
})