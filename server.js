const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); // this command read all variables from the file and save them into Nodejs environment variables (process.env)

process.on('uncaughtException', err => {
  console.log("uncaughtException!!!!");
  console.log(err.name, err.message);
  process.exit(1); 
});

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD).replace('<USER>', process.env.DB_USER)



async function dbConnect() {
  await mongoose.connect(DB).then(() => console.log('Successful DB connection'));
}

dbConnect().catch(err => console.log(err.name, err.message));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => { //This method is identical to Node’s http.Server.listen() method
    console.log(`App running on port ${port}`);
})


process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  })
});


