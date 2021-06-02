## Functions

<dl>
<dt><a href="#play">play([queue])</a></dt>
<dd><p>Resumes playback, or begins new playback if a queue is given.</p>
</dd>
<dt><a href="#pause">pause()</a> ⇒ <code>boolean</code></dt>
<dd><p>Pauses playback.</p>
</dd>
<dt><a href="#playPause">playPause()</a></dt>
<dd><p>Plays if paused, pauses if playing. Starts playback if the queue is not empty.</p>
</dd>
<dt><a href="#resume">resume()</a> ⇒ <code>boolean</code></dt>
<dd><p>Resumes the song that was paused.</p>
</dd>
<dt><a href="#stop">stop()</a></dt>
<dd><p>Stops playback and clears the queue.</p>
</dd>
<dt><a href="#next">next(_prevSongWasCompleted)</a></dt>
<dd><p>Plays the next song in the queue. Will end current playback if there&#39;s no
next song.</p>
</dd>
<dt><a href="#previous">previous()</a></dt>
<dd><p>Plays the previous item if we are still in the first 3 seconds of the current item,
otherwise restarts the currently playing item.</p>
</dd>
<dt><a href="#_updateTrackObj">_updateTrackObj(trackId)</a></dt>
<dd><p>Updates the internal copy of the currently playing track row object.</p>
</dd>
<dt><a href="#playItemInQueue">playItemInQueue(index, forceMode)</a> ⇒ <code>boolean</code></dt>
<dd><p>Plays a specific item in the queue and updates the instance to reflect the
change. This will use the playback mode set in the constructor options, but
that can be overridden with the 2nd parameter.</p>
</dd>
<dt><a href="#_newHowl">_newHowl(forceMode)</a></dt>
<dd><p>Returns a new howl object for interal use based on the track object in
this.trackObj. If the user has enabled song preloading, HTML5 web audio
will not be used.</p>
</dd>
<dt><a href="#_trackPlaybackFailed">_trackPlaybackFailed()</a></dt>
<dd><p>A general handler for when playback fails and we should to move to the next
item in the queue.</p>
</dd>
<dt><a href="#mute">mute()</a></dt>
<dd><p>Mutes audio without otherwise interrupting it.</p>
</dd>
<dt><a href="#unmute">unmute()</a></dt>
<dd><p>Unmutes the audio.</p>
</dd>
<dt><a href="#getCurrentPlaybackTime">getCurrentPlaybackTime()</a> ⇒ <code>Number</code> | <code>null</code></dt>
<dd><p>Returns the number of seconds elapsed in the current playback, or null if
nothing is playing.</p>
</dd>
<dt><a href="#seek">seek(seconds)</a></dt>
<dd><p>Seeks to a certain point in the current playback.</p>
</dd>
<dt><a href="#setShuffle">setShuffle(mode)</a></dt>
<dd><p>Sets the shuffle mode to &quot;true&quot; or &quot;false&quot;, and triggers &quot;controlChange&quot;
callbacks.</p>
</dd>
<dt><a href="#setRepeat">setRepeat(mode)</a></dt>
<dd><p>Sets the shuffle mode to &quot;true&quot; or &quot;false&quot;, and triggers &quot;controlChange&quot;
callbacks.</p>
</dd>
<dt><a href="#createSystemNotification">createSystemNotification(trackId)</a></dt>
<dd><p>Creates a system notification for the currently playing track.</p>
</dd>
<dt><a href="#add">add(trackIds, [atIndex])</a></dt>
<dd><p>Adds one or more tracks to the end of the current queue. New playback
cannot be started with this method, use <code>play()</code> instead.</p>
</dd>
<dt><a href="#remove">remove(index)</a></dt>
<dd><p>Removes one track from the queue. Tracks may be located anywhere in the
queue, even as previously played tracks.</p>
</dd>
<dt><a href="#clearQueue">clearQueue([mode])</a></dt>
<dd><p>Removes all items from the queue (even previous items) except the currently
playing item.</p>
</dd>
<dt><a href="#silentlyUpdateQueue">silentlyUpdateQueue(newQueue)</a></dt>
<dd><p>Allows custom elements to quietly update the queue without interrupting or
changing the currently playing track in any way. Does not trigger any
callbacks. This exists primarily to allow the playback-queue to update the
Player queue after a user drags- n-drops the queue tracks.</p>
<p>The currently playing track ID <strong>must</strong> be located somewhere in the
newQueue array.</p>
</dd>
<dt><a href="#_newPlayback">_newPlayback(queue)</a></dt>
<dd><p>Begins playing the first item in the given queue, and saves the given queue
internally.</p>
<p>This will stop any currently playing audio before beginning new audio.</p>
</dd>
<dt><a href="#formatFilePath">formatFilePath(path)</a> ⇒ <code>string</code></dt>
<dd><p>Ensures that the file path is properly formatted for XHR.</p>
</dd>
<dt><a href="#fileExists">fileExists(path)</a> ⇒ <code>boolean</code></dt>
<dd><p>Uses a XHR request to check if the file for the song exists. XHR is
preferrable over node fs because this runs in a renderer process and
because howler uses XHR as well.</p>
</dd>
<dt><a href="#_addToServerPlaybackHistory">_addToServerPlaybackHistory()</a></dt>
<dd><p>Add an entry to the playback history for the song that just started.</p>
<p>The values &quot;0&quot; will be updated on song end (when that data becomes
available). If the song doesn&#39;t end for whatever reason (crash, force
quit, bug), the values &quot;0&quot; will remain in the database and should be
taken to mean that &quot;the song started, but it is not known when it ended&quot;.</p>
<p>Or, it can mean that the user rapidly skipped next/prev though a queue.</p>
</dd>
<dt><a href="#_saveTrackEndState">_saveTrackEndState(trackPlaybackCompleted)</a></dt>
<dd><p>When a track ends in the following cases:</p>
<ul>
<li>Track ends normally</li>
<li>User pressed next</li>
<li>User pressed prev and it wasn&#39;t within the restart time</li>
<li>User presses stop</li>
</ul>
<p>The state of the track will be saved in the database.</p>
<p>The Player must still be in the state of the currently playing song when
this is triggered.</p>
</dd>
<dt><a href="#_stateChange">_stateChange(newState)</a></dt>
<dd><p>Invoked by the public methods play(), pause(), etc, this will change the
Player state inernally and trigger appropiate registered callbacks.</p>
</dd>
<dt><a href="#_trackChange">_trackChange(newTrackId)</a></dt>
<dd><p>Invoked by the public methods prev() and next(), this is to propagate the
track change to listeners.</p>
</dd>
<dt><a href="#_controlChange">_controlChange()</a></dt>
<dd><p>Invoked whenever a &quot;control&quot; changes, like the shuffle and repeat controls.</p>
</dd>
<dt><a href="#_queueChange">_queueChange()</a></dt>
<dd><p>Invoked whenever a track is added to or removed from an existing queue.</p>
</dd>
<dt><a href="#on">on(event, cb)</a></dt>
<dd><p>Allows for other code to register callbacks.</p>
</dd>
<dt><a href="#off">off(event, cb)</a></dt>
<dd><p>Removes a previously registered event handler.</p>
</dd>
<dt><a href="#cleanup">cleanup()</a></dt>
<dd><p>Erases all callbacks that were registered with <code>on</code>.</p>
</dd>
</dl>

