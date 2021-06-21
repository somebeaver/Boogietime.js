/**
 * @file - Helper functions for working with system level notifications.
 */

/**
 * Creates a system notification if we have permission to do so, and if the user
 * allows them using the in-app settings.
 */
export async function create(title, description, image) {
  if (!await canSendNotification()) return

  let userGrantedPermission = window.localStorage.getItem('notification_on_song_change')
  if (!JSON.parse(userGrantedPermission)) return

  new window.Notification(title, {
    'body': description,
    'icon': image,
    'lang': Router.currentLang,
    'silent': true
  })
}

/**
 * Checks with  the system to see if we have permission to send notifications.
 *
 * @returns {boolean}
 */
function canSendNotification() {
  return new Promise((resolve, reject) => {

    // if we already have permission
    if (window.Notification.permission === 'granted') {
      resolve(true)
    }

    // ask for permission unless the user explicitly denied it
    if (window.Notification.permission !== 'denied') {
      window.Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    }
    
  })
}