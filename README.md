# Boogietime.js

*To see Boogietime.js in action, check out the
[Cardinal apps](https://cardinalapps.xyz).*

Boogietime.js is an ES6 JavaScript package for playing audio in the browser. It
is used by [Cardinal Music](https://cardinalapps.xyz/en/cardinal-music) It
supports playing local audio files on the disk and also streaming audio from
[Cardinal Server](https://cardinalapps.xyz/en/cardinal-server).

## API Reference

A reference of all public Boogietime.js methods is available in
**[DOCS.md](DOCS.md)**.

## Dependencies

Howler.js has been modified into a vanilla ES6 package and bundled into the core
package instead of listed as a dependency. This is to get around [this
issue](https://github.com/goldfire/howler.js/issues/688) since it seems that
Howler is designed for use with a transpiler.

The other private dependencies will be removed soon.

## License

Licensed under the Mozilla Public License 2.0.