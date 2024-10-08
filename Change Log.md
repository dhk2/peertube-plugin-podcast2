v 0.5.3
- fixed channel length issues with importing from podcasts and internet archive
- fixed compatibility wiht Peerhub

v 0.5.2
- moved podroll support to hivetube in shared environment

v 0.5.1
- more hivetube plugin interoperability with RSS feeds

v 0.5.0
- fixed hivetube plugin interoperability with RSS feeds

v 0.4.9
- fixed node crashing podroll bug

v 0.4.8
- changed licenses to correspond with the rss defined values instead of peertubes.

v 0.4.7
- fixes and enhancements to publisher feed

v 0.4.6
- added automatic podroll 
- cleaned up some debugging info

v 0.4.5
- fixed bug with undefined result value setting custom channel data
- deprecated channelguid storage method inherited from lightning to use poddata instead
- fixed initial channel guid creation in poddata

v 0.4.4
- troubleshooting failure to create podcastindex entries via podping
- fixed several podcast2 rss elements

v 0.4.3
- another podping proxy fix

v 0.4.2
- added publisher feed for instance
- added publisher to channel rss feeds

v 0.4.1
- Fixed uri encode issue with podping proxy

V 0.4.0
- Fixed bug in chapters error message

v 0.3.9
- fixed intermittant pod ping failure
- added custom rss feed caching

v 0.3.8
- fixed node crash bug creating podcast guid

v 0.3.7
- fixed bug with uuid generation for new channels

v 0.3.6
- floating point bitrate workaround kludge
- changed type for yt embed to "video/youtube"

v 0.3.5
- fixed caption null error

v 0.3.4
- added fix for synched import url difference from manually imported videos

v 0.3.3
- added autosaving of youtube uuid for imported videos

v 0.3.2
- fixed issue with rss feed button
- attempted to fix issue with podping proxying

v 0.3.1
- fixed podcast:license

v 0.3.0
- fixed some key bugs with licencing in RSS feed
- fixed err error causing node crash

v 0.2.9
- added podcast:licence and copyright to RSS

v 0.2.8
- added podping proxy support

v 0.2.7
- fixed node crashing bug in feedid error checkcing

v 0.2.6
- added podping support for legacy feed

v 0.2.5
- added itunes:duration to items in all feeds

v 0.2.4
- fixed mime type for returned RSS feed

v 0.2.3
- bug fixes in import logic
- bug fix for descriptions in array instead of string
- fixed empty chapters in rss if none configured
- fixed itunes episode to be string instead of int

v 0.2.2
- added ability to import audiobooks from internet archive

v 0.2.1
- Changed UUID determination to avoid these issues.

v 0.2.0
- different uuid fix to avoid corrupt uuids causing node crash

v 0.1.9
- fixed video/film mixup when openning podcast2 channel settings
- check if UUID is valid before trying to load

v 0.1.8
- fixed legacy RSS to pick video or audio mp4 for enclosure based on medium

v 0.1.7 
- refining torrent RSS feed compatibility

v 0.1.6
- added torrent RSS feed

v 0.1.5
- fixed node crash bug trying to find channelGuid

v 0.1.4
- Added chapters feed generation for translating PeerTube chapters to Podcastion 2.0 chapters
- Cleaned up RSS setting dialog

v 0.1.3
- fixed hive interaction

v 0.1.2
- fixed new podcast guid generation
- fixed guid interactions with lightning plugin

v 0.1.1
- updated new lightning address attribute name to keysend

v 0.1.0
- added itunes:type serial to audiobook feeds
- added embedded peertube alternate enclosure
- added youtube source ID to plugin video fields
- added embedded youtube alternate enclosure
- fixed mime type for enclosure to application/x-mpegURL

v 0.0.9
- another attempt at fixing axios import on some instances

v 0.0.8
- ?fixed bug with missing dependencies
- fixed audio stream type if no video present in enclosure file
- fixed itunes category being hardcoded as news.

v 0.0.7
- enabled avatar and thumbnail updating
- added redirect to new podcast channel

v 0.0.6
- added RSS podcast feed import. 

v 0.0.5
- Added tags and adjusted tags to meet itunes/spotify rss requirements
- Added gui for new tags

v 0.0.4
- added email address to pod data for itunes:owner
- fixed bug with txt data at channel level

v 0.0.3
- fixed issues with enclosure/alternate enclosure/ audio enclosure
- added better diagnostic messaging to debug further enclosure issues

v 0.0.2
- added 301 redirect capability to custom RSS
- disabled podcast guid to prevent duplication.

v 0.0.1
- Strippled lightning support out to cread podcasting fork