<a name="play"></a>

## play([queue])
Resumes playback, or begins new playback if a queue is given.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| [queue] | <code>array</code> \| <code>number</code> | An array of track ID's to play, or a single track ID. Will overwrite current queue with given queue. |

<a name="pause"></a>

## pause() ⇒ <code>boolean</code>
Pauses playback.

**Kind**: global function  
**Returns**: <code>boolean</code> - True if the audio was paused, false if there was nothing to pause.  
<a name="playPause"></a>

## playPause()
Plays if paused, pauses if playing. Starts playback if the queue is not empty.

**Kind**: global function  
<a name="resume"></a>

## resume() ⇒ <code>boolean</code>
Resumes the song that was paused.

**Kind**: global function  
**Returns**: <code>boolean</code> - True if something is now playing.  
<a name="stop"></a>

## stop()
Stops playback and clears the queue.

**Kind**: global function  
<a name="next"></a>

## next(_prevSongWasCompleted)
Plays the next song in the queue. Will end current playback if there's no
next song.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| _prevSongWasCompleted | <code>boolean</code> | <code>false</code> | For internal use only. Used to indicate if the song that just finished, finished at 100% listened. This is needed because 100% completion happens in a Howler callback, a point at which the state of the last song is already lost. |

<a name="previous"></a>

