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