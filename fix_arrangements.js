const mongoose = require('mongoose');

async function fixArrangements() {
  await mongoose.connect('mongodb+srv://burimhod_db_user:tLrAkDi2F5JH48ud@agim-tours-cluster-0.cfnbout.mongodb.net/?appName=agim-tours-cluster-0');
  
  const Agency = mongoose.model('Agency', new mongoose.Schema({}, { strict: false }), 'agencies');
  const Arrangement = mongoose.model('Arrangement', new mongoose.Schema({}, { strict: false }), 'arrangements');
  const Ticket = mongoose.model('Ticket', new mongoose.Schema({}, { strict: false }), 'tickets');

  const agency = await Agency.findOne({});
  if (!agency) {
    console.log('No agency found to associate with.');
    return;
  }

  console.log(`Using agency: ${agency.name} (${agency._id})`);

  const resArr = await Arrangement.updateMany(
    { agency: { $exists: false } },
    { $set: { agency: agency._id } }
  );
  console.log(`Updated ${resArr.modifiedCount} arrangements.`);

  const resTick = await Ticket.updateMany(
    { agency: { $exists: false } },
    { $set: { agency: agency._id } }
  );
  console.log(`Updated ${resTick.modifiedCount} tickets.`);

  await mongoose.disconnect();
}

fixArrangements().catch(console.error);
