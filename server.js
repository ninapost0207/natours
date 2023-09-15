const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => { // all bugs that occur in synchronous code, but are not handled anywhere
  console.log("uncaughtException!!!!");
  console.log(err.name, err.message);
  process.exit(1); 
});

dotenv.config({ path: './config.env' }); // this command read all variables from the file and save them into Nodejs environment variables (process.env)

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


process.on('unhandledRejection', err => { // handles errors of connection with database that occur out of the express 
  console.log(err.name, err.message);
  server.close(() => { // give time to server to finish all requests that are still pending
    process.exit(1); // code 1 - unhandled fatal exceptions occur (code 0 - terminate when no more sync operations are happening).
  })
});
process.on('SIGTERM', () => {  
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => { 
    console.log('Process terminated') 
  })
});

