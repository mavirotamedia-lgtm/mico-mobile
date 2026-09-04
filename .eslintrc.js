// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  rules: {
    // Bu proje React Compiler kullanmiyor (babel.config.js'de etkin degil);
    // bu iki kural derleyici-guvenligi icin var ve useRef(...).current ile
    // stabil Animated.Value/state olusturma gibi standart, guvenli RN
    // kaliplarini da isaretliyor.
    'react-hooks/refs': 'off',
    'react-hooks/set-state-in-effect': 'off',
  },
};
