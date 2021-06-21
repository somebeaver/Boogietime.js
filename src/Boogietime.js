/**
 * @file
 *
 * Audio playback class for Cardinal Music. Manages the playback state and
 * provides hooks for custom elements to subscribe to.
 */
import __ from '../../double-u/index.js'
import * as notifications from './notifications.js'
import Query from '../../sqleary.js/index.js'
import i18n from '../../i18n.js/index.js'
import { Howl } from './deps/howler.js'

export default class Boogietime {
  /**
   * Boogietime options.
   * 
   * @param {string} options.mode - The playback mode.
   * - `reference` - Playback "by reference". It means the server gave a
   *   reference to the file location (a file path string). The client will
   *   attempt to load and play the file completely independent of the server.
   * - `stream` - Streaming playback. The client will request a streaming resource
   *   from the server.
   */
  constructor(options) {
    this.state = 'stopped' // can be `playing`, `paused`, `stopped`

    this.queue = []
    this.currentQueueItemIndex = null
    this.shuffle = false
    this.repeat = false // can be `track` or `queue`, or false to disable
    this.muted = false
    this._defaultVolume = 1

    this._locked = false
    
    this._currentHowl = null
    this.currentlyPlayingId = 0

    this.trackObj = null

    this._callbacks = {
      'stateChange': [], // fired when the playback state changes (playing/paused/stopped)
      'trackChange': [], // fired when the currently playing track changes
      'controlChange': [], // fired when a control changes (shuffle, repeat)
      'queueChange': [] // fired when an item is added to or removed from the queue. does NOT fire when the queue drags n drops
    }

    this.options = options || {}

    this.consoleColor = '#d61fd0'
  }

  /**
   * Resumes playback, or begins new playback if a queue is given.
   * 
   * @param {(array|number)} [queue] - An array of track ID's to play, or a single track ID.
   * Will overwrite current queue with given queue.
   */
  play(queue = []) {
    console.log('%cPlaying/resuming audio playback', `color:${this.consoleColor};`)

    // wrap single id in array
    if (typeof queue === 'number') {
      queue = [queue]
    }

    // no queue given, just resume
    if (!queue.length) {
      this.resume()
      return
    }

    this._newPlayback(queue)
  }

  /**
   * Pauses playback.
   * 
   * @returns {boolean} True if the audio was paused, false if there was nothing to pause.
   */
  pause() {
    console.log('%cPausing audio playback', `color:${this.consoleColor};`)

    if (this._currentHowl !== null) {
      this._currentHowl.pause()
      this._stateChange('paused')

      return true
    } else {
      return false
    }
  }

  /**
   * Plays if paused, pauses if playing. Starts playback if the queue is not empty.
   */
  playPause() {
    if (this.state === 'paused') {
      this.play()
    } else if (this.state === 'playing') {
      this.pause()
    } else if (this.state === 'stopped' && this.queue.length) {
      this.play()
    }
  }

  /**
   * Resumes the song that was paused.
   * 
   * @returns {boolean} True if something is now playing.
   */
  resume() {
    // if music is paused, unpause it
    if (this.state === 'paused') {
      this._currentHowl.play()
      this._stateChange('playing')
      return true
    } 
    // if the player is stopped, but the queue is not empty, play the first
    // track in the queue. this can happen if the user clicks "add to queue" on
    // a track while no music is playing.
    else if (this.state === 'stopped' && this.queue.length) {
      this.playItemInQueue(0)
      return true
    } else {
      console.log('%cNo playback to resume or audio is already playing', `color:${this.consoleColor};`)
      return false
    }
  }

  /**
   * Stops playback and clears the queue.
   */
  async stop() {
    console.log('%cStopping audio playback', `color:${this.consoleColor};`)

    await this._saveTrackEndState()

    this.queue = []
    this.currentlyPlayingId = 0
    this.trackObj = null
    this.currentQueueItemIndex = null
    
    if (this._currentHowl !== null && this.state !== 'error') {
      this._currentHowl.stop()
      this._currentHowl.unload()
    }
    
    this._currentHowl = null
    this._stateChange('stopped')
  }

