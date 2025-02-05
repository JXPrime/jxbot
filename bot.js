const Discord = require('discord.js')
const client = new Discord.Client()
const fs = require('fs');
const readline = require('readline');
const https = require('node:https');

const smilies = [];
const token = process.argv[2];

async function processSmilies() {
  const fileStream = fs.createReadStream('./data/keyfile.txt');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  var i = 0;
  for await (const line of rl) {
    var parts = line.split(/,/);
    var obj = {
      smilie: parts[0],
      location: './data/' + parts[1].trim()
    };

    smilies.push(obj);
    ++i;
  }
  console.log('loaded ' + smilies.length + ' smilies');
}

function refreshSmilies() {
  console.log('refreshing');
  https.get('https://forums.somethingawful.com/misc.php?action=showsmilies', (res) => {
    let rawData = ''

    res.on('data', chunk => {
      rawData += chunk;
    });

    res.on('end', () => {
      console.log('done');
      let fileNames = [];
      let re = /class=\"text\"\>(\:\w+\:)\<\/div\>\s+\<img alt=\"\" src=\"([\w\:\/\-\.]+)/gim;
      let matches;
      while ((matches = re.exec(rawData)) != null) {
        fileNames.push({ fileName: matches[1], url: matches[2] });
      }
      //console.log(fileNames);

      let promises = [];
      let theSmilies = [];

      for (let fileName of fileNames) {
        fetch(fileName.url).then((response) => {
          theSmilies.push({ smilie: fileName.fileName, stream: response.body });
        }, (reason) => {
          console.log('oh no');
          console.log(fileName);
          console.log(reason);
        });
      }
    });
  });
}

processSmilies();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', message => {
  var theSmilie = smilies.find(function (val) {
    return message.content == val.smilie;
  });

  if (!theSmilie)
    return;
  
  const exampleEmbed = new Discord.MessageAttachment(theSmilie.location);

  message.channel.send(exampleEmbed);
})

client.login(token);
