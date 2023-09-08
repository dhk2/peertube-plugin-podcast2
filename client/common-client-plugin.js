import axios from 'axios';
async function register({ registerHook, peertubeHelpers, registerVideoField }) {
  const { notifier } = peertubeHelpers
  const basePath = await peertubeHelpers.getBaseRouterRoute();

  let chatEnabled, keysendEnabled, lnurlEnabled, legacyEnabled, debugEnabled, rssEnabled;
  let userName = "PeerTuber";
  let accountName, channelName, videoName, instanceName, accountAddress, softwareVersion, client_id, channelId,videoUuid;
  let streamEnabled = false;
  let panelHack;
  let podData;
  let hostPath;

  registerHook({
    target: 'action:video-watch.player.loaded',
    handler: async ({ player, video }) => {
      if (debugEnabled){
        console.log(`⚡️⚡️ video`,video);
      }
      let videoEl;
      if (player.el()) {
        videoEl = player.el().getElementsByTagName('video')[0]
        if (debugEnabled){
          console.log(`⚡️⚡️videoEl`,videoEl);
        }
      } else {
        //weird error condition avoidance
        videoEl - { time: 0 };
      }
      if (location.instance != video.originInstanceHost) {
        instanceName = video.originInstanceHost;
      }
      console.log("⚡️⚡️looking for permanent live info",video.isLive);
      //for compatibility with AGates modificuation of uuid for lives in podping
      if (video.isLive){
        videoUuid = video.uuid+'_'+video.publishedAt.toISOString();
      } else {
        videoUuid = video.uuid;
      }
      channelId=video.channel.id;
      accountName = video.byAccount;
      channelName = video.byVideoChannel;
      videoName = video.uuid;
      let episodeName = video.name;
      let itemID;
      let episodeGuid = videoUuid;
      let displayName = video.channel.displayName;
      let addSpot = document.getElementById('plugin-placeholder-player-next');
      let addSpot4 = document.getElementsByClassName('root-header-right')[0];
      //console.log("⚡️addspit section",addSpot4)
      const elem = document.createElement('div');

      var v4vButtonHTML;
      if (chatEnabled) {
        v4vButtonHTML = v4vButtonHTML + ` <button _ngcontent-vww-c178="" id = "bigchat" type="button" class="peertube-button orange-button ng-star-inserted" hidden="true">` + "▼" + `</button>`
        v4vButtonHTML = v4vButtonHTML + ` <button _ngcontent-vww-c178="" id = "smallchat" type="button" class="peertube-button orange-button ng-star-inserted" hidden="true">` + "▲" + `</button>`
        v4vButtonHTML = v4vButtonHTML + ` <button _ngcontent-vww-c178="" id = "closechat" type="button" class="peertube-button orange-button ng-star-inserted" title="open chat panel">` + "Chat" + `</button>`
      }
      if (v4vButtonHTML) {
        //  console.log("⚡️--------------button hmtl",v4vButtonHTML)
        elem.innerHTML = v4vButtonHTML;
        addSpot.appendChild(elem);
      }
      if (chatEnabled) {
        let newContainer = document.createElement('div');
        newContainer.setAttribute('id', 'peertube-plugin-irc-container')
        newContainer.setAttribute('hidden', 'true');
        addSpot.append(newContainer)
        //addSpot.append()

        var container = document.getElementById('peertube-plugin-irc-container')

        if (!container) {
          logger.error('Cant found the irc chat container.')
        }
        let chatRoom = await getChatRoom(channelName);
        if (debugEnabled) {
          console.log("⚡️found chat room", chatRoom);
        }
        if (!chatRoom) {
          let shortInstance = instanceName.split(".")[0];
          shortInstance = shortInstance.split(" ")[0];
          let shortChannel = channelName.split("@")[0];
          chatRoom = "irc://irc.rizon.net/" + shortInstance + "-" + shortChannel;
          await setChatRoom(channelName, chatRoom);
        }
        let chatLink = "https://kiwiirc.com/nextclient/#" + chatRoom + '?nick=' + userName + '&autoconnect=true&startupscreen=welcome';
        //let chatLink = "https://kiwiirc.com/nextclient/#" + chatRoom + '?nick=' + userName;
        if (userName === 'PeerTuber') {
          chatLink = chatLink + "???";
        }
        container.setAttribute("style", "display:flex");
        container.setAttribute('style', 'height:100%;width:100%;resize:both;display:flex;flex-direction:column;overflow:auto')
        const iframe = document.createElement('iframe')
        iframe.setAttribute('src', chatLink);
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
        iframe.setAttribute('frameborder', '0')
        iframe.setAttribute('id', "peertube-plugin-irc-iframe");
        container.append(iframe)
        let docIframe = document.getElementById('peertube-plugin-irc-iframe');
        docIframe.setAttribute('style', 'height:100%')
        docIframe.style.height = "100%";
        docIframe.style.width = "100%";
        docIframe.style.display = "flex";
        docIframe.style.flexDirection = "column";
        docIframe.style.resize = "both";
        docIframe.style.overflow = "auto";
        docIframe.contentWindow.kiwiconfig = () => { console.log("⚡️███kiwi config called ") }
        let idoc = docIframe.contentWindow.document;
        let ibody = idoc.getElementsByTagName('body');
        let configScript = document.createElement(`div`);
        configScript.innerHTML = `<script name="kiwiconfig">{"startupScreen": "welcome", "startupOptions": { "server": "irc.freenode.net", "port": 6697, "tls": true, "direct": false, "nick": "specialk" "autoConnect": true }}</script>`;
        //console.log("⚡️before",ibody,configScript);
        ibody[0].appendChild(configScript)
        //console.log("⚡️after",ibody,configScript);
      }

      const bigChat = document.getElementById("bigchat");
      if (bigChat) {
        bigChat.title = "increase chat window height";
        bigChat.onclick = async function () {
          container.style.height = container.offsetHeight + 512 + 'px';
        }
      }
      const smallChat = document.getElementById("smallchat");
      if (smallChat) {
        smallChat.title = "Decrease chat window height";
        smallChat.onclick = async function () {
          container.style.height = container.offsetHeight - 512 + 'px';
        }
      }
      const closeChat = document.getElementById("closechat");
      let videoDisplay = document.getElementById("videojs-wrapper");
      let fullVideo = document.getElementById("video-wrapper");
      var oldVideo, oldChat
      if (closeChat) {

        closeChat.onclick = async function () {
          if (debugEnabled) {
            console.log("⚡️clicked", closeChat.innerHTML, videoDisplay.hidden, container.hidden);
            console.log("⚡️width", container.clientWidth, videoDisplay.clientWidth, fullVideo.clientWidth);
            console.log("⚡️height", container.clientheight, videoDisplay.clientHeight);
          }
          if (closeChat.innerHTML === "Full Chat") {
            closeChat.title = "Close chat window";
            container.hidden = false;
            oldVideo = videoDisplay.clientWidth;
            videoDisplay.hidden = true;
            closeChat.innerHTML = "X";
            container.style.flexGrow = "1";
            container.style.flex = "wrap";
            //container.style.width = "2000px";
            //container.width = "2000px"
            //container.width = fullVideo.clientWidth;
            bigChat.hidden = false;
            smallChat.hidden = false;
          }
          else if (closeChat.innerHTML === "Chat") {
            closeChat.title = "make chat full screen"
            container.hidden = false;
            videoDisplay.hidden = false;
            closeChat.innerHTML = "Full Chat";
            bigChat.hidden = false;
            smallChat.hidden = false;
            if (container.clientHeight < 640) {
              container.style.height = "640px";
            }
          }
          else if (closeChat.innerHTML === "X") {
            container.hidden = true;
            videoDisplay.hidden = false;
            closeChat.innerHTML = "Chat";

            bigChat.hidden = true;
            smallChat.hidden = true;
            closeChat.title = "open chat panel";
          }
          if (debugEnabled) {
            console.log("⚡️after click", closeChat.innerHTML, videoDisplay.hidden, container.hidden);
            console.log(container, videoDisplay);
          }
        }
      }
    }
  })
  registerHook({
    target: 'action:video-channel-videos.video-channel.loaded',
    handler: async (result, params) => {
      if (debugEnabled) {
        console.log("⚡️ chanel loaded result ", result,"params:", params)
      }
      if (document.getElementById("patronize-channel")){
        console.log("buttons already exist");
        return;
      }
      let buttonSpot= document.getElementsByClassName("channel-buttons");
      let buttonHtml = document.createElement("div");

      //result.data[0].account.displayName=`<a href="https://google.com">zap</a>`;
      return result;
    }
  })
  registerHook({
    target: 'action:video-edit.init',
    handler: async ({ type, updateForm }) => {
      let podData
      let itemTxt = document.getElementById("itemtxt");
      console.log('⚡️type and update form!', type,updateForm,itemTxt);
    }
  })
  registerHook({
    target: 'action:video-channel-update.video-channel.loaded',
    handler: async (params) => {
      if (debugEnabled) {
        console.log("⚡️channel update loaded", params);
      }
      
      videoName = undefined;
      let channelUpdate = document.getElementsByClassName("form-group");
      let channel = (window.location.href).split("/").pop();
      channelName = channel;
      let splitData = await getSplit();
      //let walletInfo = await getWalletInfo(null, null, channel);
      let feedID = await getFeedID(channel);
      let feedGuid = await getChannelGuid(channel);
      let feedTxt = [""];
      let podData = await getPodData(channel);
      if (debugEnabled) {
        console.log("⚡️pod data", podData);
      }
      if (!podData) {
        podData = {
          "feedid": feedID,
          "feedguid": feedGuid,
          "medium": "podcast",
          "channel": channel
        }
        podData.text = feedTxt;
      }
      if (!podData.text) {
        podData.text = feedTxt;
      }
      let newPodData = podData

      let panel = await getConfigPanel(splitData, channel);
      panelHack = panel;
      channelUpdate[0].appendChild(panel);
      let id = document.getElementById("id");
      if (id) {
        id.value = feedID;
        let updateButton = document.getElementById("update-feed");
        if (updateButton) {
          updateButton.onclick = async function () {
            setFeedID(channel, id.value);
            updateButton.innerText = "Saved!";
          }
        }
      }
      let chatRoom = document.getElementById("chatroom");
      let chatButton = document.getElementById("update-chat");
      if (chatButton) {
        chatButton.onclick = async function () {
          setChatRoom(channel, chatRoom.value);
          chatButton.innerText = "Saved!";
        }
      }
      //console.log("⚡️checking for rss settings button");
      let rssSettingsButton = document.getElementById("rss-settings");
      let changeMonitor;
      if (rssSettingsButton) {
        rssSettingsButton.onclick = async function () {
          //console.log("⚡️rss settings button clicked");
          //let podData= {medium:podcast}
          let html;
          if (!feedID) {
            html = `<a href="https://podcastindex.org/add?feed=` + encodeURIComponent("https://" + window.location.hostname + "/plugins/lightning/router/podcast2?channel=" + channel) + `"<button id="button-register-feed" class="peertube-button orange-button ng-star-inserted" title = "For full Boostagram functionality on sites like saturn.fly.dev and conshax.app you will need to register your channel">register with Podcast Index</button></a>`
          } else {
            html = "Podcast Index Feed ID: " + feedID;
            //html = html + `<br><button type="button" id="register-feed" name="register-feed" class="peertube-button orange-button ng-star-inserted">Register Feed to Podcast Index</button>`
          }
          html = html + `<br>Podcast Guid: `;
          html = html + `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="channel-guid" width="40" value="` + feedGuid + `">`
          // html = html + `<button id="update-guid" class="peertube-button orange-button ng-star-inserted">Save</button>`
          html = html + `<br>Podcast Medium <select id="feed-medium"><option value="podcast">podcast </option><option value="music">music </option><option value="video">video </option><option value="film">film </option><option value="audiobook">audiobook </option></select>`

          for (var i = 0; i < podData.text.length; i++) {
            html = html + `<br>Podcast txt value ` + i + `: `;
            html = html + `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="feed-txt-` + i + `" width="40" value="` + podData.text[i] + `">`
          }
          html = html + `<br><button id="rss-link" class="peertube-button orange-button ng-star-inserted">RSS Feed</button>`
          let rssEditSettings = await peertubeHelpers.showModal({
            title: 'RSS settings ' + channel,
            content: "",
            close: true,
            confirm: {
              value: 'save', action: async () => {
                clearInterval(changeMonitor);
                if (debugEnabled){
                   console.log("⚡️ saving pod data", newPodData,);
                }
                try {
                  await axios.post(basePath + "/setpoddata", newPodData, { headers: await peertubeHelpers.getAuthHeader() });
                } catch (err) {
                  console.log("⚡️ hard error attempting to update pod data", newPodData,err)
                }
              }
            },

          });
          let modal = (document.getElementsByClassName('modal-body'))
          if (modal) {
            modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
            modal[0].innerHTML = html;
            switch (podData.medium) {
              case "podcast": document.getElementById("feed-medium").selectedIndex = 0; break;
              case "music": document.getElementById("feed-medium").selectedIndex = 1; break;
              case "film": document.getElementById("feed-medium").selectedIndex = 2; break;
              case "video": document.getElementById("feed-medium").selectedIndex = 3; break;
              case "audiobook": document.getElementById("feed-medium").selectedIndex = 4; break;
              default: console.log("⚡️unable to find a match for podData.medium");
            }
          }

          let rssLinkButton = document.getElementById('rss-link');
          if (rssLinkButton) {
            rssLinkButton.onclick = async function () {
              let rssFeedUrl = window.location.protocol + "//" + window.location.hostname + "/plugins/lightning/router/podcast2?channel=" + channel
              window.open(rssFeedUrl);
            }
          }

          changeMonitor = setInterval(async function () {
            try {
              newPodData.feedguid = document.getElementById("channel-guid").value;
              newPodData.medium = document.getElementById("feed-medium").value;
              for (var i = 0; i < feedTxt.length; i++) {
                podData.text[i] = document.getElementById("feed-txt-" + i).value;
              }
            } catch {
              clearInterval(changeMonitor);
            }
          }, 500);
          let registerFeedButton = document.getElementById('register-feed');
          if (registerFeedButton) {
            registerFeedButton.onclick = async function () {
              let registerFeedUrl = "https://podcastindex.org/add?feed=" + feedID;
              window.open(registerFeedUrl);
            }
          }
        }
      }

      assignEditButtons(splitData, channel);
    }
  })
  
  const videoFormOptions = { tab: 'plugin-settings' };
  let commonOptions = {
    name: 'seasonnode',
    label: 'Season number',
    descriptionHTML: 'which season this episode belongs to',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'seasonname',
    label: 'Season descriptive name',
    descriptionHTML: 'Display name of this season',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'episodenode',
    label: 'Episode number',
    descriptionHTML: 'episode number in season',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'episodename',
    label: 'Episode descriptive name',
    descriptionHTML: 'Display name of this episode',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'chapters',
    label: 'Chapter file',
    descriptionHTML: 'URL for chapter file',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'itemtxt',
    label: 'arbitrary text',
    descriptionHTML: 'arbitrary text string for item',
    type: 'input',
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }

  await peertubeHelpers.getSettings()
    .then(s => {
      chatEnabled = s['irc-enable'];
      debugEnabled = s['debug-enable'];
      rssEnabled = s['rss-enable'];
      // if (debugEnabled) {
      console.log("⚡️settings", s);
      // }
    })
  peertubeHelpers.getServerConfig()
    .then(config => {
      if (debugEnabled) {
        console.log('⚡️Fetched server config.', config);
      }
      instanceName = config.instance.name;

    })
  try {
    let versionResult = await axios.get(basePath + "/getversion");
    if (versionResult && versionResult.data) {
      softwareVersion = versionResult.data;
    }
  } catch (err) {
    console.log("⚡️error getting software version", basePath, err);
  }

  async function getChatRoom(channel) {
    if (debugEnabled) {
      console.log("⚡️getting chat room", channel, basePath)
    }
    let chatApi = basePath + "/getchatroom?channel=" + channel;
    try {
      let chatRoom = await axios.get(chatApi);
      if (chatRoom) {
        //console.log("⚡️chatroom returned", chatRoom, "data", chatRoom.data);
        return chatRoom.data;
      }
    } catch (err) {
      return;
    }
  }
  async function setChatRoom(channel, chatRoom) {
    let chatApi = basePath + "/setchatroom?channel=" + channel + "&chatroom=" + encodeURIComponent(chatRoom);
    try {
      await axios.get(chatApi);
    } catch (err) {
      console.log("⚡️error attempting to set chatroom", err, channel, chatRoom);
    }
  }
  async function getFeedID(channel) {
    let feedApi = basePath + "/getfeedid?channel=" + channel;
    try {
      let feedId = await axios.get(feedApi);
      if (feedId) {
        return feedId.data;
      }
    } catch (err) {
      return;
    }
  }
  async function setFeedID(channel, feedID) {
    let feedApi = basePath + "/setfeedid?channel=" + channel + "&feedid=" + feedID;
    try {
      await axios.get(feedApi);
    } catch (err) {
      console.log("⚡️error attempting to fetch feed id", err);
    }
  }
  async function closeModal() {
    let butts = document.getElementsByClassName("ng-star-inserted")
    for (var butt of butts) {
      let iconName = butt.getAttribute("iconname");
      if (iconName == "cross") {
        butt.click();
        return true;
      }
    }
    return false;
  }
  async function getChannelGuid(channel) {
    let guid;
    let guidApi = basePath + "/getchannelguid?channel=" + channel;
    try {
      guid = await axios.get(guidApi);
      if (guid) {
        if (debugEnabled) {
          console.log("⚡️guid from guid api", guid)
        }
        return guid.data;
      }
    } catch (err) {
      console.log("⚡️error getting channel guid", guidApi, err)
    }
    return;
  }
  async function getPodData(channel) {
    let freshPodData;
    let podApi = basePath + "/getpoddata?channel=" + channel;
    try {
      freshPodData = await axios.get(podApi);
      if (freshPodData) {
        return freshPodData.data;
      }
    } catch (err) {
      console.log("⚡️error getting pod Data", podApi, err)
    }

    return;
  }
}
export {
  register
}

