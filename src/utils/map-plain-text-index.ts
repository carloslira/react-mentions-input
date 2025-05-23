import type { SuggestionDataSource } from '../types';

import type { MarkupIteratee, TextIteratee } from './iterate-mentions-markup';
import iterateMentionsMarkup from './iterate-mentions-markup';

// For the passed character index in the plain text string, returns the corresponding index
// in the marked up value string.
// If the passed character index lies inside a mention, the value of `inMarkupCorrection` defines the
// correction to apply:
//   - 'START' to return the index of the mention markup's first char (default)
//   - 'END' to return the index after its last char
//   - 'NULL' to return null
const mapPlainTextIndex = (
  value: string,
  dataSources: Array<SuggestionDataSource>,
  indexInPlainText: number | null,
  inMarkupCorrection: 'START' | 'END' | 'NULL' = 'START',
) => {
  if (typeof indexInPlainText !== 'number') {
    return indexInPlainText;
  }

  let result: number | null | undefined = undefined;

  const markupIteratee: MarkupIteratee = (
    markup,
    index,
    mentionPlainTextIndex,
    _id,
    display,
  ) => {
    if (result !== undefined) {
      return;
    }

    if (mentionPlainTextIndex + display.length > indexInPlainText) {
      // found the corresponding position inside current match,
      // return the index of the first or after the last char of the matching markup
      // depending on whether the `inMarkupCorrection`
      if (inMarkupCorrection === 'NULL') {
        result = null;
      } else {
        result = index + (inMarkupCorrection === 'END' ? markup.length : 0);
      }
    }
  };

  const textIteratee: TextIteratee = (substr, index, substrPlainTextIndex) => {
    if (result !== undefined) return;

    if (substrPlainTextIndex + substr.length >= indexInPlainText) {
      // found the corresponding position in the current plain text range
      result = index + indexInPlainText - substrPlainTextIndex;
    }
  };

  iterateMentionsMarkup(value, dataSources, markupIteratee, textIteratee);

  // when a mention is at the end of the value and we want to get the caret position
  // at the end of the string, result is undefined
  return result === undefined ? value.length : result;
};

export default mapPlainTextIndex;