  /**
   * Plays the next song in the queue. Will end current playback if there's no
   * next song.
   *
   * @param {boolean} _prevSongWasCompleted - For internal use only. Used to
   * indicate if the song that just finished, finished at 100% listened. This is
   * needed because 100% completion happens in a Howler callback, a point at
   * which the state of the last song is already lost.
   */
  async next(_prevSongWasCompleted = false) {
    if (this.state === 'stopped') {
      console.log('%cPlayer is not playing anything', `color:${this.consoleColor};`)
      return
    }

    // TODO it would be better to cancel loading and go to next track
    if (this.state === 'loading') {
      return
    }

    await this._saveTrackEndState(_prevSongWasCompleted)

    // if repeating
    if (this.repeat === 'track') {
      console.log('%cRepeating current track', `color:${this.consoleColor};`)
      this.playItemInQueue(this.currentQueueItemIndex)
      return
    }

    // if shuffling
    if (this.shuffle) {
      console.log('%cPlaying random track in queue', `color:${this.consoleColor};`)
      this.playItemInQueue(__().randomNumberBetween(0, this.queue.length - 1))
      return
    }

    // if repeating, and we're at the end of the queue
    if (this.repeat === 'queue' && this.currentQueueItemIndex === this.queue.length - 1) {
      console.log('%cRestarting queue at beginning', `color:${this.consoleColor};`)
      this.playItemInQueue(0)
      return
    }

    let nextTrackId = this.queue[this.currentQueueItemIndex + 1]
        
    // if there's no next item, stop playback
    if (nextTrackId === undefined) {
      await this.stop()
      return
    }

    console.log('%cPlaying next track', `color:${this.consoleColor};`)

    this.playItemInQueue(this.currentQueueItemIndex + 1)
  }

  /**
   * Plays the previous item if we are still in the first 3 seconds of the current item,
   * otherwise restarts the currently playing item.
   */
  async previous() {
    if (this.state === 'stopped') {
      console.log('%cPlayer is not playing anything', `color:${this.consoleColor};`)
      return
    }

    // TODO it would be better to cancel loading and go to prev track
    if (this.state === 'loading') {
      return
    }

    // saving the state of the track
    await this._saveTrackEndState()

    // restart the current track if we are NOT within the first 3 seconds of it
    if (this.getCurrentPlaybackTime() >= 3) {
      console.log('%cRestarting current playback', `color:${this.consoleColor};`)

      // by seeking to 0 seconds instead of initing new playback with the same
      // track, there will only be a single music history entry for this track no
      // matter how many times the user restarts the song with the "prev" button
      this._currentHowl.seek(0)
    } 
    // if we ARE in the first 3 seconds, play the previous track if there is one
    else {
      // if shuffling
      if (this.shuffle) {
        console.log('%cPlaying random track in queue', `color:${this.consoleColor};`)
        this.playItemInQueue(__().randomNumberBetween(0, this.queue.length - 1))
        return
      }

      let prevTrackId = this.queue[this.currentQueueItemIndex - 1]

      // if there's no prev item, restart this item
      if (prevTrackId === undefined) {
        console.log('%cRestarting current playback', `color:${this.consoleColor};`)
        this._currentHowl.seek(0)
        return
      }

      console.log('%cPlaying previous track', `color:${this.consoleColor};`)

      this.playItemInQueue(this.currentQueueItemIndex - 1)
    }
  }

  /**
   * Updates the internal copy of the currently playing track row object.
   * 
   * @param {number} trackId
   */
  async _updateTrackObj(trackId) {
    this.trackObj = null
    let apiResponse = await Bridge.httpApi(`/music-track/${trackId}`)

    if (apiResponse.statusRange !== 2) {
      console.error('Player could not find track')
      return false
    }

    this.trackObj = apiResponse.response

    return true
  }

