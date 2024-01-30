const fs = require('fs');
const imageDataURI = require('image-data-uri');
const { stringify } = require('querystring');
const Downloader = require('nodejs-file-downloader');

async function register ({
  registerHook,
  registerSetting,
  settingsManager,
  storageManager,
  peertubeHelpers,
  getRouter,
}) {
    registerSetting({
    name: 'debug-enable',
    default: false,
    label: 'Enable diagnostic log updates',
    type: 'input-checkbox',
    descriptionHTML: 'This will create more extensive logging of program state data both client and server side for finding and resolving errors ',
    private: false
  })
  let enableDebug = await settingsManager.getSetting("debug-enable");
  var base = await peertubeHelpers.config.getWebserverUrl();
  var basePath = peertubeHelpers.plugin.getDataDirectoryPath();
  var serverConfig = await peertubeHelpers.config.getServerConfig();
  var plugins = serverConfig.plugin.registered;
  var hostName = serverConfig.instance.name;
  let hostParts= base.split('//');
  let hostDomain = hostParts.pop();
  if (enableDebug) {
    console.log("⚓⚓ server settings loaded", hostName, hostDomain, base, basePath );
    console.log("⚓⚓ continued", plugins, serverConfig);
  }
  const router = getRouter();
  router.use('/rss', async (req,res) =>{
    if (enableDebug) {
      console.log("⚓⚓⚓⚓ torrent feed request",req.query);
    }
    if (!enableRss) {
      console.log("⚓⚓⚓⚓⚓⚓⚓⚓⚓⚓RSS disabled");
      return res.status(403).send();
    }
    let channel;
    if (req.query.channel == undefined) {
      console.log("⚓⚓no channel requested", req.query);
      return res.status(404).send();
    } else {
      channel = req.query.channel;
    }
    let podData
    let podApi = base + "/plugins/podcast2/router/getpoddata?channel=" + req.query.channel;
    try {
      podData = await axios.get(podApi);
    } catch {
      console.log("unable to load PODCAST data",req.query.channel,podApi);
    }
    let audio;
    if (podData) {
      console.log("⚓⚓\n\n\n\n pod data \n", podData.data);
      if (podData.data && podData.data.medium){
        if (podData.data.medium == 'audiobook' || podData.data.medium == 'music' || podData.data.medium == 'podcast'){
          audio=true;
        }
      }
    }
    let apiUrl = base + "/api/v1/video-channels/" + channel;
    let channelData;
    try {
      channelData = await axios.get(apiUrl);
    } catch {
      console.log("⚓⚓⚓⚓unable to load channel info", apiUrl);
      return res.status(400).send();
    }
    if (enableDebug) {
      console.log("⚓⚓⚓⚓ channel Data",channelData.data);
    }
    apiUrl = `${base}/api/v1/video-channels/${channel}/videos`;
    let videoData;
    try {
      videoData = await axios.get(apiUrl);
    } catch {
      console.log("⚓⚓⚓⚓unable to load video  info", apiUrl);
      return res.status(400).send();
    }
    if (enableDebug) {
      console.log("⚓⚓⚓⚓ video Data",videoData.data);
    }
    if (videoData && videoData.data ){
      videoList = videoData.data.data;
    } else {
      videoList = [];
    }
    if (enableDebug) {
      console.log("⚓⚓⚓⚓ video list",videoList);
    }
    let rss = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`;
    let indent =4;
    rss = rss +"\n"+' '.repeat(indent)+`<channel>`;
    indent = indent+4;
    rss = rss + `\n`+' '.repeat(indent)+`<title>${channelData.data.displayName.replace(/\W+/g, " ")}</title>`;
    rss = rss + `\n`+' '.repeat(indent)+`<link>${channelData.data.url}</link>`;
    if (channelData.data.description){
      rss = rss + `\n`+' '.repeat(indent)+`<description> ${channelData.data.description.replace(/\W+/g, " ")} </description>`;
    } else {
      rss = rss + `\n`+' '.repeat(indent)+`<description> indescribable </description>`;
    }
    let atomLink = base + "/plugins/podcast2/router/torrent?channel=" + channel;
    rss = rss + `\n`+' '.repeat(indent)+`<atom:link href="${atomLink}" rel="self" type="application/rss+xml" />`;
    for (var video of videoList){
      rss = rss + `\n`+' '.repeat(indent)+`<item>`;
      indent = indent + 4;
      rss = rss + `\n`+' '.repeat(indent)+`<title>${video.name.replace(/\W+/g, " ")}</title>`;
      
      if (video.description){
        rss = rss + `\n`+' '.repeat(indent)+`<description>`;
        indent=indent+4;
        rss = rss + `\n`+' '.repeat(indent)+`${video.description.replace(/\W+/g, " ")}`;
        indent=indent-4;
        rss = rss + `\n`+' '.repeat(indent)+`</description>`;
      } else {
        rss = rss + `\n`+' '.repeat(indent)+`<description/>`;
      }
      
      let apiUrl = `${base}/api/v1/videos/${video.uuid}`;
      let videoSpecificData;
      let torrentUrl, fileSize, magnet, tracker, pubDate,rawDate;
      try {
        videoSpecificData = await axios.get(apiUrl);
      } catch (err) {
        console.log("⚓⚓⚓⚓unable to load video specific info", apiUrl,err);
        return res.status(400).send();
      }
      if (enableDebug) {
        let v;
        v = videoSpecificData.data;
        console.log("⚓⚓⚓⚓ video specific data",v,v.files,v.streamingPlaylists[0],v.streamingPlaylists[0].files);
      }
      
      torrentUrl = videoSpecificData.data.streamingPlaylists[0].files[0].torrentUrl;
      fileSize =   videoSpecificData.data.streamingPlaylists[0].files[0].size;
      magnet = videoSpecificData.data.streamingPlaylists[0].files[0].magnetUri;
      tracker = videoSpecificData.data.trackerUrls[0];
      console.log("⚓⚓⚓⚓ published", pubDate);
      let fileName = video.name;
      console.log("⚓⚓⚓⚓ found file name", fileName);
      rss = rss + `\n`+' '.repeat(indent)+`<enclosure type="application/x-bittorrent" url="${torrentUrl}" length="${fileSize}" />`;
      rss = rss + `\n`+' '.repeat(indent)+`<link>${torrentUrl}</link>`;
      rss = rss + `\n`+' '.repeat(indent)+`<guid>${torrentUrl}</guid>`;
      //rss = rss + `\n`+' '.repeat(indent)+`<media:content url="${torrentUrl}" fileSize="${fileSize}" />`;
      if (videoSpecificData.data.originallyPublishedAt){
        rawDate = videoSpecificData.data.originallyPublishedAt;
      } else {
        rawDate = videoSpecificData.data.publishedAt;
      }
        let newDate = new Date(rawDate);
      pubDate = newDate.toUTCString();

      console.log("⚓⚓⚓⚓ published", rawDate, "new format",newDate, "final format",pubDate);
      rss = rss + `\n`+' '.repeat(indent)+`<pubDate> ${pubDate} </pubDate>`;
      
      /*
      rss = rss + `\n`+' '.repeat(indent)+`<torrent>`;
      indent=indent +4;
      rss = rss + `\n`+' '.repeat(indent)+`<filename> ${fileName} </filename>`;
      rss = rss + `\n`+' '.repeat(indent)+`<contentlength> ${fileSize} </contentlength>`;
      rss = rss + `\n`+' '.repeat(indent)+`<magneturi> ${magnet} <magneturi>`;
      rss = rss + `\n`+' '.repeat(indent)+`<trackers>`;
      indent = indent +4;
      rss = rss + `\n`+' '.repeat(indent)+`<group order="ordered">`;
      indent = indent+4;
      rss = rss + `\n`+' '.repeat(indent)+`<tracker seeds="1" peers="1">`;
      indent = indent + 4;
      rss = rss + `\n`+' '.repeat(indent)+tracker;
      indent = indent - 4
      rss = rss + `\n`+' '.repeat(indent)+`</tracker>`;
      indent = indent -4;
      rss = rss + `\n`+' '.repeat(indent)+`</group>`;
      indent = indent - 4
      rss = rss + `\n`+' '.repeat(indent)+`</trackers>`;
      indent = indent -4;
      rss = rss + `\n`+' '.repeat(indent)+`</torrent>`;
      */
      indent = indent -4;
      
      rss = rss + `\n`+' '.repeat(indent)+`</item>`;
    }
    indent = indent-4;
    rss = rss + `\n`+' '.repeat(indent)+`</channel>`;
    rss = rss + `\n</rss>\n`;
    res.setHeader('content-type', 'application/rss+xml');
    return  res.status(200).send(rss);
  })

}
async function unregister () {
  return
}

module.exports = {
  register,
  unregister
}