## previous()
Plays the previous item if we are still in the first 3 seconds of the current item,
otherwise restarts the currently playing item.

**Kind**: global function  
<a name="_updateTrackObj"></a>

## \_updateTrackObj(trackId)
Updates the internal copy of the currently playing track row object.

**Kind**: global function  

| Param | Type |
| --- | --- |
| trackId | <code>number</code> | 

<a name="playItemInQueue"></a>

## playItemInQueue(index, forceMode) ⇒ <code>boolean</code>
Plays a specific item in the queue and updates the instance to reflect the
change. This will use the playback mode set in the constructor options, but
that can be overridden with the 2nd parameter.

**Kind**: global function  
**Returns**: <code>boolean</code> - Returns false if the file could not be loaded, otherwise
returns true.  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Array item index in the queue. |
| forceMode | <code>number</code> | If set, playback will be forced in the given mode. |

<a name="_newHowl"></a>

## \_newHowl(forceMode)
Returns a new howl object for interal use based on the track object in
this.trackObj. If the user has enabled song preloading, HTML5 web audio
will not be used.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| forceMode | <code>number</code> | Playback mode. |

<a name="_trackPlaybackFailed"></a>

## \_trackPlaybackFailed()
A general handler for when playback fails and we should to move to the next
item in the queue.

**Kind**: global function  
<a name="mute"></a>

## mute()
Mutes audio without otherwise interrupting it.

**Kind**: global function  
<a name="unmute"></a>

## unmute()
Unmutes the audio.

**Kind**: global function  
<a name="getCurrentPlaybackTime"></a>

## getCurrentPlaybackTime() ⇒ <code>Number</code> \| <code>null</code>
Returns the number of seconds elapsed in the current playback, or null if
nothing is playing.

**Kind**: global function  
<a name="seek"></a>

## seek(seconds)
Seeks to a certain point in the current playback.

**Kind**: global function  

| Param | Type |
| --- | --- |
| seconds | <code>number</code> | 

<a name="setShuffle"></a>

## setShuffle(mode)
Sets the shuffle mode to "true" or "false", and triggers "controlChange"
callbacks.

**Kind**: global function  

| Param | Type |
| --- | --- |
| mode | <code>boolean</code> | 

<a name="setRepeat"></a>

## setRepeat(mode)
Sets the shuffle mode to "true" or "false", and triggers "controlChange"
callbacks.

**Kind**: global function  

| Param | Type |
| --- | --- |
| mode | <code>boolean</code> | 

<a name="createSystemNotification"></a>

## createSystemNotification(trackId)
Creates a system notification for the currently playing track.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| trackId | <code>number</code> | Track ID. Defaults to the currently playing track. |

<a name="add"></a>

## add(trackIds, [atIndex])
Adds one or more tracks to the end of the current queue. New playback
cannot be started with this method, use `play()` instead.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| trackIds | <code>number</code> \| <code>array</code> |  | A track ID, or an array of track ID's |
| [atIndex] | <code>number</code> | <code></code> | Optionally insert the new tracks at a certain index in the queue. |

<a name="remove"></a>

## remove(index)
Removes one track from the queue. Tracks may be located anywhere in the
queue, even as previously played tracks.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | The track index to remove. |

<a name="clearQueue"></a>