  /**
   * Plays a specific item in the queue and updates the instance to reflect the
   * change. This will use the playback mode set in the constructor options, but
   * that can be overridden with the 2nd parameter.
   *
   * @param {number} index - Array item index in the queue.
   * @param {number} forceMode - If set, playback will be forced in the given
   * mode.
   * @returns {boolean} Returns false if the file could not be loaded, otherwise
   * returns true.
   */
  async playItemInQueue(index, forceMode) {
    // prevents multiple howls if the user spams the next/prev buttons
    if (this._locked) {
      console.log('Woah, slow down there')
      return
    }

    this._locked = true

    // change our position in the queue even if the next data calls may fail.
    // this is so that the user can press "next"
    this.currentQueueItemIndex = index
    this.currentlyPlayingId = this.queue[index]

    // it is important to only change the state to loading after
    // currentlyPlayingId has been updated to the next track. this allows
    // listeners to know which track is now loading, while it's still loading.
    this._stateChange('loading')

    // if a song is already playing, unload it
    if (this._currentHowl instanceof Howl) {
      this._currentHowl.stop()
      this._currentHowl.unload()
    }

    // get the track object from the server. it will have everything we need to
    // know, no matter how we want to play it
    let trackDataSuccess = await this._updateTrackObj(this.currentlyPlayingId)
    if (!trackDataSuccess) {
      console.warn('API call to update trackObj failed')
      this._locked = false
      return false
    }

    // load the resource
    this._currentHowl = await this._newHowl(forceMode)

    // if something went wrong when loading the resource
    if (this._currentHowl === false) {
      this._trackPlaybackFailed()
      return false
    }

    // propagate track change event
    this._trackChange(this.currentlyPlayingId)

    // actually play the resource through the speakers
    this._currentHowl.play()

    this._stateChange('playing')
    this.createSystemNotification(this.currentlyPlayingId)

    this._addToServerPlaybackHistory()

    this._locked = false

    return true
  }

  /**
   * Returns a new howl object for interal use based on the track object in
   * this.trackObj. If the user has enabled song preloading, HTML5 web audio
   * will not be used.
   *
   * @param {number} forceMode - Playback mode.
   */
  async _newHowl(forceMode) {
    let actualMode = forceMode || this.options.mode
    let src

    switch (actualMode) {
      // need to make sure the file is available to us at the file path
      case 'reference':
        if (!await this.fileExists(this.trackObj.file.file_path)) return false
        src = this.formatFilePath(this.trackObj.file.file_path)
        break

      // streaming relies on a streamable url provided by cardinal server. we
      // need to explicitly ask for one for each track we want to play
      case 'stream':
        src = `${Bridge.httpApiUrl()}/music-track/${this.trackObj.id}/stream`
        break

      default:
        return false
    }

    if (!src) return false

    // if there is an excessively long loading time getting the stream, during
    // which the user presses "stop", this will catch that
    if (!this.trackObj) return false

    console.log(`%cStarting new audio playback in mode "${actualMode}" with resource ${src}`, `color:${this.consoleColor};`)
    
    return new Howl({
      'src': src,
      'html5': true,
      'format': [this.trackObj.file.file_extension],
      'volume': this._defaultVolume,
      'mute': this.muted,
      'loop': false,
      'onloaderror': async () => {
      console.log('loaderror')
      this._trackPlaybackFailed()
      },
      'onplayerror': async () => {
      console.log('playerror')
      this._trackPlaybackFailed()
      },
      'onend': async () => {
        await this.next(true)
      }
    })
  }

  /**
   * A general handler for when playback fails and we should to move to the next
   * item in the queue.
   */
  _trackPlaybackFailed() {
    console.warn(`Playback error for: ${this.trackObj.file.file_path}`)

    this.state = 'error'

    let tryNextSong = confirm(i18n('notification.cannot-load-music-file.message').replace('{{song}}', this.trackObj.file.file_path))
    
    if (!tryNextSong) {
      this.stop()
      return
    }
      
    // create a notification in the theme
    // __('music-app').el().notify({
    //   'id': 'player-cannot-load-file-' + this.trackObj.file.file_path,
    //   'title': i18n('notification.cannot-load-music-file.title'),
    //   'message': `${i18n('notification.cannot-load-music-file.message').replace('{{song}}', this.trackObj.file.file_path)}`,
    // })

    // unlock the player
    this._locked = false

    // go to the next song
    this.next()
  }

  /**
   * Mutes audio without otherwise interrupting it.
   */
  mute() {
    console.log('%cPlayback muted', `color:${this.consoleColor};`)

    this.muted = true

    if (this._currentHowl !== null) {
      this._currentHowl.mute(true)
    }
  }

  /**
   * Unmutes the audio.
   */
  unmute() {
    console.log('%cPlayback unmuted', `color:${this.consoleColor};`)

    this.muted = false

    if (this._currentHowl !== null) {
      this._currentHowl.mute(false)
    }
  }

  /**
   * Returns the number of seconds elapsed in the current playback, or null if
   * nothing is playing.
   *
   * @returns {(Number|null)}
   */
  getCurrentPlaybackTime() {
    if (this.state === 'stopped') {
      return null
    }

    // if the track has not yet loaded, return 0, because playback has not yet started.
    if (!(this._currentHowl instanceof Howl) || this._currentHowl.state() !== 'loaded') {
      return Number(0)
    }

    return this._currentHowl.seek()
  }

