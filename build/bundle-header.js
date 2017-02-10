'use strict';

const combineSourceMap = require('combine-source-map');
const fs = require('fs');

module.exports = function combine (options) {
  options.headerContent = options.headerContent
    || fs.readFileSync(options.headerFilename).toString();

  const headerContent = (options.replacements || [])
    .reduce((header, [rx, str]) => header.replace(rx, str), options.headerContent);

  const filename = options.filename;
  const combiner = combineSourceMap.create();
  const combinedCode = headerContent + options.code;
  const offset = { line: newlinesIn(headerContent) };

  combiner.addFile({
    sourceFile: options.headerFilename,
    source: headerContent,
  }, { line: 1 });

  if (options.map) {
    combiner._addExistingMap('', combinedCode, options.map, offset);
  }
  else {
    combiner.addFile({
      sourceFile: '',
      source: combinedCode,
    }, offset);
  }

  const newMap = combiner.generator.toJSON();
  newMap.file = filename;

  return {
    filename,
    code: `${combineSourceMap.removeComments(combinedCode)}\n//# sourceMappingURL=${filename}.map\n`,
    map: newMap,
  };
};

function newlinesIn (src) {
  if (!src) { return 0; }

  const newlines = src.match(/\n/g);

  return newlines ? newlines.length : 0;
}
