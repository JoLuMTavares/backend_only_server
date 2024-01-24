// Load of the necessary modules

const express = require('express');
const app = express();
app.use(express.json());

require('./userDataModel')(app);
// require('./notesDataModel')(app);
require('./server_routes')(app);

app.listen(1024);
console.log('Server running on port 1024...');