  /**
   * Seeks to a certain point in the current playback.
   * 
   * @param {number} seconds
   */
  seek(seconds) {
    console.log(`%cSeeking to ${seconds} seconds`, `color:${this.consoleColor};`)
    this._currentHowl.seek(seconds)

    // the idea here is that a seek should be considered a state change.
    // however, the playback state doesn't change. seeking can be performed
    // while playing or while paused... that state must be maintained through
    // this state "change"
    this._stateChange(this.state)
  }

  /**
   * Sets the shuffle mode to "true" or "false", and triggers "controlChange"
   * callbacks.
   *
   * @param {boolean} mode
   */
  setShuffle(mode) {
    if (typeof mode !== 'boolean') throw new Error('Shuffle mode can only be set to true or false')
    console.log(`%cPlayback shuffle set to ${mode}`, `color:${this.consoleColor};`)

    this.shuffle = mode

    this._controlChange()
  }

  /**
  * Sets the shuffle mode to "true" or "false", and triggers "controlChange"
  * callbacks.
  * 
  * @param {boolean} mode
  */
  setRepeat(mode) {
    if (mode !== 'track' && mode !== 'queue' && mode !== false) throw new Error('Repeat can only be set to "track", "queue" or false')
    console.log(`%cPlayback repeat set to ${mode}`, `color:${this.consoleColor};`)

    this.repeat = mode

    this._controlChange()
  }

  /**
  * Creates a system notification for the currently playing track.
  *
  * @param {number} trackId - Track ID. Defaults to the currently playing
  * track.
  */
  createSystemNotification(trackId) {
    let trackName = this.trackObj.track_title
    let artistName = this.trackObj.meta.artist
    let albumCover = undefined

    if (this.trackObj.artwork) {
      albumCover = this.trackObj.artwork.thumbs['75'].thumb_file
    }

    notifications.create(trackName, artistName, albumCover)
  }

  /**
   * Adds one or more tracks to the end of the current queue. New playback
   * cannot be started with this method, use `play()` instead.
   *
   * @param {(number|array)} trackIds - A track ID, or an array of track ID's
   * @param {number} [atIndex] - Optionally insert the new tracks at a certain
   * index in the queue.
   */
  add(trackIds, atIndex = null) {
    // wrap numerical track ID in an array
    if (typeof trackIds === 'number') {
      trackIds = [trackIds]
    }

    // add to the end of the queue
    if (atIndex === null) {
      for (let trackId of trackIds) {
        this.queue.push(trackId)
      }
    } 
    // at a certain index in the queue
    else {
      this.queue.splice(atIndex, 0, ...trackIds)
    }

    // trigger queueChange listeners
    this._queueChange()
  }

  /**
   * Removes one track from the queue. Tracks may be located anywhere in the
   * queue, even as previously played tracks.
   *
   * @param {number} index - The track index to remove.
   */
  remove(index) {
    this.queue.splice(index, 1)

    // trigger queueChange listeners
    this._queueChange()
  }

  /**
   * Removes all items from the queue (even previous items) except the currently
   * playing item.
   *
   * @param {string} [mode] - Queue clearing mode (default is `all`):
   * - `upcoming`: clears all upcoming items from the queue.
   * - `previous`: clears all previously played items from the queue.
   * - `all`: clears all previous and all upcoming items from the queue. Leaves
   *   the currently playing item as the only item in the queue.
   */
  clearQueue(mode = 'all') {
    console.log(`%cClearing queue (mode: ${mode})`, `color:${this.consoleColor};`)

    switch (mode) {
      case 'upcoming':
        this._clearQueueUpcoming()
        break
        
        case 'previous':
        this._clearQueuePrevious()
        break

      case 'all':
        this._clearQueuePrevious()
        this._clearQueueUpcoming()
        break
    }

    this._trackChange(this.currentlyPlayingId)
  }

  /**
   * Internal method for clearing the upcoming items in the queue. Invoked by `clearQueue`.
   * 
   * @private
   */
  _clearQueueUpcoming() {
    // do nothing if the currently playing item is the last item in the queue
    if (this.currentQueueItemIndex === this.queue.length - 1) return

    this.queue.splice(this.currentQueueItemIndex + 1)
  }