## clearQueue([mode])
Removes all items from the queue (even previous items) except the currently
playing item.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [mode] | <code>string</code> | <code>&quot;all&quot;</code> | Queue clearing mode (default is `all`): - `upcoming`: clears all upcoming items from the queue. - `previous`: clears all previously played items from the queue. - `all`: clears all previous and all upcoming items from the queue. Leaves   the currently playing item as the only item in the queue. |

<a name="silentlyUpdateQueue"></a>

## silentlyUpdateQueue(newQueue)
Allows custom elements to quietly update the queue without interrupting or
changing the currently playing track in any way. Does not trigger any
callbacks. This exists primarily to allow the playback-queue to update the
Player queue after a user drags- n-drops the queue tracks.

The currently playing track ID **must** be located somewhere in the
newQueue array.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| newQueue | <code>array</code> | An Array to overwrite the queue with. |

<a name="_newPlayback"></a>

## \_newPlayback(queue)
Begins playing the first item in the given queue, and saves the given queue
internally.

This will stop any currently playing audio before beginning new audio.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| queue | <code>array</code> | Array of track ID's. |

<a name="formatFilePath"></a>

## formatFilePath(path) ⇒ <code>string</code>
Ensures that the file path is properly formatted for XHR.

**Kind**: global function  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 

<a name="fileExists"></a>

## fileExists(path) ⇒ <code>boolean</code>
Uses a XHR request to check if the file for the song exists. XHR is
preferrable over node fs because this runs in a renderer process and
because howler uses XHR as well.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The file path on the local system. Only works in Electron, obviously. |

<a name="_addToServerPlaybackHistory"></a>

## \_addToServerPlaybackHistory()
Add an entry to the playback history for the song that just started.

The values "0" will be updated on song end (when that data becomes
available). If the song doesn't end for whatever reason (crash, force
quit, bug), the values "0" will remain in the database and should be
taken to mean that "the song started, but it is not known when it ended".

Or, it can mean that the user rapidly skipped next/prev though a queue.

**Kind**: global function  
<a name="_saveTrackEndState"></a>

## \_saveTrackEndState(trackPlaybackCompleted)
When a track ends in the following cases:

- Track ends normally
- User pressed next
- User pressed prev and it wasn't within the restart time
- User presses stop

The state of the track will be saved in the database.

The Player must still be in the state of the currently playing song when
this is triggered.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| trackPlaybackCompleted | <code>boolean</code> | Used to indicate that the track has completed 100% of its playback. This is only true when this method is triggered by the Howler `onend` callback. |

<a name="_stateChange"></a>

## \_stateChange(newState)
Invoked by the public methods play(), pause(), etc, this will change the
Player state inernally and trigger appropiate registered callbacks.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| newState | <code>string</code> | The new state to become. `playing`, `paused`, `stopped`, `loading`. Note: this will not play/pause/stop the music, this will only refect that change internally after the main public method performs the main play/pause/stop action. |

<a name="_trackChange"></a>

## \_trackChange(newTrackId)
Invoked by the public methods prev() and next(), this is to propagate the
track change to listeners.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| newTrackId | <code>string</code> | The new track that is now playing. |

<a name="_controlChange"></a>

## \_controlChange()
Invoked whenever a "control" changes, like the shuffle and repeat controls.

**Kind**: global function  
<a name="_queueChange"></a>

## \_queueChange()
Invoked whenever a track is added to or removed from an existing queue.

**Kind**: global function  
<a name="on"></a>

## on(event, cb)
Allows for other code to register callbacks.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>string</code> | One of these events: - `stateChange`: When the player state changes, eg. played, paused, stopped. - `trackChange`: When a new track is played. |
| cb | <code>function</code> | Callback function. |

<a name="off"></a>

## off(event, cb)
Removes a previously registered event handler.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>string</code> | The event type that the callback belongs to. |
| cb | <code>function</code> | Reference to the previously registered callback function. |

<a name="cleanup"></a>

## cleanup()
Erases all callbacks that were registered with `on`.

**Kind**: global function  
