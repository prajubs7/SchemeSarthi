module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Required by Reanimated 4; must stay last.
  plugins: ['react-native-worklets/plugin'],
};
