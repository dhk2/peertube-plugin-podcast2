async function register ({
  registerHook,
  registerSetting,
  settingsManager,
  storageManager,
  videoCategoryManager,
  videoLicenceManager,
  videoLanguageManager
}) {
  var base = await peertubeHelpers.config.getWebserverUrl();
  var serverConfig = await peertubeHelpers.config.getServerConfig();
  var hostName = serverConfig.instance.name;
  console.log("⚡️⚡️ home url",base,hostName);
  const router = getRouter();
  router.use('/podcast2', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ podcast2 request ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️", req.query);
    }
    if (!enableRss) {
      console.log("⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️RSS disabled");
      return res.status(403).send();
    }
    if (req.query.channel == undefined) {
      console.log("⚡️⚡️no channel requested", req.query);
      return res.status(404).send();
    }
    let channel = req.query.channel
    let apiUrl = base + "/api/v1/video-channels/" + channel;
    let channelData;
    try {
      channelData = await axios.get(apiUrl);
    } catch {
      console.log("⚡️⚡️⚡️⚡️unable to load channel info", apiUrl);
      return res.status(400).send();
    }
    let smallChannelAvatar, largeChannelAvatar, smallPersonAvatar, largePersonAvatar
    if (channelData && channelData.data && channelData.data.avatars && channelData.data.avatars[1]) {
      smallChannelAvatar = channelData.data.avatars[0].path;
      largeChannelAvatar = channelData.data.avatars[1].path;
    }
    if (channelData && channelData.data && channelData.data.ownerAccount && channelData.data.ownerAccount.avatars && channelData.data.ownerAccount.avatars[1]) {
      smallPersonAvatar = channelData.data.ownerAccount.avatars[0].path;
      largePersonAvatar = channelData.data.ownerAccount.avatars[1].path;
    }
    //console.log("⚡️⚡️⚡️⚡️channel info", channelData.data);
    
    let rssUrl = base + "/feeds/podcast/videos.xml?videoChannelId=" + channelData.data.id;
    let rssData;
    try {
      rssData = await axios.get(rssUrl)
    } catch {
      console.log("⚡️⚡️unable to load rss feed for", channel, rssUrl);
      return res.status(400).send();
    }
    //console.log("⚡️⚡️loaded rss feed from", rssUrl);
    let channelGuid;
    apiUrl = base + "/plugins/lightning/router/getchannelguid?channel=" + channel;
    try {
      let guidData = await axios.get(apiUrl);
      if (guidData && guidData.data) {
        //console.log("⚡️⚡️channel guid", guidData.data);
        channelGuid = guidData.data;
      }
    } catch {
      console.log("⚡️⚡️unable to load channel guid", apiUrl);
    }
    //TODO figure out how to get info for livechat plugin as well
    let podData
    try {
      podData = await axios.get(base + "/plugins/lightning/router/getpoddata?channel=" + channel);
    } catch {
      console.log("unable to load PODCAST data");
    }
    if (podData) {
      console.log("⚡️⚡️\n\n\n\n pod dta \n", podData.data);
    }
    let counter = 0;
    let fixed = "";
    let spacer = "";
    let rss = rssData.data;
    let lines = rss.split('\n');
      console.log("⚡️⚡️\n\n\n\n starting linbe loop \n", lines.length,lines[33]);
    //for (const line of lines) {
    let totalSize = lines.length;
    while (counter<totalSize){
      let line = lines[counter];
      //console.log(`⚡️line${counter}:`,line)
      counter++;
      spacer = line.split("<")[0];
      if (line.includes("Toraifōsu") && podData && podData.data) {

        if (podData.data.text) {
          line = line + `\n${spacer}<podcast:txt>${podData.data.text[0]}</podcast:txt>`;
        }
        if (podData.data.feedguid) {
          line = line + `\n${spacer}<podcast:guid>${podData.data.feedguid}</podcast:guid>`;
        }
      }
      if (line.includes("<atom:link")) {
        line = `${spacer}<atom:link href="https://${req.get('host')}${req.originalUrl}" rel="self" type="application/rss+xml" />`;
      }
      var customData = {};
      if (line.includes('<guid')) {
        let shortUuid = line.split(">")[1].split("<")[0].split("/")[4]
        try {
          var videoData = await axios.get(base + "/api/v1/videos/" + shortUuid);
          if (videoData && videoData.data) {
            customData = videoData.data.pluginData;
          }
        } catch (err) {
          console.log("⚡️⚡️⚡️⚡️hard error trying to get video data for RSS feed", err);
        }
        if (enableDebug) {
          console.log("⚡️⚡️⚡️⚡️item plugin data", shortUuid, customData);
        }
        /* moved to shared code 
        if (customData.seasonnode) {
          if (customData.seasonname) {
            line = line + `\n${spacer}<podcast:season name ="${customData.seasonname}">${customData.seasonnode}</podcast:season>`;
          } else {
            line = line + `\n${spacer}<podcast:season>${customData.seasonnode}</podcast:season>`;
          }
        }
        if (customData.episodenode) {
          if (customData.episodename) {
            line = line + `\n${spacer}<podcast:episode display ="${customData.episodename}">${customData.episodenode}</podcast:episode>`;
          } else {
            line = line + `\n${spacer}<podcast:episode>${customData.episodenode}</podcast:episode>`;
          }
        }
        if (customData.chapters) {
          line = line + `\n${spacer}<podcast:chapters url="${customData.chapters}" type="application/json+chapters" />`
        }
        if (customData.itemtxt) {
          line = line + `\n${spacer}<podcast:txt>${customData.itemtxt}</podcast:txt>`;
        }
        */
      }
      if (line.includes("<enclosure") > 0) {
        continue;
      }
      if (line.includes("audioenclosure") > 0) {
        line = line.replace("audioenclosure", "enclosure");
      }
      if (line.includes(`title="HLS"`) && !line.includes(`length="`)) {
        console.log("fixing length");
        line = line.replace(`title="HLS"`, `title="HLS" length ="69"`);
      }
      if (line.includes(`title="HLS"`) && !line.includes(`type="`)) {
        console.log("fixing type");
        line = line.replace(`title="HLS"`, `title="HLS" type="application/x-mpegURL"`);
      }
      if (line.includes(`title="Audio"`) && !line.includes(`type="`)) {
        console.log("fixing type");
        line = line.replace(`title="Audio"`, `title="Audio" type="video/mp4"`);
      }
      if (largeChannelAvatar) {
        line = line.replace(smallChannelAvatar, largeChannelAvatar);
      }
      if (largePersonAvatar) {
        line = line.replace(smallPersonAvatar, largePersonAvatar);
      }
      if (podData && podData.data && podData.data.medium) {
        line = line.replace(`<podcast:medium>video</podcast:medium>`, `<podcast:medium>${podData.data.medium}</podcast:medium>`);
      }
      if (counter > 1) {
        fixed = fixed + '\n' + line;
      } else {
        fixed = line;
      }
    }
    res.setHeader('content-type', 'application/rss+xml');
    console.log("⚡️⚡️\n\n\n\n ending line loop \n",fixed.length);
    return  res.status(200).send(fixed);
    
  })
  router.use('/dirtyhack', async (req, res) => {
    console.log("⚡️⚡️⚡️⚡️ dirty hack",dirtyHack,req.query);
    if (req.query.cp){
      console.log("⚡️⚡️⚡️⚡️ clearing patronage paid days");
      let subscriptions = await storageManager.getData('subscriptions');
      let list = [];
      if (subscriptions){
        for (var sub of subscriptions){
          sub.paiddays=0;
        }
        storageManager.storeData("subscriptions", subscriptions);
        return res.status(200).send(subscriptions);
      }
    }
    doSubscriptions();
    return res.status(200).send(dirtyHack);
  });
  router.use('/getfeedid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting feed id", req.query);
    }
    let channel = req.query.channel;
    if (!channel) {
      return res.status(420).send("no channel in feed id request");
    }
    let feed;
    let parts = channel.split('@');
    if (parts.length > 1) {
      let feedApi = "https://" + parts[1] + "/plugins/lightning/router/getfeedid?channel=" + parts[0];
      try {
        feed = await axios.get(feedApi);
      } catch {
        console.log("⚡️⚡️hard error getting feed id for ", channel, "from", parts[1], feedApi);
      }
      if (feed && feed.data) {
        //console.log("⚡️⚡️ returning", feed.data, "for", channel,feed.data.toString());
        return res.status(200).send(feed.data.toString());
      }
      return res.status(420).send("remote channel returned no feed id");
    }
    if (channel) {
      try {
        feed = await storageManager.getData("podcast" + "-" + channel)
      } catch (err) {
        console.log("⚡️⚡️error getting feedid", channel);
      }
    }
    //console.log("⚡️⚡️ feed", feed);
    if (feed) {
      return res.status(200).send(feed.toString());
    } else {
      return res.status(400).send("no feed id found for requested channel");
    }
  })
  router.use('/setfeedid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting feed id", req.query);
    }
    let channel = req.query.channel;
    let feedID = req.query.feedid;
    if (channel) {
      try {
        await storageManager.storeData("podcast" + "-" + channel, feedID);
        return res.status(200).send();
      } catch (err) {
        console.log("⚡️⚡️ error storing feedid", channel, feedID);
        return res.status(400).send();
      }
    }
  })
  router.use('/getitemid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting item id", req.query);
    }
    let uuid = req.query.uuid;
    let item;
    if (uuid) {
      try {
        item = await storageManager.getData("podcast" + "-" + uuid);
      } catch (err) {
        console.log("⚡️⚡️ error getting stored itemid", uuid);
      }
    }
    if (item) {
      return res.status(200).send(item.toString());
    } else {
      var apiCall = base + "/api/v1/videos/" + uuid;
      let videoData;
      try {
        videoData = await axios.get(apiCall);
      } catch {
        console.log("⚡️⚡️failed to pull information for provided video id", apiCall);
      }
      if (videoData) {
        let videoHost = videoData.data.channel.host
        if ("https://" + videoHost != base) {
          let hostApi = "https://" + videoHost + "/plugins/lightning/router/getitemid?uuid=" + uuid;
          let hostItemId;
          try {
            hostItemId = await axios.get(hostApi);
          } catch {
            console.log("⚡️⚡️failed to pull item ID from video host", hostApi);
          }
          if (hostItemId) {
            try {
              await storageManager.storeData("podcast" + "-" + uuid, hostItemId);
            } catch {
              console.log("⚡️⚡️failed to store item ID from host", uuid, hostItemId);
            }
            return res.status(200).send(hostItemId.data.toString());
          } else {
            console.log("⚡️⚡️ No id provided by hosting instance");
          }
        }
        let channel = videoData.data.channel.name;
        let feedApi = base + "/plugins/lightning/router/getfeedid?channel=" + channel;
        try {
          feedId = await axios.get(feedApi);
        } catch {
          console.log("⚡️⚡️ error when tring to get feed id ", feedApi);
          return res.status(404).send();
        }

      }
      console.log("⚡️⚡️no videodata available", apiCall);
      return res.status(400).send();
    }
  })
  router.use('/setitemid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting item id", req.query.uuid);
    }
    let uuid = req.query.uuid;
    let itemID = req.query.itemid;
    if (uuid) {
      try {
        await storageManager.storeData("podcast" + "-" + uuid, itemID);
        return res.sendStatus(200);
      } catch (err) {
        console.log("⚡️⚡️error setting item id", uuid, itemID);
        return res.sendStatus(400).send();
      }
    }
  })
  router.use('/getchannelguid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting channel guid", req.query);
    }
    let channel = req.query.channel;
    let channelGuid;
    if (channel) {
      try {
        channelGuid = await storageManager.getData("channelguid" + "-" + channel)
      } catch (err) {
        console.log("⚡️⚡️ error getting channel guid", channel);
        return res.status(400).send();
      }
    }
    if (channelGuid) {
      return res.status(200).send(channelGuid);
    } else {
      //TODO properly create guid
      //let guidResolverUrl = "https://guid.peertube.support/"  
      channelGuid = crypto.randomUUID();
      if (channelGuid) {
        try {
          await storageManager.storeData("channelguid" + "-" + channel, channelGuid);
        } catch {
          console.log("⚡️⚡️failed to get stored guid", channel, channelGuid);
        }
        return res.status(200).send(channelGuid);
      } else {
        console.log("⚡️⚡️ error attempting to generate channel guiid");
        return res.status(400).send();
      }
    }
  })
  router.use('/getpoddata', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting pod data", req.query);
    }
    let channel = req.query.channel;
    if (!channel) {
      console.log("⚡️⚡️ no channel in query", channel, req.query);
      return res.status(400).send("⚡️⚡️ no channel value in request " + req.query);
    }
    let parts = channel.split('@');
    let remotePodData;
    if (parts.length > 1) {
      let remotePodApi = "https://" + parts[1] + "/plugins/lightning/router/getpoddata?channel=" + parts[0];
      try {
        remotePodData = await axios.get(remotePodApi);
      } catch (err) {
        console.log("⚡️⚡️hard error getting custom remote pod data for ", channel, "from", parts[1], remotePodApi, err);
        return res.status(400).send("⚡️⚡️hard error getting custom remote pod data for " + channel + " from " + parts[1] + " using " + remotePodApi + " error " + err);
      }
      if (remotePodData) {
        //console.log("⚡️⚡️ returning", customChat.toString(), "for", channel);
        return res.status(200).send(remotePodData.data);
      }
      console.log("⚡️⚡️ no remote pod data found for", channel);
      return res.status(404).send("⚡️⚡️ no podcast data for " + channel + " on remote system");
    }
    let podData;
    try {
      podData = await storageManager.getData("pod-" + channel.replace(/\./g, "-"));
    } catch (err) {
      console.log("⚡️⚡️error getting pod data for ", channel);
      return res.status(404).send("⚡️⚡️ no podcast data for " + req.query.channel + err);
    }
    if (podData) {
      return res.status(200).send(podData);
    } else {
      console.log("⚡️⚡️ no pod data found for", channel);
      return res.status(404).send("⚡️⚡️ no pod data found for " + channel);
    }
  })
  router.use('/setpoddata', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting podcast data", req.query, req.body);
    }
    //TODO verify authorized user is actual owner of room
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (user && user.dataValues && req.body) {
      let userName = user.dataValues.username;
      if (enableDebug) {
        console.log("⚡️⚡️⚡️ got authorized peertube user to set pod data ", user.dataValues.username);
      }
      if (enableDebug) {
        console.log("⚡️⚡️⚡️⚡️ user", userName);
      }
      let channel = req.body.channel;
      storageManager.storeData("pod-" + channel.replace(/\./g, "-"), req.body);
      pingPI(channel);
      return res.status(200).send();
    }
    return res.status(420).send();
  })
  async function pingPI(pingChannel) {
    let feedApi = base + "/plugins/lightning/router/getfeedid?channel=" + pingChannel;
    let feedId;
    try {
      feedId = await axios.get(feedApi);
      let pingResult;
      if (feedId) {
        pingResult = await axios.get("https://api.podcastindex.org/api/1.0/hub/pubnotify?id=" + feedId.data);
      }
      if (pingResult && pingResult.data) {
        return (pingResult.data);
      }
    } catch {
      console.log("⚡️⚡️hard error when trying ping podcast index ", feedId, feedApi);
    }
  }
  
}

async function unregister () {
  return
}

module.exports = {
  register,
  unregister
}
