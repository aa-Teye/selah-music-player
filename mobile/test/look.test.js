// Guards for how Selah looks: nothing that resembles an AI product (sparkle icons, "AI" features).
const fs = require('fs');
const path = require('path');

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

const files = [path.join(__dirname, '..', 'App.js'), ...sourceFiles(path.join(__dirname, '..', 'src'))];

test('no AI-looking icons or AI features anywhere in the app', () => {
  const offenders = [];
  files.forEach((file) => {
    const text = fs.readFileSync(file, 'utf8');
    if (/name=["']sparkles|icon:\s*['"]sparkles|["']creation["']|["']auto-awesome["']|["']robot/.test(text)) offenders.push(`${file}: sparkle/robot icon`);
    if (/\bAI\b|Gemini|ChatGPT/.test(text)) offenders.push(`${file}: mentions AI`);
  });
  expect(offenders).toEqual([]);
});

test('no StyleSheet.absoluteFillObject: this React Native removed it, so it silently does nothing', () => {
  const offenders = files.filter((file) => fs.readFileSync(file, 'utf8').includes('absoluteFillObject'));
  expect(offenders).toEqual([]);
  expect(require('react-native').StyleSheet.absoluteFill).toMatchObject({ position: 'absolute', top: 0, bottom: 0 });
});

test('Libraries is about music now: no Bible-app or hymn-website links', () => {
  const offenders = files.filter((file) =>
    /YouVersion|Open Hymnal|Daily Audio Bible|Blue Letter Bible|DIGITAL_LIBRARIES/.test(fs.readFileSync(file, 'utf8'))
  );
  expect(offenders).toEqual([]);
});
