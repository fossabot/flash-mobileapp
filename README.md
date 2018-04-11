# FLASH - Mobile Wallet
This is the JavaScript and [React Native](http://facebook.github.io/react-native/) source code for [FLASH](https://www.flashcoin.io) mobile wallet.


## Installation

``` bash
git clone https://github.com/flash-coin/flash-mobileapp.git FLASHWallet
cd FLASHWallet
npm install
```


## Post Installation

### Add reserved rules to uglifyjs.

- Modify node_modules/metro/src/JSTransformer/worker/minify.js file and add __reserved__ keywords as mentioned below.

 ``` javascript
...................................................
function minify(inputCode, inputMap) {
  const result = uglify.minify(inputCode, {
    mangle: { toplevel: true, reserved: [ //<= Add here reserved keyword
        'Buffer',
        'BigInteger',
        'Point',
        'ECPubKey',
        'ECKey',
        'sha512_asm',
        'asm',
        'ECPair',
        'HDNode'
      ] },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true },
...................................................
```


## Run Application locally

Node comes with npm, which lets you install the React Native command line interface.

``` bash
npm install -g react-native-cli
```

Run command your React Native project folder:

``` bash
react-native run-ios    // for iOS
         OR
react-native run-android    // for Android
```

`react-native run-ios` or `react-native run-android` is just one way to run your app. You can also run it directly from within Xcode and Android Studio respectively or [Nuclide](https://nuclide.io/). You can refer [React Native Get Started](https://facebook.github.io/react-native/docs/getting-started.html) guide for more info.


## Known Issues


## Reporting Issues

[Bugs | New Features](https://github.com/flash-coin/flash-mobileapp/issues)


## Contributing
Check the issues and pull requests to see if the idea or bug you want to share about is already present. If you don't see it, do one of the following:

* If it is a small change, just fork the project and create a pull request.
* If it is major, start by opening an issue.


## Help Wanted!

If you're familiar with React Native, and you'd like to see this project progress, please consider contributing.


## License

Please see [LICENSE](LICENSE) for more info.