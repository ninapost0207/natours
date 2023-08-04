const app = require('./app');


const port = 3000;
app.listen(port, () => { //This method is identical to Node’s http.Server.listen() method
    console.log(`App running on port ${port}`);
})