  /**
   * Internal method for clearing the upcoming items in the queue. Invoked by `clearQueue`.
   * 
   * @private
   */
  _clearQueuePrevious() {
    // do nothing if the currently playing item is the first item in the queue
    if (this.currentQueueItemIndex === 0) return

    this.queue.splice(0, this.currentQueueItemIndex)
    this.currentQueueItemIndex = 0
  }

  /**
   * Allows custom elements to quietly update the queue without interrupting or
   * changing the currently playing track in any way. Does not trigger any
   * callbacks. This exists primarily to allow the playback-queue to update the
   * Player queue after a user drags- n-drops the queue tracks.
   *
   * The currently playing track ID **must** be located somewhere in the
   * newQueue array.
   *
   * @param {array} newQueue - An Array to overwrite the queue with.
   */
  silentlyUpdateQueue(newQueue) {
    let newQueueCurrentlyPlayingIndex = newQueue.indexOf(this.currentlyPlayingId)

    if (newQueueCurrentlyPlayingIndex === -1) {
      throw new Error('Player cannot update the queue with a new queue that does not have the currently playing track ID somewhere in it')
    }

    this.queue = newQueue
    this.currentQueueItemIndex = newQueueCurrentlyPlayingIndex
  }

  /**
   * Begins playing the first item in the given queue, and saves the given queue
   * internally.
   *
   * This will stop any currently playing audio before beginning new audio.
   *
   * @param {array} queue - Array of track ID's.
   */
  async _newPlayback(queue) {
    if (!queue.length) throw new Error('Cannot begin playback of empty queue')

    // stop current playback
    if (this.state !== 'stopped') {
      await this.stop()
    }

    this.queue = queue

    this.playItemInQueue(0)
  }

  /**
   * Ensures that the file path is properly formatted for XHR.
   * 
   * @param {string} path
   * @returns {string}
   */
  formatFilePath(path) {
    let filePathParts = path.split(Bridge.sep)
    let fileName = filePathParts.pop()

    // encodes characters like '#' in the file path name
    return filePathParts.join(Bridge.sep) + Bridge.sep + encodeURIComponent(fileName) 
  }

  /**
   * Uses a XHR request to check if the file for the song exists. XHR is
   * preferrable over node fs because this runs in a renderer process and
   * because howler uses XHR as well.
   *
   * @param {string} path - The file path on the local system. Only works in
   * Electron, obviously.
   * @returns {boolean}
   */
  fileExists(path) {
    return new Promise((resolve, reject) => {

      path = this.formatFilePath(path)

      let xhr = new XMLHttpRequest()

      xhr.addEventListener('load', () => {
        resolve(true)
      })

      xhr.addEventListener('error', () => {
        resolve(false)
      })
      
      xhr.open('HEAD', path)
      xhr.send()

    })
  }
  
  /**
   * Add an entry to the playback history for the song that just started.
   * 
   * The values "0" will be updated on song end (when that data becomes
   * available). If the song doesn't end for whatever reason (crash, force
   * quit, bug), the values "0" will remain in the database and should be
   * taken to mean that "the song started, but it is not known when it ended".
   *
   * Or, it can mean that the user rapidly skipped next/prev though a queue.
   */
  async _addToServerPlaybackHistory() {
    // TODO change media-api call to RESTful api
    let apiResponse = await Bridge.httpApi('/media-api', 'POST', {
      'fn': 'addToMusicHistory',
      'args': [{
        'trackId': this.currentlyPlayingId,
        'weather': null,
        'secondsListened': 0,
        'percentListened': 0,
        'device': this.options.device || '(Unknown)'
      }]
    })

    if (apiResponse.statusRange !== 2) {
      console.warn('Error adding entry to playback history with API')
    }
  }

