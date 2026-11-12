/* Fake file system (Selah's Documents folder) kept in memory. */
const FS = {};

function reset(initial) {
  Object.keys(FS).forEach((k) => delete FS[k]);
  Object.assign(FS, initial || { 'file:///docs/': { dirs: [], files: {} } });
}
reset();

const enc = (name) => String(name).split('/').map(encodeURIComponent).join('/');

function toUri(parts) {
  let out = '';
  parts.forEach((p, i) => {
    const piece = typeof p === 'string' ? (i === 0 ? p : enc(p)) : p.uri;
    out = i === 0 ? piece : out.replace(/\/$/, '') + '/' + piece.replace(/^\//, '');
  });
  return out;
}

function split(uri) {
  const u = uri.replace(/\/$/, '');
  const i = u.lastIndexOf('/');
  return [u.slice(0, i + 1), decodeURIComponent(u.slice(i + 1))];
}

class Directory {
  constructor(...parts) {
    this.uri = toUri(parts).replace(/\/?$/, '/');
  }
  get name() {
    return split(this.uri)[1];
  }
  get exists() {
    return Boolean(FS[this.uri]);
  }
  get size() {
    const node = FS[this.uri];
    if (!node) return null;
    return Object.values(node.files).reduce((sum, e) => sum + (e.bytes ? e.bytes.length : e.size || 0), 0);
  }
  create() {
    if (!FS[this.uri]) FS[this.uri] = { dirs: [], files: {} };
    const [parent, name] = split(this.uri);
    if (FS[parent] && !FS[parent].dirs.includes(name)) FS[parent].dirs.push(name);
  }
  list() {
    const node = FS[this.uri];
    if (!node) throw new Error(`Directory does not exist: ${this.uri}`);
    return [
      ...node.dirs.map((d) => new Directory(this.uri + enc(d))),
      ...Object.keys(node.files).map((f) => new File(this.uri + enc(f)))
    ];
  }
}

class File {
  constructor(...parts) {
    this.uri = toUri(parts);
  }
  get name() {
    return split(this.uri)[1];
  }
  get extension() {
    const m = this.name.match(/\.[^.]+$/);
    return m ? m[0] : '';
  }
  entry() {
    const [dir, name] = split(this.uri);
    return FS[dir] ? FS[dir].files[name] : undefined;
  }
  get exists() {
    return Boolean(this.entry());
  }
  get size() {
    const e = this.entry();
    if (!e) return null;
    return e.bytes ? e.bytes.length : e.size;
  }
  open() {
    const e = this.entry();
    if (!e) throw new Error(`File does not exist: ${this.uri}`);
    const bytes = e.bytes || new Uint8Array(0);
    return {
      size: bytes.length,
      offset: 0,
      readBytesSync(len) {
        const out = bytes.subarray(this.offset, this.offset + len);
        this.offset += out.length;
        return out;
      },
      close() {}
    };
  }
  create() {
    const [dir, name] = split(this.uri);
    if (!FS[dir]) throw new Error(`Folder missing for ${this.uri}`);
    FS[dir].files[name] = { size: 0, content: '' };
  }
  async text() {
    const e = this.entry();
    if (!e) throw new Error(`File does not exist: ${this.uri}`);
    return e.content;
  }
  writeSync(content) {
    const [dir, name] = split(this.uri);
    if (!FS[dir]) throw new Error(`Folder missing for ${this.uri}`);
    FS[dir].files[name] =
      content instanceof Uint8Array
        ? { bytes: Uint8Array.from(content), size: content.length }
        : { size: String(content).length, content: String(content) };
  }
  async write(content) {
    this.writeSync(content);
  }
  delete() {
    const [dir, name] = split(this.uri);
    if (!FS[dir] || !FS[dir].files[name]) throw new Error(`File does not exist: ${this.uri}`);
    delete FS[dir].files[name];
  }
  async copy(dest) {
    const [dir, name] = split(dest.uri);
    FS[dir].files[name] = { ...(this.entry() || { size: 0, content: '' }) };
  }
}

module.exports = {
  Directory,
  File,
  Paths: {
    get document() {
      return new Directory('file:///docs');
    },
    get cache() {
      return new Directory('file:///cache');
    }
  },
  __FS: FS,
  __reset: reset
};