 /**
  * When a track ends in the following cases:
  * 
  * - Track ends normally
  * - User pressed next
  * - User pressed prev and it wasn't within the restart time
  * - User presses stop
  * 
  * The state of the track will be saved in the database.
  * 
  * The Player must still be in the state of the currently playing song when
  * this is triggered.
  * 
  * @param {boolean} trackPlaybackCompleted - Used to indicate that the track
  * has completed 100% of its playback. This is only true when this method is
  * triggered by the Howler `onend` callback.
  */
  async _saveTrackEndState(trackPlaybackCompleted) {
    // if the last playback resulted in an error, or is still loading, we don't
    // want to save it in the playback history
    if (this.state === 'error' || this.state === 'loading') {
      return true
    }

    // find the history entry for this track
    let historyQuery = await new Query({
      'table': 'music_history',
      'itemsPerPage': 1,
      'columns': {
        'music_history_track_id': this.currentlyPlayingId
      },
      'orderBy': {
        'music_history_timestamp': 'DESC'
      }
    })

    // there should always be an entry (it was created when the song started),
    // but, if the client->server connection is lost while a track is playing,
    // make sure to not break the state when the track eventually ends without a
    // server connection
    if (!historyQuery.results.length) {
      console.warn('Player could not find music history entry')
      return false
    }

    let secondsListened
    let percentListened
    
    // since this method was triggered by the Howler `onend` callback, Howler
    // has already deleted the track duration. there is no earlier callback
    // available. fortunately, we can get the values from the Player object
    if (trackPlaybackCompleted) {
      secondsListened = this.trackObj.track_duration
      percentListened = 100
    } 
    // get the elapsed seconds from Howler
    else {
      secondsListened = this.getCurrentPlaybackTime()
      percentListened = Math.ceil((secondsListened / this._currentHowl._duration) * 100)
    }
    
    // save the amount of time that the user listened to the song for
    let apiReq = await Bridge.httpApi('/db-api', 'POST', {
      'fn': 'update',
      'args': ['music_history', historyQuery.results[0].id, {
        'music_history_seconds_listened': secondsListened,
        'music_history_percent_listened': percentListened
      }]
    })

    if (apiReq.statusRange !== 2) {
      console.warn('Could not update track state at end of track')
      return false
    }

    return true
  }

  /**
   * Invoked by the public methods play(), pause(), etc, this will change the
   * Player state inernally and trigger appropiate registered callbacks.
   *
   * @param {string} newState - The new state to become. `playing`, `paused`,
   * `stopped`, `loading`. Note: this will not play/pause/stop the music, this will only
   * refect that change internally after the main public method performs the
   * main play/pause/stop action.
   */
  _stateChange(newState) {
    //console.log(`%cPlayer state change triggered: ${newState}`, `color:${this.consoleColor};`)

    this.state = newState

    if (this._callbacks.stateChange.length) {
      for (let cb of this._callbacks.stateChange) {
        cb(newState)
      }
    }
  }

  /**
   * Invoked by the public methods prev() and next(), this is to propagate the
   * track change to listeners.
   *
   * @param {string} newTrackId - The new track that is now playing.
   */
  _trackChange(newTrackId) {
    //console.log(`%cPlayer track change triggered ${newTrackId}`, `color:${this.consoleColor};`)

    if (this._callbacks.trackChange.length) {
      for (let cb of this._callbacks.trackChange) {
        cb(newTrackId)
      }
    }
  }

  /**
   * Invoked whenever a "control" changes, like the shuffle and repeat controls.
   */
  _controlChange() {
    //console.log('%cPlayer control change triggered', `color:${this.consoleColor};`)

    if (this._callbacks.controlChange.length) {
      for (let cb of this._callbacks.controlChange) {
        cb()
      }
    }
  }

  /**
   * Invoked whenever a track is added to or removed from an existing queue.
   */
  _queueChange() {
    //console.log('%cPlayer queue change triggered', `color:${this.consoleColor};`)

    if (this._callbacks.queueChange.length) {
      for (let cb of this._callbacks.queueChange) {
        cb()
      }
    }
  }

  /**
   * Allows for other code to register callbacks.
   * 
   * @param {string} event - One of these events:
   * - `stateChange`: When the player state changes, eg. played, paused, stopped.
   * - `trackChange`: When a new track is played.
   * @param {Function} cb - Callback function.
   */
  on(event, cb) {
    this._callbacks[event].push(cb)
  }

  /**
   * Removes a previously registered event handler.
   * 
   * @param {string} event - The event type that the callback belongs to.
   * @param {Function} cb - Reference to the previously registered callback function.
   */
  off(event, cb) {
    this._callbacks[event].forEach((fn, index) => {
      if (fn === cb) {
        this._callbacks[event].splice(index, 1)
      }
    })
  }

  /**
   * Erases all callbacks that were registered with `on`.
   */
  cleanup() {
    for (let type in this._callbacks) {
      this._callbacks[type] = []
    }
  }
}